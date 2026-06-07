from __future__ import annotations

import argparse
import csv
import math
import statistics
import time
from collections.abc import Callable, Iterable
from pathlib import Path
from random import Random

import matplotlib.pyplot as plt

from . import core


PROJECT_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_DATA_DIR = PROJECT_ROOT / "results" / "data"
DEFAULT_FIGURES_DIR = PROJECT_ROOT / "results" / "figures"
SCENARIOS = core.SCENARIOS
ALGORITHMS = core.ALGORITHM_ORDER
GRID_ALGORITHMS = core.GRID_ALGORITHM_ORDER
GRID_SIZES = ((30, 20), (45, 30), (60, 40), (75, 50), (90, 60), (120, 80))
DENSITIES = (4, 8, 12, 16, 20, 24)
COLORS = {
    "Brute Force": "#4C78A8",
    "UCS": "#F58518",
    "GBFS": "#54A24B",
    "A*": "#E45756",
    "RRT*": "#8E6CBB",
}


def algorithm_functions(
    scenario: core.MapScenario,
    scenario_name: str,
    seed_index: int,
) -> dict[str, Callable[[], core.RunResult]]:
    return {
        "Brute Force": lambda: core.brute_force_waypoints(scenario),
        "UCS": lambda: core.uniform_cost_search(scenario),
        "GBFS": lambda: core.greedy_best_first_search(scenario),
        "A*": lambda: core.a_star_search(scenario),
        "RRT*": lambda: core.rrt_star(
            scenario,
            seed=5000 + seed_index + len(scenario_name) * 100,
            max_iter=950 if scenario_name == "Padat" else 650,
            radius=4.5,
        ),
    }


def median_timed(
    execute: Callable[[], core.RunResult],
    repeats: int,
) -> tuple[core.RunResult, float, list[float]]:
    result = execute()
    samples: list[float] = []
    for repeat in range(repeats):
        started = time.perf_counter()
        candidate = execute()
        samples.append((time.perf_counter() - started) * 1000)
        if repeat == 0:
            result = candidate
    return result, statistics.median(samples), samples


def straight_distance(scenario: core.MapScenario) -> float:
    return math.dist(core.cell_center(scenario.start), core.cell_center(scenario.goal))


def result_row(
    scenario_name: str,
    map_scenario: core.MapScenario,
    seed: int,
    algorithm: str,
    result: core.RunResult,
    elapsed_ms: float,
    samples: list[float],
    generation_attempt: int,
    obstacle_count: int,
) -> dict[str, object]:
    cost = result.cost if result.success else float("nan")
    direct = straight_distance(map_scenario)
    return {
        "scenario": scenario_name,
        "seed": seed,
        "algorithm": algorithm,
        "success": int(result.success),
        "cost": cost,
        "time_ms": elapsed_ms,
        "expanded": result.processed,
        "detour_ratio": cost / direct if result.success else float("nan"),
        "generation_attempt": generation_attempt,
        "timing_repeats": len(samples),
        "time_min_ms": min(samples),
        "time_max_ms": max(samples),
        "width": map_scenario.width,
        "height": map_scenario.height,
        "obstacle_count": obstacle_count,
    }


