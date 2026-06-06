import { cellCenter, cellKey, distance, isFreePoint, lineFree, neighbors8, pathCostCells } from "./geometry";
import { PriorityQueue } from "./priorityQueue";
import { PythonRandom } from "./random";
import { rrtSeed } from "./scenarios";
import type {
  AlgorithmKey,
  AlgorithmMeta,
  AlgorithmResult,
  Cell,
  ComparisonRun,
  MapScenario,
  Point,
  ScenarioKind,
  TreeEdge,
} from "./types";
import { scenarioFromKindSeed } from "./scenarios";

interface QueueEntry {
  priority: number;
  cost: number;
  cell: Cell;
}

interface RawRun {
  path: Point[];
  gridPath?: Cell[];
  cost: number;
  processed: number;
  success: boolean;
  visited: Cell[];
  candidates?: Point[];
  treeNodes?: Point[];
  treeEdges?: TreeEdge[];
}

export const ALGORITHMS: AlgorithmMeta[] = [
  {
    key: "brute",
    label: "Brute Force",
    shortLabel: "BF",
    tone: "#22d3ee",
    description: "Enumerasi kandidat waypoint pendek sebagai baseline eksplisit.",
  },
  {
    key: "ucs",
    label: "UCS",
    shortLabel: "UCS",
    tone: "#f59e0b",
    description: "Pencarian biaya seragam pada grid 8-arah.",
  },
  {
    key: "gbfs",
    label: "GBFS",
    shortLabel: "GBFS",
    tone: "#84cc16",
    description: "Greedy Best First Search memakai jarak ke goal sebagai prioritas.",
  },
  {
    key: "astar",
    label: "A*",
    shortLabel: "A*",
    tone: "#f43f5e",
    description: "Gabungan biaya aktual dan heuristik Euclidean.",
  },
  {
    key: "rrt",
    label: "RRT*",
    shortLabel: "RRT*",
    tone: "#a78bfa",
    description: "Sampling kontinyu dengan rewiring menuju jalur lebih pendek.",
  },
];

export const ALGORITHM_BY_KEY = Object.fromEntries(
  ALGORITHMS.map((algorithm) => [algorithm.key, algorithm]),
) as Record<AlgorithmKey, AlgorithmMeta>;

function compareQueueEntry(left: QueueEntry, right: QueueEntry): boolean {
  if (left.priority !== right.priority) {
    return left.priority < right.priority;
  }
  if (left.cost !== right.cost) {
    return left.cost < right.cost;
  }
  if (left.cell[0] !== right.cell[0]) {
    return left.cell[0] < right.cell[0];
  }
  return left.cell[1] < right.cell[1];
}

function reconstruct(parent: Map<string, Cell>, start: Cell, goal: Cell): Cell[] {
  if (!parent.has(cellKey(goal)) && cellKey(goal) !== cellKey(start)) {
    return [];
  }

  const path: Cell[] = [goal];
  let current = goal;
  while (cellKey(current) !== cellKey(start)) {
    const next = parent.get(cellKey(current));
    if (!next) {
      return [];
    }
    current = next;
    path.push(current);
  }

  return path.reverse();
}

function permutations<T>(values: T[], depth: number): T[][] {
  if (depth === 0) {
    return [[]];
  }

  const result: T[][] = [];
  const used = new Array(values.length).fill(false);
  const current: T[] = [];

  function backtrack(): void {
    if (current.length === depth) {
      result.push([...current]);
      return;
    }

    for (let i = 0; i < values.length; i += 1) {
      if (used[i]) {
        continue;
      }
      used[i] = true;
      current.push(values[i]);
      backtrack();
      current.pop();
      used[i] = false;
    }
  }

  backtrack();
  return result;
}

