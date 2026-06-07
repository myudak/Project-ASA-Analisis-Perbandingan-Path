from __future__ import annotations

import argparse
import csv
import heapq
import math
import random
import statistics
import time
from dataclasses import dataclass
from itertools import permutations
from pathlib import Path
from typing import Callable

import matplotlib.pyplot as plt


Point = tuple[float, float]
Cell = tuple[int, int]
GridPath = list[Cell]
PointPath = list[Point]

PROJECT_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_DATA_DIR = PROJECT_ROOT / "results" / "data"
DEFAULT_FIGURES_DIR = PROJECT_ROOT / "results" / "figures"

SCENARIOS = ("Mudah", "Sedang", "Sulit", "Padat")
SEED_COUNT = 5
GRID_WIDTH = 60
GRID_HEIGHT = 40
START: Cell = (3, 20)
GOAL: Cell = (56, 20)
DETAIL_SCENARIO = "Sulit"
DETAIL_SEED = 4
ALGORITHM_ORDER = ("Brute Force", "UCS", "GBFS", "A*", "RRT*")
GRID_ALGORITHM_ORDER = ("UCS", "GBFS", "A*")


@dataclass(frozen=True)
class Circle:
    x: float
    y: float
    r: float


@dataclass(frozen=True)
class Rect:
    x1: float
    y1: float
    x2: float
    y2: float


@dataclass
class MapScenario:
    name: str
    width: int
    height: int
    circles: list[Circle]
    rects: list[Rect]
    start: Cell
    goal: Cell


@dataclass(frozen=True)
class RunResult:
    path: GridPath | PointPath
    cost: float
    processed: int
    success: bool


@dataclass(frozen=True)
class RRTStarResult(RunResult):
    nodes: PointPath
    parent: list[int]


def is_free_point(scenario: MapScenario, point: Point, margin: float = 0.0) -> bool:
    x, y = point
    if x < 0 or y < 0 or x >= scenario.width or y >= scenario.height:
        return False

    for circle in scenario.circles:
        if (x - circle.x) ** 2 + (y - circle.y) ** 2 <= (circle.r + margin) ** 2:
            return False

    for rect in scenario.rects:
        inside_x = rect.x1 - margin <= x <= rect.x2 + margin
        inside_y = rect.y1 - margin <= y <= rect.y2 + margin
        if inside_x and inside_y:
            return False

    return True


def is_free_cell(scenario: MapScenario, cell: Cell) -> bool:
    x, y = cell
    return is_free_point(scenario, (x + 0.5, y + 0.5))


def line_free(scenario: MapScenario, start: Point, goal: Point, step: float = 1.0) -> bool:
    distance = math.dist(start, goal)
    sample_count = max(1, int(distance / step))

    for i in range(sample_count + 1):
        t = i / sample_count
        point = (
            start[0] + (goal[0] - start[0]) * t,
            start[1] + (goal[1] - start[1]) * t,
        )
        if not is_free_point(scenario, point):
            return False

    return True


def neighbors8(scenario: MapScenario, cell: Cell) -> list[tuple[Cell, float]]:
    x, y = cell
    neighbors: list[tuple[Cell, float]] = []

    for dx, dy in (
        (-1, 0),
        (1, 0),
        (0, -1),
        (0, 1),
        (-1, -1),
        (-1, 1),
        (1, -1),
        (1, 1),
    ):
        neighbor = (x + dx, y + dy)
        if not (0 <= neighbor[0] < scenario.width and 0 <= neighbor[1] < scenario.height):
            continue
        if not is_free_cell(scenario, neighbor):
            continue

        start_center = (x + 0.5, y + 0.5)
        neighbor_center = (neighbor[0] + 0.5, neighbor[1] + 0.5)
        if line_free(scenario, start_center, neighbor_center, step=0.5):
            neighbors.append((neighbor, math.sqrt(dx * dx + dy * dy)))

    return neighbors


