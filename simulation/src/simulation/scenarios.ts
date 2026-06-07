import { PythonRandom } from "./random";
import type { Cell, Circle, MapScenario, Rect, ScenarioKind } from "./types";
import { cellCenter, distance, neighbors8 } from "./geometry";

export const SCENARIOS: ScenarioKind[] = ["Mudah", "Sedang", "Sulit", "Padat"];
export const SEEDS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] as const;
export const GRID_WIDTH = 60;
export const GRID_HEIGHT = 40;
export const START: Cell = [3, 20];
export const GOAL: Cell = [56, 20];

export function scenarioSeed(kind: ScenarioKind, seedIndex: number): number {
  return 1000 * kind.length + seedIndex;
}

export function rrtSeed(kind: ScenarioKind, seedIndex: number): number {
  return 5000 + seedIndex + kind.length * 100;
}

export function scenarioFromSeed(kind: ScenarioKind, seed: number): MapScenario {
  const random = new PythonRandom(seed);
  const circles: Circle[] = [];
  const rects: Rect[] = [];

  if (kind === "Mudah") {
    for (let i = 0; i < 5; i += 1) {
      circles.push({
        x: random.uniform(15, 45),
        y: random.uniform(8, 32),
        r: random.uniform(2.0, 3.5),
      });
    }
  } else if (kind === "Sedang") {
    for (let i = 0; i < 10; i += 1) {
      circles.push({
        x: random.uniform(12, 48),
        y: random.uniform(5, 35),
        r: random.uniform(2.0, 3.8),
      });
    }
    rects.push({ x1: 29, y1: 0, x2: 31, y2: 12 });
    rects.push({ x1: 29, y1: 28, x2: 31, y2: 40 });
  } else if (kind === "Sulit") {
    rects.push({ x1: 18, y1: 0, x2: 21, y2: 26 });
    rects.push({ x1: 36, y1: 14, x2: 39, y2: 40 });
    for (let i = 0; i < 8; i += 1) {
      circles.push({
        x: random.uniform(12, 48),
        y: random.uniform(6, 34),
        r: random.uniform(2.0, 3.0),
      });
    }
  } else {
    for (let i = 0; i < 19; i += 1) {
      circles.push({
        x: random.uniform(9, 51),
        y: random.uniform(4, 36),
        r: random.uniform(1.8, 3.5),
      });
    }
    rects.push({ x1: 25, y1: 0, x2: 27, y2: 15 });
    rects.push({ x1: 35, y1: 25, x2: 37, y2: 40 });
  }

  const startPoint = cellCenter(START);
  const goalPoint = cellCenter(GOAL);
  const filteredCircles = circles.filter(
    (circle) =>
      distance([circle.x, circle.y], startPoint) > circle.r + 4 &&
      distance([circle.x, circle.y], goalPoint) > circle.r + 4,
  );

  return {
    name: kind,
    width: GRID_WIDTH,
    height: GRID_HEIGHT,
    circles: filteredCircles,
    rects,
    start: START,
    goal: GOAL,
  };
}

export function scenarioFromKindSeed(
  kind: ScenarioKind,
  seedIndex: number,
): MapScenario {
  for (let attempt = 0; attempt < 1000; attempt += 1) {
    const scenario = scenarioFromSeed(
      kind,
      scenarioSeed(kind, seedIndex) + attempt * 100_003,
    );
    const queue: Cell[] = [scenario.start];
    const visited = new Set([scenario.start.join(",")]);
    for (let index = 0; index < queue.length; index += 1) {
      const current = queue[index];
      for (const [neighbor] of neighbors8(scenario, current)) {
        const key = neighbor.join(",");
        if (!visited.has(key)) {
          visited.add(key);
          queue.push(neighbor);
        }
      }
    }
    if (visited.has(scenario.goal.join(","))) {
      return scenario;
    }
  }
  throw new Error(`Unable to generate a solvable ${kind} scenario.`);
}