export function bruteForceWaypoints(
  scenario: MapScenario,
  maxWaypoints = 3,
  maxCandidates = 24,
): RawRun {
  const start = cellCenter(scenario.start);
  const goal = cellCenter(scenario.goal);
  const rawCandidates: Point[] = [];
  const priorityRawCandidates: Point[] = [];

  for (const x of [10, 18, 24, 30, 36, 42, 50]) {
    for (const y of [5, 10, 15, 20, 25, 30, 35]) {
      rawCandidates.push([x + 0.5, y + 0.5]);
    }
  }

  for (const rect of scenario.rects) {
    const pad = 2.5;
    for (const x of [rect.x1 - pad, rect.x2 + pad]) {
      for (const y of [rect.y1 - pad, rect.y2 + pad]) {
        priorityRawCandidates.push([x, y]);
      }
    }
    priorityRawCandidates.push([(rect.x1 + rect.x2) / 2, rect.y1 - pad]);
    priorityRawCandidates.push([(rect.x1 + rect.x2) / 2, rect.y2 + pad]);
    priorityRawCandidates.push([rect.x1 - pad, (rect.y1 + rect.y2) / 2]);
    priorityRawCandidates.push([rect.x2 + pad, (rect.y1 + rect.y2) / 2]);
  }

  for (const circle of scenario.circles) {
    const radius = circle.r + 2.4;
    for (let k = 0; k < 8; k += 1) {
      const angle = (Math.PI * 2 * k) / 8;
      rawCandidates.push([
        circle.x + radius * Math.cos(angle),
        circle.y + radius * Math.sin(angle),
      ]);
    }
  }

  const seen = new Set<string>();
  const cleanCandidates = (points: Point[]): Point[] => {
    const cleaned: Point[] = [];
    for (const point of points) {
      const key = `${point[0].toFixed(1)},${point[1].toFixed(1)}`;
      if (seen.has(key) || !isFreePoint(scenario, point)) {
        continue;
      }
      seen.add(key);
      cleaned.push(point);
    }
    return cleaned;
  };

  const priorityCandidates = cleanCandidates(priorityRawCandidates);
  const candidates = cleanCandidates(rawCandidates);
  const [sx, sy] = start;
  const [gx, gy] = goal;
  const lineLength = Math.max(1e-9, distance(start, goal));

  const corridorScore = (point: Point): number => {
    const [px, py] = point;
    const det = Math.abs((gx - sx) * (sy - py) - (sx - px) * (gy - sy));
    const perpendicular = det / lineLength;
    return distance(start, point) + distance(point, goal) + 0.35 * perpendicular;
  };

  priorityCandidates.sort((a, b) => corridorScore(a) - corridorScore(b));
  candidates.sort((a, b) => corridorScore(a) - corridorScore(b));

  const priorityLimit = priorityCandidates.slice(0, 10);
  const boundedCandidates = [
    ...priorityLimit,
    ...candidates.slice(0, Math.max(0, maxCandidates - priorityLimit.length)),
  ];

  const visibilityCache = new Map<string, boolean>();
  const segmentFree = (a: Point, b: Point): boolean => {
    const left = `${a[0].toFixed(2)},${a[1].toFixed(2)}`;
    const right = `${b[0].toFixed(2)},${b[1].toFixed(2)}`;
    const key = left < right ? `${left}|${right}` : `${right}|${left}`;
    const cached = visibilityCache.get(key);
    if (cached !== undefined) {
      return cached;
    }
    const free = lineFree(scenario, a, b, 0.75);
    visibilityCache.set(key, free);
    return free;
  };

  let bestPath: Point[] = [];
  let bestCost = Number.POSITIVE_INFINITY;
  let checkedRoutes = 1;

  if (segmentFree(start, goal)) {
    bestPath = [start, goal];
    bestCost = distance(start, goal);
  }

  for (let depth = 1; depth <= maxWaypoints; depth += 1) {
    for (const sequence of permutations(boundedCandidates, depth)) {
      checkedRoutes += 1;
      const route = [start, ...sequence, goal];
      let routeCost = 0;
      let feasible = true;

      for (let i = 0; i < route.length - 1; i += 1) {
        routeCost += distance(route[i], route[i + 1]);
        if (routeCost >= bestCost || !segmentFree(route[i], route[i + 1])) {
          feasible = false;
          break;
        }
      }

      if (feasible && routeCost < bestCost) {
        bestPath = route;
        bestCost = routeCost;
      }
    }
  }

  return {
    path: bestPath,
    cost: bestCost,
    processed: checkedRoutes,
    success: bestPath.length > 0,
    visited: [],
    candidates: boundedCandidates,
  };
}