def reconstruct(parent: dict[Cell, Cell], start: Cell, goal: Cell) -> GridPath:
    if goal not in parent and goal != start:
        return []

    current = goal
    path = [current]
    while current != start:
        current = parent[current]
        path.append(current)

    path.reverse()
    return path


def cell_center(cell: Cell) -> Point:
    return (cell[0] + 0.5, cell[1] + 0.5)


def path_cost_cells(path: GridPath) -> float:
    if not path:
        return float("inf")
    return sum(math.dist(path[i], path[i + 1]) for i in range(len(path) - 1))


def brute_force_waypoints(
    scenario: MapScenario,
    max_waypoints: int = 3,
    max_candidates: int = 24,
) -> RunResult:
    start = cell_center(scenario.start)
    goal = cell_center(scenario.goal)
    raw_candidates: list[Point] = []
    priority_raw_candidates: list[Point] = []

    # The brute-force baseline enumerates short waypoint sequences from a
    # bounded candidate set. Without this bound, permutations grow too quickly.
    for x in (10, 18, 24, 30, 36, 42, 50):
        for y in (5, 10, 15, 20, 25, 30, 35):
            raw_candidates.append((x + 0.5, y + 0.5))

    for rect in scenario.rects:
        pad = 2.5
        for x in (rect.x1 - pad, rect.x2 + pad):
            for y in (rect.y1 - pad, rect.y2 + pad):
                priority_raw_candidates.append((x, y))
        priority_raw_candidates.extend(
            [
                ((rect.x1 + rect.x2) / 2, rect.y1 - pad),
                ((rect.x1 + rect.x2) / 2, rect.y2 + pad),
                (rect.x1 - pad, (rect.y1 + rect.y2) / 2),
                (rect.x2 + pad, (rect.y1 + rect.y2) / 2),
            ]
        )

    for circle in scenario.circles:
        radius = circle.r + 2.4
        for k in range(8):
            angle = math.tau * k / 8
            raw_candidates.append(
                (circle.x + radius * math.cos(angle), circle.y + radius * math.sin(angle))
            )

    def clean_candidates(points: list[Point], seen: set[tuple[float, float]]) -> list[Point]:
        cleaned = []
        for point in points:
            key = (round(point[0], 1), round(point[1], 1))
            if key in seen or not is_free_point(scenario, point):
                continue
            seen.add(key)
            cleaned.append(point)
        return cleaned

    seen: set[tuple[float, float]] = set()
    priority_candidates = clean_candidates(priority_raw_candidates, seen)
    candidates = clean_candidates(raw_candidates, seen)

    sx, sy = start
    gx, gy = goal
    line_length = max(1e-9, math.dist(start, goal))

    def corridor_score(point: Point) -> float:
        px, py = point
        det = abs((gx - sx) * (sy - py) - (sx - px) * (gy - sy))
        perpendicular = det / line_length
        return math.dist(start, point) + math.dist(point, goal) + 0.35 * perpendicular

    priority_candidates.sort(key=corridor_score)
    candidates.sort(key=corridor_score)
    priority_limit = priority_candidates[:10]
    candidates = priority_limit + candidates[: max(0, max_candidates - len(priority_limit))]

    visibility_cache: dict[tuple[tuple[float, float], tuple[float, float]], bool] = {}

    def segment_free(a: Point, b: Point) -> bool:
        key = tuple(
            sorted(((round(a[0], 2), round(a[1], 2)), (round(b[0], 2), round(b[1], 2))))
        )
        if key not in visibility_cache:
            visibility_cache[key] = line_free(scenario, a, b, step=0.75)
        return visibility_cache[key]

    best_path: PointPath = []
    best_cost = float("inf")
    checked_routes = 1

    if segment_free(start, goal):
        best_path = [start, goal]
        best_cost = math.dist(start, goal)

    for depth in range(1, max_waypoints + 1):
        for sequence in permutations(candidates, depth):
            checked_routes += 1
            route = [start, *sequence, goal]
            route_cost = 0.0
            feasible = True

            for a, b in zip(route, route[1:]):
                route_cost += math.dist(a, b)
                if route_cost >= best_cost or not segment_free(a, b):
                    feasible = False
                    break

            if feasible and route_cost < best_cost:
                best_path = route
                best_cost = route_cost

    return RunResult(best_path, best_cost, checked_routes, bool(best_path))