def write_csv(path: Path, rows: list[dict[str, object]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(rows[0]))
        writer.writeheader()
        writer.writerows(rows)


def mean(values: Iterable[float]) -> float:
    data = list(values)
    return statistics.mean(data) if data else float("nan")


def stdev(values: Iterable[float]) -> float:
    data = list(values)
    return statistics.stdev(data) if len(data) > 1 else 0.0


def aggregate(
    rows: list[dict[str, object]],
    group_fields: tuple[str, ...],
) -> list[dict[str, object]]:
    groups: dict[tuple[object, ...], list[dict[str, object]]] = {}
    for row in rows:
        groups.setdefault(tuple(row[field] for field in group_fields), []).append(row)

    summary: list[dict[str, object]] = []
    for key, group in groups.items():
        successful = [row for row in group if int(row["success"])]
        costs = [float(row["cost"]) for row in successful]
        detours = [float(row["detour_ratio"]) for row in successful]
        times = [float(row["time_ms"]) for row in group]
        processed = [float(row["expanded"]) for row in group]
        item = {field: value for field, value in zip(group_fields, key)}
        item.update(
            {
                "success_rate": 100 * len(successful) / len(group),
                "avg_cost": mean(costs),
                "std_cost": stdev(costs),
                "avg_detour_ratio": mean(detours),
                "std_detour_ratio": stdev(detours),
                "avg_time_ms": mean(times),
                "std_time_ms": stdev(times),
                "avg_expanded": mean(processed),
                "std_expanded": stdev(processed),
                "sample_count": len(group),
            }
        )
        summary.append(item)
    return summary


def validated_scenario(kind: str, seed_index: int) -> tuple[core.MapScenario, int]:
    for attempt in range(1000):
        generated_seed = 1000 * len(kind) + seed_index + attempt * 100_003
        scenario = core.scenario_from_seed(kind, generated_seed)
        if core.a_star_search(scenario).success:
            return scenario, attempt
    raise RuntimeError(f"Unable to generate a solvable {kind} map for seed {seed_index}.")


def scale_scenario(
    source: core.MapScenario,
    width: int,
    height: int,
) -> core.MapScenario:
    sx, sy = width / source.width, height / source.height
    circles = [core.Circle(item.x * sx, item.y * sy, item.r * min(sx, sy)) for item in source.circles]
    rects = [
        core.Rect(item.x1 * sx, item.y1 * sy, item.x2 * sx, item.y2 * sy)
        for item in source.rects
    ]
    start = (round((source.start[0] + 0.5) * sx - 0.5), round((source.start[1] + 0.5) * sy - 0.5))
    goal = (round((source.goal[0] + 0.5) * sx - 0.5), round((source.goal[1] + 0.5) * sy - 0.5))
    return core.MapScenario(source.name, width, height, circles, rects, start, goal)


def density_scenarios(seed_index: int) -> tuple[dict[int, core.MapScenario], int]:
    for attempt in range(1000):
        random_source = Random(70_000 + seed_index + attempt * 100_003)
        circles: list[core.Circle] = []
        while len(circles) < max(DENSITIES):
            circle = core.Circle(
                random_source.uniform(9, 51),
                random_source.uniform(4, 36),
                random_source.uniform(1.7, 3.1),
            )
            if math.dist((circle.x, circle.y), core.cell_center(core.START)) <= circle.r + 4:
                continue
            if math.dist((circle.x, circle.y), core.cell_center(core.GOAL)) <= circle.r + 4:
                continue
            circles.append(circle)
        scenarios = {
            count: core.MapScenario(
                f"Density-{count}",
                core.GRID_WIDTH,
                core.GRID_HEIGHT,
                list(circles[:count]),
                [],
                core.START,
                core.GOAL,
            )
            for count in DENSITIES
        }
        if all(core.a_star_search(scenario).success for scenario in scenarios.values()):
            return scenarios, attempt
    raise RuntimeError(f"Unable to generate nested density maps for seed {seed_index}.")


def run_main(seed_count: int, repeats: int) -> tuple[list[dict[str, object]], dict[tuple[str, int], tuple[core.MapScenario, dict[str, core.RunResult]]]]:
    rows: list[dict[str, object]] = []
    details: dict[tuple[str, int], tuple[core.MapScenario, dict[str, core.RunResult]]] = {}
    for kind in SCENARIOS:
        for seed in range(seed_count):
            scenario, attempt = validated_scenario(kind, seed)
            results: dict[str, core.RunResult] = {}
            for algorithm, execute in algorithm_functions(scenario, kind, seed).items():
                result, elapsed, samples = median_timed(execute, repeats)
                results[algorithm] = result
                rows.append(
                    result_row(
                        kind,
                        scenario,
                        seed,
                        algorithm,
                        result,
                        elapsed,
                        samples,
                        attempt,
                        len(scenario.circles) + len(scenario.rects),
                    )
                )
            details[(kind, seed)] = (scenario, results)
    return rows, details


def run_scaling(seed_count: int, repeats: int) -> list[dict[str, object]]:
    rows: list[dict[str, object]] = []
    functions = {
        "UCS": core.uniform_cost_search,
        "GBFS": core.greedy_best_first_search,
        "A*": core.a_star_search,
    }
    for seed in range(seed_count):
        base, attempt = validated_scenario("Sulit", seed)
        for width, height in GRID_SIZES:
            scenario = scale_scenario(base, width, height)
            if not core.a_star_search(scenario).success:
                raise RuntimeError(f"Scaled map became infeasible: seed={seed}, {width}x{height}")
            for algorithm, function in functions.items():
                result, elapsed, samples = median_timed(lambda f=function: f(scenario), repeats)
                row = result_row(
                    f"{width}x{height}",
                    scenario,
                    seed,
                    algorithm,
                    result,
                    elapsed,
                    samples,
                    attempt,
                    len(scenario.circles) + len(scenario.rects),
                )
                row["cell_count"] = width * height
                rows.append(row)
    return rows


def run_density(seed_count: int, repeats: int) -> list[dict[str, object]]:
    rows: list[dict[str, object]] = []
    for seed in range(seed_count):
        scenarios, attempt = density_scenarios(seed)
        for count, scenario in scenarios.items():
            for algorithm, execute in algorithm_functions(scenario, "Density", seed).items():
                result, elapsed, samples = median_timed(execute, repeats)
                row = result_row(
                    str(count),
                    scenario,
                    seed,
                    algorithm,
                    result,
                    elapsed,
                    samples,
                    attempt,
                    count,
                )
                row["density"] = count
                rows.append(row)
    return rows


def linear_fit(points: list[tuple[float, float]]) -> tuple[float, float]:
    xs = [math.log(point[0]) for point in points if point[1] > 0]
    ys = [math.log(point[1]) for point in points if point[1] > 0]
    x_mean, y_mean = mean(xs), mean(ys)
    denominator = sum((x - x_mean) ** 2 for x in xs)
    slope = sum((x - x_mean) * (y - y_mean) for x, y in zip(xs, ys)) / denominator
    intercept = y_mean - slope * x_mean
    predicted = [intercept + slope * x for x in xs]
    total = sum((y - y_mean) ** 2 for y in ys)
    residual = sum((y - estimate) ** 2 for y, estimate in zip(ys, predicted))
    return slope, 1 - residual / total if total else 1.0


def add_scaling_fits(summary: list[dict[str, object]]) -> list[dict[str, object]]:
    enriched: list[dict[str, object]] = []
    fits: dict[str, tuple[float, float, float, float]] = {}
    for algorithm in GRID_ALGORITHMS:
        group = [row for row in summary if row["algorithm"] == algorithm]
        runtime_fit = linear_fit([(float(row["cell_count"]), float(row["avg_time_ms"])) for row in group])
        processed_fit = linear_fit([(float(row["cell_count"]), float(row["avg_expanded"])) for row in group])
        fits[algorithm] = (*runtime_fit, *processed_fit)
    for row in summary:
        runtime_exp, runtime_r2, processed_exp, processed_r2 = fits[str(row["algorithm"])]
        enriched.append(
            {
                **row,
                "runtime_exponent": runtime_exp,
                "runtime_r2": runtime_r2,
                "processed_exponent": processed_exp,
                "processed_r2": processed_r2,
            }
        )
    return enriched


def draw_field(axis, scenario: core.MapScenario) -> None:
    from matplotlib.patches import Circle as CirclePatch, Rectangle

    axis.set_xlim(0, scenario.width)
    axis.set_ylim(0, scenario.height)
    axis.set_aspect("equal")
    axis.set_facecolor("#F7FAF8")
    for item in scenario.circles:
        axis.add_patch(CirclePatch((item.x, item.y), item.r, color="#84908B", alpha=0.55))
    for item in scenario.rects:
        axis.add_patch(Rectangle((item.x1, item.y1), item.x2 - item.x1, item.y2 - item.y1, color="#59645F", alpha=0.72))
    axis.scatter(*core.cell_center(scenario.start), color="#159570", s=18, zorder=5)
    axis.scatter(*core.cell_center(scenario.goal), color="#D8503F", marker="x", s=26, zorder=5)


def plot_paths(path: Path, detail: tuple[core.MapScenario, dict[str, core.RunResult]]) -> None:
    scenario, results = detail
    figure, axes = plt.subplots(2, 3, figsize=(10.4, 5.9), constrained_layout=True)
    for axis, algorithm in zip(axes.flat, ALGORITHMS):
        result = results[algorithm]
        draw_field(axis, scenario)
        if result.success:
            if algorithm in GRID_ALGORITHMS:
                xs = [cell[0] + 0.5 for cell in result.path]
                ys = [cell[1] + 0.5 for cell in result.path]
            else:
                xs = [point[0] for point in result.path]
                ys = [point[1] for point in result.path]
            axis.plot(xs, ys, color=COLORS[algorithm], linewidth=1.8)
        axis.set_title(f"{algorithm}\nbiaya={result.cost:.2f}" if result.success else f"{algorithm}\ngagal", fontsize=9)
        axis.tick_params(labelsize=7)
    axes.flat[-1].axis("off")
    figure.suptitle("Perbandingan lintasan pada skenario Sulit, seed 4", fontsize=12)
    figure.savefig(path, dpi=180, bbox_inches="tight")
    plt.close(figure)


def plot_runtime(path: Path, summary: list[dict[str, object]]) -> None:
    figure, axis = plt.subplots(figsize=(7.4, 4.1), constrained_layout=True)
    x = list(range(len(SCENARIOS)))
    width = 0.15
    for index, algorithm in enumerate(ALGORITHMS):
        group = [next(row for row in summary if row["scenario"] == scenario and row["algorithm"] == algorithm) for scenario in SCENARIOS]
        axis.bar(
            [value + (index - 2) * width for value in x],
            [float(row["avg_time_ms"]) for row in group],
            width,
            yerr=[float(row["std_time_ms"]) for row in group],
            color=COLORS[algorithm],
            label=algorithm,
            capsize=2,
        )
    axis.set_xticks(x, SCENARIOS)
    axis.set_ylabel("Waktu median rata-rata (ms)")
    axis.legend(ncols=3, fontsize=8)
    axis.grid(axis="y", alpha=0.2)
    figure.savefig(path, dpi=180, bbox_inches="tight")
    plt.close(figure)


def plot_processed(path: Path, summary: list[dict[str, object]]) -> None:
    figure, axis = plt.subplots(figsize=(7.0, 3.9), constrained_layout=True)
    x = list(range(len(SCENARIOS)))
    width = 0.23
    for index, algorithm in enumerate(GRID_ALGORITHMS):
        values = [float(next(row for row in summary if row["scenario"] == scenario and row["algorithm"] == algorithm)["avg_expanded"]) for scenario in SCENARIOS]
        bars = axis.bar([value + (index - 1) * width for value in x], values, width, color=COLORS[algorithm], label=algorithm)
        axis.bar_label(bars, fmt="%.0f", fontsize=7, padding=2)
    axis.set_xticks(x, SCENARIOS)
    axis.set_ylabel("Processed rata-rata")
    axis.legend(ncols=3, fontsize=8)
    axis.grid(axis="y", alpha=0.2)
    figure.savefig(path, dpi=180, bbox_inches="tight")
    plt.close(figure)


def plot_scaling(path: Path, summary: list[dict[str, object]]) -> None:
    figure, axes = plt.subplots(1, 2, figsize=(9.3, 3.8), constrained_layout=True)
    for algorithm in GRID_ALGORITHMS:
        group = sorted((row for row in summary if row["algorithm"] == algorithm), key=lambda row: int(row["cell_count"]))
        cells = [int(row["cell_count"]) for row in group]
        runtime = [float(row["avg_time_ms"]) for row in group]
        processed = [float(row["avg_expanded"]) for row in group]
        label = f"{algorithm} (b={float(group[0]['runtime_exponent']):.2f})"
        axes[0].plot(cells, runtime, marker="o", color=COLORS[algorithm], label=label)
        axes[1].plot(cells, processed, marker="o", color=COLORS[algorithm], label=algorithm)
    for axis, title, ylabel in (
        (axes[0], "Skalabilitas waktu", "Waktu median rata-rata (ms)"),
        (axes[1], "Skalabilitas processed", "Processed rata-rata"),
    ):
        axis.set_xscale("log")
        axis.set_yscale("log")
        axis.set_xlabel("Jumlah sel grid")
        axis.set_ylabel(ylabel)
        axis.set_title(title)
        axis.grid(alpha=0.2)
        axis.legend(fontsize=7)
    figure.savefig(path, dpi=180, bbox_inches="tight")
    plt.close(figure)


def plot_density(path: Path, summary: list[dict[str, object]]) -> None:
    figure, axes = plt.subplots(1, 3, figsize=(11.2, 3.7), constrained_layout=True)
    for algorithm in ALGORITHMS:
        group = sorted((row for row in summary if row["algorithm"] == algorithm), key=lambda row: int(row["density"]))
        density = [int(row["density"]) for row in group]
        axes[0].plot(density, [float(row["success_rate"]) for row in group], marker="o", color=COLORS[algorithm], label=algorithm)
        axes[1].plot(density, [float(row["avg_detour_ratio"]) for row in group], marker="o", color=COLORS[algorithm])
        axes[2].plot(density, [float(row["avg_time_ms"]) for row in group], marker="o", color=COLORS[algorithm])
    axes[0].set_ylabel("Keberhasilan (%)")
    axes[1].set_ylabel("Detour ratio")
    axes[2].set_ylabel("Waktu median rata-rata (ms)")
    for axis, title in zip(axes, ("Reliabilitas", "Kualitas lintasan", "Waktu komputasi")):
        axis.set_xlabel("Jumlah hambatan")
        axis.set_title(title)
        axis.grid(alpha=0.2)
    axes[0].legend(fontsize=7, ncols=2)
    figure.savefig(path, dpi=180, bbox_inches="tight")
    plt.close(figure)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run ASA path-planning experiments.")
    parser.add_argument("--suite", choices=("all", "main", "scaling", "density"), default="all")
    parser.add_argument("--seed-count", type=int, default=10)
    parser.add_argument("--timing-repeats", type=int, default=3)
    parser.add_argument("--data-dir", type=Path, default=DEFAULT_DATA_DIR)
    parser.add_argument("--figures-dir", type=Path, default=DEFAULT_FIGURES_DIR)
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    args.data_dir.mkdir(parents=True, exist_ok=True)
    args.figures_dir.mkdir(parents=True, exist_ok=True)

    if args.suite in {"all", "main"}:
        rows, details = run_main(args.seed_count, args.timing_repeats)
        summary = aggregate(rows, ("scenario", "algorithm"))
        write_csv(args.data_dir / "hasil_eksperimen.csv", rows)
        write_csv(args.data_dir / "ringkasan_eksperimen.csv", summary)
        detail_seed = 4 if args.seed_count > 4 else args.seed_count - 1
        plot_paths(args.figures_dir / "fig_perbandingan_jalur.png", details[("Sulit", detail_seed)])
        plot_runtime(args.figures_dir / "fig_waktu_rata_rata.png", summary)
        plot_processed(args.figures_dir / "fig_processed_grid.png", summary)

    if args.suite in {"all", "scaling"}:
        rows = run_scaling(args.seed_count, args.timing_repeats)
        summary = add_scaling_fits(aggregate(rows, ("scenario", "algorithm", "width", "height", "cell_count")))
        write_csv(args.data_dir / "hasil_grid_scaling.csv", rows)
        write_csv(args.data_dir / "ringkasan_grid_scaling.csv", summary)
        plot_scaling(args.figures_dir / "fig_grid_scaling.png", summary)

    if args.suite in {"all", "density"}:
        rows = run_density(args.seed_count, args.timing_repeats)
        summary = aggregate(rows, ("scenario", "density", "algorithm"))
        write_csv(args.data_dir / "hasil_density_sweep.csv", rows)
        write_csv(args.data_dir / "ringkasan_density_sweep.csv", summary)
        plot_density(args.figures_dir / "fig_density_sweep.png", summary)

    print(f"Data: {args.data_dir}")
    print(f"Figures: {args.figures_dir}")
