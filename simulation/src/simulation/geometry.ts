import type { Cell, MapScenario, Point } from "./types";

export function distance(a: Point | Cell, b: Point | Cell): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1]);
}

export function cellCenter(cell: Cell): Point {
  return [cell[0] + 0.5, cell[1] + 0.5];
}

export function cellKey(cell: Cell): string {
  return `${cell[0]},${cell[1]}`;
}

export function isFreePoint(
  scenario: MapScenario,
  point: Point,
  margin = 0,
): boolean {
  const [x, y] = point;
  if (x < 0 || y < 0 || x >= scenario.width || y >= scenario.height) {
    return false;
  }

  for (const circle of scenario.circles) {
    if ((x - circle.x) ** 2 + (y - circle.y) ** 2 <= (circle.r + margin) ** 2) {
      return false;
    }
  }

  for (const rect of scenario.rects) {
    const insideX = rect.x1 - margin <= x && x <= rect.x2 + margin;
    const insideY = rect.y1 - margin <= y && y <= rect.y2 + margin;
    if (insideX && insideY) {
      return false;
    }
  }

  return true;
}

export function isFreeCell(scenario: MapScenario, cell: Cell): boolean {
  return isFreePoint(scenario, cellCenter(cell));
}

export function lineFree(
  scenario: MapScenario,
  start: Point,
  goal: Point,
  step = 1,
): boolean {
  const segmentLength = distance(start, goal);
  const sampleCount = Math.max(1, Math.floor(segmentLength / step));

  for (let i = 0; i <= sampleCount; i += 1) {
    const t = i / sampleCount;
    const point: Point = [
      start[0] + (goal[0] - start[0]) * t,
      start[1] + (goal[1] - start[1]) * t,
    ];
    if (!isFreePoint(scenario, point)) {
      return false;
    }
  }

  return true;
}

export function neighbors8(scenario: MapScenario, cell: Cell): [Cell, number][] {
  const [x, y] = cell;
  const neighbors: [Cell, number][] = [];
  const steps: Cell[] = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
    [-1, -1],
    [-1, 1],
    [1, -1],
    [1, 1],
  ];

  for (const [dx, dy] of steps) {
    const neighbor: Cell = [x + dx, y + dy];
    if (
      neighbor[0] < 0 ||
      neighbor[0] >= scenario.width ||
      neighbor[1] < 0 ||
      neighbor[1] >= scenario.height
    ) {
      continue;
    }
    if (!isFreeCell(scenario, neighbor)) {
      continue;
    }

    if (lineFree(scenario, cellCenter(cell), cellCenter(neighbor), 0.5)) {
      neighbors.push([neighbor, Math.sqrt(dx * dx + dy * dy)]);
    }
  }

  return neighbors;
}

export function pathCostCells(path: Cell[]): number {
  if (path.length === 0) {
    return Number.POSITIVE_INFINITY;
  }

  let total = 0;
  for (let i = 0; i < path.length - 1; i += 1) {
    total += distance(path[i], path[i + 1]);
  }
  return total;
}

export function pathLength(path: Point[]): number {
  if (path.length === 0) {
    return Number.POSITIVE_INFINITY;
  }

  let total = 0;
  for (let i = 0; i < path.length - 1; i += 1) {
    total += distance(path[i], path[i + 1]);
  }
  return total;
}