def uniform_cost_search(scenario: MapScenario) -> RunResult:
    start, goal = scenario.start, scenario.goal
    queue = [(0.0, start)]
    distance = {start: 0.0}
    parent: dict[Cell, Cell] = {}
    processed = 0
    visited: set[Cell] = set()

    while queue:
        current_cost, current = heapq.heappop(queue)
        if current in visited:
            continue

        visited.add(current)
        processed += 1
        if current == goal:
            break

        for neighbor, edge_cost in neighbors8(scenario, current):
            new_cost = current_cost + edge_cost
            if new_cost < distance.get(neighbor, float("inf")):
                distance[neighbor] = new_cost
                parent[neighbor] = current
                heapq.heappush(queue, (new_cost, neighbor))

    path = reconstruct(parent, start, goal) if goal in distance else []
    return RunResult(path, path_cost_cells(path), processed, bool(path))


def greedy_best_first_search(scenario: MapScenario) -> RunResult:
    start, goal = scenario.start, scenario.goal

    def heuristic(cell: Cell) -> float:
        return math.dist(cell, goal)

    queue = [(heuristic(start), 0.0, start)]
    distance = {start: 0.0}
    parent: dict[Cell, Cell] = {}
    processed = 0
    visited: set[Cell] = set()

    while queue:
        _, current_cost, current = heapq.heappop(queue)
        if current in visited:
            continue

        visited.add(current)
        processed += 1
        if current == goal:
            break

        for neighbor, edge_cost in neighbors8(scenario, current):
            if neighbor in visited:
                continue
            new_cost = current_cost + edge_cost
            if new_cost < distance.get(neighbor, float("inf")):
                distance[neighbor] = new_cost
                parent[neighbor] = current
                heapq.heappush(queue, (heuristic(neighbor), new_cost, neighbor))

    path = reconstruct(parent, start, goal) if goal in distance else []
    return RunResult(path, path_cost_cells(path), processed, bool(path))


def a_star_search(scenario: MapScenario) -> RunResult:
    start, goal = scenario.start, scenario.goal

    def heuristic(cell: Cell) -> float:
        return math.dist(cell, goal)

    queue = [(heuristic(start), 0.0, start)]
    distance = {start: 0.0}
    parent: dict[Cell, Cell] = {}
    processed = 0
    visited: set[Cell] = set()

    while queue:
        _, current_cost, current = heapq.heappop(queue)
        if current in visited:
            continue

        visited.add(current)
        processed += 1
        if current == goal:
            break

        for neighbor, edge_cost in neighbors8(scenario, current):
            new_cost = current_cost + edge_cost
            if new_cost < distance.get(neighbor, float("inf")):
                distance[neighbor] = new_cost
                parent[neighbor] = current
                priority = new_cost + heuristic(neighbor)
                heapq.heappush(queue, (priority, new_cost, neighbor))

    path = reconstruct(parent, start, goal) if goal in distance else []
    return RunResult(path, path_cost_cells(path), processed, bool(path))


