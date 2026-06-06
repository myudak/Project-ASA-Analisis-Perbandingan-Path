export type Point = readonly [number, number];
export type Cell = readonly [number, number];

export type ScenarioKind = "Mudah" | "Sedang" | "Sulit" | "Padat";

export type AlgorithmKey = "brute" | "ucs" | "gbfs" | "astar" | "rrt";

export interface Circle {
  x: number;
  y: number;
  r: number;
}

export interface Rect {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface MapScenario {
  name: ScenarioKind;
  width: number;
  height: number;
  circles: Circle[];
  rects: Rect[];
  start: Cell;
  goal: Cell;
}

export interface AlgorithmMeta {
  key: AlgorithmKey;
  label: string;
  shortLabel: string;
  tone: string;
  description: string;
}

export interface TreeEdge {
  from: Point;
  to: Point;
}

export interface AlgorithmResult {
  key: AlgorithmKey;
  label: string;
  path: Point[];
  gridPath?: Cell[];
  cost: number;
  processed: number;
  success: boolean;
  runtimeMs: number;
  visited: Cell[];
  candidates?: Point[];
  treeNodes?: Point[];
  treeEdges?: TreeEdge[];
}

export interface ComparisonRun {
  scenario: MapScenario;
  seedIndex: number;
  results: Record<AlgorithmKey, AlgorithmResult>;
}