function graphSearch(
  scenario: MapScenario,
  key: "ucs" | "gbfs" | "astar",
): RawRun {
  const start = scenario.start;
  const goal = scenario.goal;
  const heuristic = (cell: Cell): number => distance(cell, goal);

  const startPriority = key === "ucs" ? 0 : heuristic(start);
  const queue = new PriorityQueue<QueueEntry>(compareQueueEntry);
  queue.push({ priority: startPriority, cost: 0, cell: start });

  const distanceByCell = new Map<string, number>([[cellKey(start), 0]]);
  const parent = new Map<string, Cell>();
  const visitedSet = new Set<string>();
  const visited: Cell[] = [];
  let processed = 0;

  while (queue.length > 0) {
    const entry = queue.pop();
    if (!entry) {
      break;
    }

    const currentKey = cellKey(entry.cell);
    if (visitedSet.has(currentKey)) {
      continue;
    }

    visitedSet.add(currentKey);
    visited.push(entry.cell);
    processed += 1;

    if (currentKey === cellKey(goal)) {
      break;
    }

    for (const [neighbor, edgeCost] of neighbors8(scenario, entry.cell)) {
      const neighborKey = cellKey(neighbor);
      if (key === "gbfs" && visitedSet.has(neighborKey)) {
        continue;
      }

      const newCost = entry.cost + edgeCost;
      const currentBest = distanceByCell.get(neighborKey) ?? Number.POSITIVE_INFINITY;
      if (newCost < currentBest) {
        distanceByCell.set(neighborKey, newCost);
        parent.set(neighborKey, entry.cell);

        const priority =
          key === "ucs"
            ? newCost
            : key === "gbfs"
              ? heuristic(neighbor)
              : newCost + heuristic(neighbor);
        queue.push({ priority, cost: newCost, cell: neighbor });
      }
    }
  }

  const path = distanceByCell.has(cellKey(goal)) ? reconstruct(parent, start, goal) : [];
  return {
    path: path.map(cellCenter),
    gridPath: path,
    cost: pathCostCells(path),
    processed,
    success: path.length > 0,
    visited,
  };
}