def rrt_star(
    scenario: MapScenario,
    seed: int,
    max_iter: int = 1200,
    step_size: float = 2.5,
    radius: float = 5.0,
    goal_sample_rate: float = 0.12,
) -> RRTStarResult:
    random_source = random.Random(seed)
    start = cell_center(scenario.start)
    goal = cell_center(scenario.goal)
    nodes: PointPath = [start]
    parent = [-1]
    cost = [0.0]
    goal_index: int | None = None

    def sample() -> Point:
        if random_source.random() < goal_sample_rate:
            return goal
        return (
            random_source.uniform(0, scenario.width - 1e-3),
            random_source.uniform(0, scenario.height - 1e-3),
        )

    def nearest(point: Point) -> int:
        return min(range(len(nodes)), key=lambda i: math.dist(nodes[i], point))

    def steer(a: Point, b: Point) -> Point:
        distance = math.dist(a, b)
        if distance <= step_size:
            return b
        return (
            a[0] + (b[0] - a[0]) * step_size / distance,
            a[1] + (b[1] - a[1]) * step_size / distance,
        )

    for _ in range(max_iter):
        random_point = sample()
        nearest_index = nearest(random_point)
        new_point = steer(nodes[nearest_index], random_point)

        if not is_free_point(scenario, new_point):
            continue
        if not line_free(scenario, nodes[nearest_index], new_point):
            continue

        near_indices = [
            i
            for i, point in enumerate(nodes)
            if math.dist(point, new_point) <= radius and line_free(scenario, point, new_point)
        ]
        best_parent = nearest_index
        best_cost = cost[nearest_index] + math.dist(nodes[nearest_index], new_point)

        for i in near_indices:
            candidate_cost = cost[i] + math.dist(nodes[i], new_point)
            if candidate_cost < best_cost:
                best_parent = i
                best_cost = candidate_cost

        nodes.append(new_point)
        parent.append(best_parent)
        cost.append(best_cost)
        new_index = len(nodes) - 1

        for i in near_indices:
            new_cost = best_cost + math.dist(new_point, nodes[i])
            if new_cost < cost[i] and line_free(scenario, new_point, nodes[i]):
                parent[i] = new_index
                cost[i] = new_cost

        if math.dist(new_point, goal) <= step_size and line_free(scenario, new_point, goal):
            goal_cost = best_cost + math.dist(new_point, goal)
            if goal_index is None:
                nodes.append(goal)
                parent.append(new_index)
                cost.append(goal_cost)
                goal_index = len(nodes) - 1
            elif goal_cost < cost[goal_index]:
                parent[goal_index] = new_index
                cost[goal_index] = goal_cost

    if goal_index is None:
        return RRTStarResult([], float("inf"), len(nodes), False, nodes, parent)

    path: PointPath = []
    index = goal_index
    while index != -1:
        path.append(nodes[index])
        index = parent[index]
    path.reverse()

    return RRTStarResult(path, cost[goal_index], len(nodes), True, nodes, parent)


def scenario_from_seed(kind: str, seed: int) -> MapScenario:
    random_source = random.Random(seed)
    circles: list[Circle] = []
    rects: list[Rect] = []

    if kind == "Mudah":
        for _ in range(5):
            circles.append(
                Circle(
                    random_source.uniform(15, 45),
                    random_source.uniform(8, 32),
                    random_source.uniform(2.0, 3.5),
                )
            )
    elif kind == "Sedang":
        for _ in range(10):
            circles.append(
                Circle(
                    random_source.uniform(12, 48),
                    random_source.uniform(5, 35),
                    random_source.uniform(2.0, 3.8),
                )
            )
        rects.extend([Rect(29, 0, 31, 12), Rect(29, 28, 31, 40)])
    elif kind == "Sulit":
        rects.extend([Rect(18, 0, 21, 26), Rect(36, 14, 39, 40)])
        for _ in range(8):
            circles.append(
                Circle(
                    random_source.uniform(12, 48),
                    random_source.uniform(6, 34),
                    random_source.uniform(2.0, 3.0),
                )
            )
    elif kind == "Padat":
        for _ in range(19):
            circles.append(
                Circle(
                    random_source.uniform(9, 51),
                    random_source.uniform(4, 36),
                    random_source.uniform(1.8, 3.5),
                )
            )
        rects.extend([Rect(25, 0, 27, 15), Rect(35, 25, 37, 40)])
    else:
        raise ValueError(f"Unknown scenario kind: {kind}")

    scenario = MapScenario(kind, GRID_WIDTH, GRID_HEIGHT, circles, rects, START, GOAL)
    start_point = cell_center(START)
    goal_point = cell_center(GOAL)
    scenario.circles = [
        circle
        for circle in scenario.circles
        if math.dist((circle.x, circle.y), start_point) > circle.r + 4
        and math.dist((circle.x, circle.y), goal_point) > circle.r + 4
    ]
    return scenario


def run_grid_algorithm(
    scenario: MapScenario,
    algorithm: Callable[[MapScenario], RunResult],
) -> RunResult:
    return algorithm(scenario)


def run_experiment(
    data_dir: Path = DEFAULT_DATA_DIR,
    figures_dir: Path = DEFAULT_FIGURES_DIR,
) -> tuple[Path, Path, Path, Path, Path, list[dict[str, object]]]:
    data_dir.mkdir(parents=True, exist_ok=True)
    figures_dir.mkdir(parents=True, exist_ok=True)

    grid_algorithms: tuple[tuple[str, Callable[[MapScenario], RunResult]], ...] = (
        ("UCS", uniform_cost_search),
        ("GBFS", greedy_best_first_search),
        ("A*", a_star_search),
    )

    rows: list[dict[str, object]] = []
    detail_paths: dict[str, tuple[GridPath | PointPath, MapScenario]] = {}

    for kind in SCENARIOS:
        for seed in range(SEED_COUNT):
            scenario = scenario_from_seed(kind, 1000 * len(kind) + seed)

            start_time = time.perf_counter()
            brute_force = brute_force_waypoints(scenario)
            elapsed_ms = (time.perf_counter() - start_time) * 1000
            rows.append(result_row(kind, seed, "Brute Force", brute_force, elapsed_ms))
            if kind == DETAIL_SCENARIO and seed == DETAIL_SEED:
                detail_paths["Brute Force"] = (brute_force.path, scenario)

            for name, algorithm in grid_algorithms:
                start_time = time.perf_counter()
                result = run_grid_algorithm(scenario, algorithm)
                elapsed_ms = (time.perf_counter() - start_time) * 1000
                rows.append(result_row(kind, seed, name, result, elapsed_ms))
                if kind == DETAIL_SCENARIO and seed == DETAIL_SEED:
                    detail_paths[name] = (result.path, scenario)

            max_iter = 950 if kind == "Padat" else 650
            start_time = time.perf_counter()
            rrt = rrt_star(
                scenario,
                seed=5000 + seed + len(kind) * 100,
                max_iter=max_iter,
                radius=4.5,
            )
            elapsed_ms = (time.perf_counter() - start_time) * 1000
            rows.append(result_row(kind, seed, "RRT*", rrt, elapsed_ms))
            if kind == DETAIL_SCENARIO and seed == DETAIL_SEED:
                detail_paths["RRT*"] = (rrt.path, scenario)

    detailed_csv = data_dir / "hasil_eksperimen.csv"
    summary_csv = data_dir / "ringkasan_eksperimen.csv"
    path_figure = figures_dir / "fig_perbandingan_jalur.png"
    time_figure = figures_dir / "fig_waktu_rata_rata.png"
    processed_figure = figures_dir / "fig_processed_grid.png"

    write_detailed_results(detailed_csv, rows)
    summary = aggregate_results(rows)
    write_summary(summary_csv, summary)
    plot_path_comparison(path_figure, detail_paths)
    plot_average_runtime(time_figure, summary)
    plot_grid_processed(processed_figure, summary)

    return detailed_csv, summary_csv, path_figure, time_figure, processed_figure, summary


def result_row(
    scenario: str,
    seed: int,
    algorithm: str,
    result: RunResult,
    elapsed_ms: float,
) -> dict[str, object]:
    return {
        "scenario": scenario,
        "seed": seed,
        "algorithm": algorithm,
        "success": int(result.success),
        "cost": result.cost if result.success else "",
        "time_ms": elapsed_ms,
        "expanded": result.processed,
    }