export function rrtStar(
  scenario: MapScenario,
  seed: number,
  maxIter = 1200,
  stepSize = 2.5,
  radius = 5,
  goalSampleRate = 0.12,
): RawRun {
  const random = new PythonRandom(seed);
  const start = cellCenter(scenario.start);
  const goal = cellCenter(scenario.goal);
  const nodes: Point[] = [start];
  const parent: number[] = [-1];
  const cost: number[] = [0];
  let goalIndex: number | null = null;

  const sample = (): Point => {
    if (random.random() < goalSampleRate) {
      return goal;
    }
    return [
      random.uniform(0, scenario.width - 1e-3),
      random.uniform(0, scenario.height - 1e-3),
    ];
  };

  const nearest = (point: Point): number => {
    let bestIndex = 0;
    let bestDistance = Number.POSITIVE_INFINITY;
    for (let i = 0; i < nodes.length; i += 1) {
      const candidateDistance = distance(nodes[i], point);
      if (candidateDistance < bestDistance) {
        bestIndex = i;
        bestDistance = candidateDistance;
      }
    }
    return bestIndex;
  };

  const steer = (a: Point, b: Point): Point => {
    const segmentLength = distance(a, b);
    if (segmentLength <= stepSize) {
      return b;
    }
    return [
      a[0] + ((b[0] - a[0]) * stepSize) / segmentLength,
      a[1] + ((b[1] - a[1]) * stepSize) / segmentLength,
    ];
  };

  for (let i = 0; i < maxIter; i += 1) {
    const randomPoint = sample();
    const nearestIndex = nearest(randomPoint);
    const newPoint = steer(nodes[nearestIndex], randomPoint);

    if (!isFreePoint(scenario, newPoint)) {
      continue;
    }
    if (!lineFree(scenario, nodes[nearestIndex], newPoint)) {
      continue;
    }

    const nearIndices: number[] = [];
    for (let nodeIndex = 0; nodeIndex < nodes.length; nodeIndex += 1) {
      if (
        distance(nodes[nodeIndex], newPoint) <= radius &&
        lineFree(scenario, nodes[nodeIndex], newPoint)
      ) {
        nearIndices.push(nodeIndex);
      }
    }

    let bestParent = nearestIndex;
    let bestCost = cost[nearestIndex] + distance(nodes[nearestIndex], newPoint);

    for (const nearIndex of nearIndices) {
      const candidateCost = cost[nearIndex] + distance(nodes[nearIndex], newPoint);
      if (candidateCost < bestCost) {
        bestParent = nearIndex;
        bestCost = candidateCost;
      }
    }

    nodes.push(newPoint);
    parent.push(bestParent);
    cost.push(bestCost);
    const newIndex = nodes.length - 1;

    for (const nearIndex of nearIndices) {
      const newCost = bestCost + distance(newPoint, nodes[nearIndex]);
      if (newCost < cost[nearIndex] && lineFree(scenario, newPoint, nodes[nearIndex])) {
        parent[nearIndex] = newIndex;
        cost[nearIndex] = newCost;
      }
    }

    if (distance(newPoint, goal) <= stepSize && lineFree(scenario, newPoint, goal)) {
      const goalCost = bestCost + distance(newPoint, goal);
      if (goalIndex === null) {
        nodes.push(goal);
        parent.push(newIndex);
        cost.push(goalCost);
        goalIndex = nodes.length - 1;
      } else if (goalCost < cost[goalIndex]) {
        parent[goalIndex] = newIndex;
        cost[goalIndex] = goalCost;
      }
    }
  }

  const treeEdges: TreeEdge[] = [];
  for (let i = 1; i < nodes.length; i += 1) {
    if (parent[i] >= 0) {
      treeEdges.push({ from: nodes[parent[i]], to: nodes[i] });
    }
  }

  if (goalIndex === null) {
    return {
      path: [],
      cost: Number.POSITIVE_INFINITY,
      processed: nodes.length,
      success: false,
      visited: [],
      treeNodes: nodes,
      treeEdges,
    };
  }

  const path: Point[] = [];
  let index = goalIndex;
  while (index !== -1) {
    path.push(nodes[index]);
    index = parent[index];
  }
  path.reverse();

  return {
    path,
    cost: cost[goalIndex],
    processed: nodes.length,
    success: true,
    visited: [],
    treeNodes: nodes,
    treeEdges,
  };
}

function timedResult(
  key: AlgorithmKey,
  scenario: MapScenario,
  seedIndex: number,
): AlgorithmResult {
  const started = performance.now();
  const raw =
    key === "brute"
      ? bruteForceWaypoints(scenario)
      : key === "ucs"
        ? graphSearch(scenario, "ucs")
        : key === "gbfs"
          ? graphSearch(scenario, "gbfs")
          : key === "astar"
            ? graphSearch(scenario, "astar")
            : rrtStar(
                scenario,
                rrtSeed(scenario.name, seedIndex),
                scenario.name === "Padat" ? 950 : 650,
                2.5,
                4.5,
              );
  const runtimeMs = performance.now() - started;
  const meta = ALGORITHM_BY_KEY[key];

  return {
    key,
    label: meta.label,
    runtimeMs,
    ...raw,
  };
}

export function runComparison(kind: ScenarioKind, seedIndex: number): ComparisonRun {
  const scenario = scenarioFromKindSeed(kind, seedIndex);
  const results = Object.fromEntries(
    ALGORITHMS.map((algorithm) => [
      algorithm.key,
      timedResult(algorithm.key, scenario, seedIndex),
    ]),
  ) as Record<AlgorithmKey, AlgorithmResult>;

  return { scenario, seedIndex, results };
}