def write_detailed_results(path: Path, rows: list[dict[str, object]]) -> None:
    with path.open("w", newline="", encoding="utf-8") as file:
        writer = csv.DictWriter(
            file,
            fieldnames=["scenario", "seed", "algorithm", "success", "cost", "time_ms", "expanded"],
        )
        writer.writeheader()
        writer.writerows(rows)


def aggregate_results(rows: list[dict[str, object]]) -> list[dict[str, object]]:
    summary: list[dict[str, object]] = []

    for scenario in SCENARIOS:
        for algorithm in ALGORITHM_ORDER:
            subset = [
                row
                for row in rows
                if row["scenario"] == scenario and row["algorithm"] == algorithm
            ]
            success_rate = sum(int(row["success"]) for row in subset) / len(subset) * 100
            successful_costs = [float(row["cost"]) for row in subset if row["success"]]
            times = [float(row["time_ms"]) for row in subset]
            processed = [int(row["expanded"]) for row in subset]
            cost_std = statistics.stdev(successful_costs) if len(successful_costs) > 1 else 0.0

            summary.append(
                {
                    "scenario": scenario,
                    "algorithm": algorithm,
                    "success_rate": success_rate,
                    "avg_cost": statistics.mean(successful_costs)
                    if successful_costs
                    else float("nan"),
                    "std_cost": cost_std if successful_costs else float("nan"),
                    "avg_time_ms": statistics.mean(times),
                    "std_time_ms": statistics.stdev(times) if len(times) > 1 else 0.0,
                    "avg_expanded": statistics.mean(processed),
                    "std_expanded": statistics.stdev(processed) if len(processed) > 1 else 0.0,
                }
            )

    return summary


def write_summary(path: Path, rows: list[dict[str, object]]) -> None:
    with path.open("w", newline="", encoding="utf-8") as file:
        writer = csv.DictWriter(file, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)


def plot_path_comparison(
    path: Path,
    detail_paths: dict[str, tuple[GridPath | PointPath, MapScenario]],
) -> None:
    scenario = detail_paths["UCS"][1]

    plt.figure(figsize=(6.4, 3.8), dpi=220)
    axis = plt.gca()
    axis.set_xlim(0, scenario.width)
    axis.set_ylim(0, scenario.height)
    axis.set_aspect("equal")
    axis.set_title("Perbandingan jalur pada skenario sulit", fontsize=9)

    for circle in scenario.circles:
        axis.add_patch(plt.Circle((circle.x, circle.y), circle.r, fill=True, alpha=0.25))
    for rect in scenario.rects:
        axis.add_patch(
            plt.Rectangle(
                (rect.x1, rect.y1),
                rect.x2 - rect.x1,
                rect.y2 - rect.y1,
                fill=True,
                alpha=0.25,
            )
        )

    styles = {"Brute Force": "-", "UCS": "--", "GBFS": "-.", "A*": ":", "RRT*": "-"}
    for algorithm, (raw_path, _) in detail_paths.items():
        if not raw_path:
            continue

        if algorithm in ("UCS", "GBFS", "A*"):
            grid_path = raw_path
            xs = [cell[0] + 0.5 for cell in grid_path]
            ys = [cell[1] + 0.5 for cell in grid_path]
        else:
            point_path = raw_path
            xs = [point[0] for point in point_path]
            ys = [point[1] for point in point_path]

        axis.plot(xs, ys, styles[algorithm], linewidth=1.4, label=algorithm)

    axis.scatter([scenario.start[0] + 0.5], [scenario.start[1] + 0.5], marker="o", s=18, label="Start")
    axis.scatter([scenario.goal[0] + 0.5], [scenario.goal[1] + 0.5], marker="x", s=28, label="Goal")
    axis.grid(True, linewidth=0.25, alpha=0.35)
    axis.legend(fontsize=7, loc="upper right")
    plt.tight_layout()
    plt.savefig(path, bbox_inches="tight")
    plt.close()


def plot_average_runtime(path: Path, summary: list[dict[str, object]]) -> None:
    plt.figure(figsize=(6.2, 3.8), dpi=220)
    axis = plt.gca()
    x_positions = list(range(len(SCENARIOS)))
    bar_width = 0.16

    for index, algorithm in enumerate(ALGORITHM_ORDER):
        values = [
            next(
                row
                for row in summary
                if row["scenario"] == scenario and row["algorithm"] == algorithm
            )["avg_time_ms"]
            for scenario in SCENARIOS
        ]
        deviations = [
            next(
                row
                for row in summary
                if row["scenario"] == scenario and row["algorithm"] == algorithm
            )["std_time_ms"]
            for scenario in SCENARIOS
        ]
        offset = (index - (len(ALGORITHM_ORDER) - 1) / 2) * bar_width
        axis.bar(
            [x + offset for x in x_positions],
            values,
            width=bar_width,
            yerr=deviations,
            capsize=2,
            error_kw={"elinewidth": 0.7, "capthick": 0.7},
            label=algorithm,
        )

    axis.set_xticks(x_positions, SCENARIOS)
    axis.set_ylabel("Waktu rata-rata (ms)")
    axis.set_title("Waktu eksekusi rata-rata per skenario", fontsize=9)
    axis.legend(fontsize=6, ncols=2)
    axis.grid(axis="y", linewidth=0.3, alpha=0.3)
    axis.set_ylim(bottom=0)
    plt.tight_layout()
    plt.savefig(path, bbox_inches="tight")
    plt.close()


def format_indonesian_number(value: float) -> str:
    if value.is_integer():
        return f"{int(value):,}".replace(",", ".")

    whole, fraction = f"{value:,.1f}".split(".")
    return f"{whole.replace(',', '.')},{fraction}"


def plot_grid_processed(path: Path, summary: list[dict[str, object]]) -> None:
    plt.figure(figsize=(6.2, 3.8), dpi=220)
    axis = plt.gca()
    x_positions = list(range(len(SCENARIOS)))
    bar_width = 0.24

    for index, algorithm in enumerate(GRID_ALGORITHM_ORDER):
        values = [
            float(
                next(
                    row
                    for row in summary
                    if row["scenario"] == scenario and row["algorithm"] == algorithm
                )["avg_expanded"]
            )
            for scenario in SCENARIOS
        ]
        offset = (index - (len(GRID_ALGORITHM_ORDER) - 1) / 2) * bar_width
        bars = axis.bar(
            [x + offset for x in x_positions],
            values,
            width=bar_width,
            label=algorithm,
        )
        labels = [format_indonesian_number(value) for value in values]
        axis.bar_label(bars, labels=labels, padding=2, fontsize=6, rotation=90)

    axis.set_xticks(x_positions, SCENARIOS)
    axis.set_ylabel("Jumlah processed rata-rata")
    axis.set_title("Processed algoritma grid per skenario", fontsize=9)
    axis.legend(fontsize=7, ncols=3)
    axis.grid(axis="y", linewidth=0.3, alpha=0.3)
    axis.set_ylim(0, axis.get_ylim()[1] * 1.13)
    plt.tight_layout()
    plt.savefig(path, bbox_inches="tight")
    plt.close()


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Run the ASA robot path-planning comparison experiment."
    )
    parser.add_argument(
        "--data-dir",
        type=Path,
        default=DEFAULT_DATA_DIR,
        help="Directory for CSV outputs.",
    )
    parser.add_argument(
        "--figures-dir",
        type=Path,
        default=DEFAULT_FIGURES_DIR,
        help="Directory for generated figures.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    (
        detailed_csv,
        summary_csv,
        path_figure,
        time_figure,
        processed_figure,
        summary,
    ) = run_experiment(data_dir=args.data_dir, figures_dir=args.figures_dir)

    print(f"Detailed CSV: {detailed_csv}")
    print(f"Summary CSV:  {summary_csv}")
    print(f"Path figure:  {path_figure}")
    print(f"Time figure:  {time_figure}")
    print(f"Grid figure:  {processed_figure}")
    print()
    for row in summary:
        print(row)


if __name__ == "__main__":
    main()
