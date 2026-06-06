import csvText from "./ringkasan_eksperimen.csv?raw";
import type { AlgorithmKey, ScenarioKind } from "../simulation/types";

export type PaperAlgorithm = "Brute Force" | "UCS" | "GBFS" | "A*" | "RRT*";

export interface PaperResult {
  scenario: ScenarioKind;
  algorithm: PaperAlgorithm;
  key: AlgorithmKey;
  successRate: number;
  meanCost: number;
  stdCost: number;
  meanTimeMs: number;
  stdTimeMs: number;
  meanProcessed: number;
  stdProcessed: number;
}

const ALGORITHM_KEYS: Record<PaperAlgorithm, AlgorithmKey> = {
  "Brute Force": "brute",
  UCS: "ucs",
  GBFS: "gbfs",
  "A*": "astar",
  "RRT*": "rrt",
};

function numberAt(values: string[], index: number): number {
  const parsed = Number(values[index]);
  if (!Number.isFinite(parsed)) {
    throw new Error(`Invalid numeric paper result at column ${index}.`);
  }
  return parsed;
}

function parsePaperResults(csv: string): PaperResult[] {
  const lines = csv.trim().split(/\r?\n/);
  const rows = lines.slice(1);

  return rows.map((line) => {
    const values = line.split(",");
    const algorithm = values[1] as PaperAlgorithm;

    if (!(algorithm in ALGORITHM_KEYS)) {
      throw new Error(`Unknown algorithm in paper results: ${values[1]}`);
    }

    return {
      scenario: values[0] as ScenarioKind,
      algorithm,
      key: ALGORITHM_KEYS[algorithm],
      successRate: numberAt(values, 2),
      meanCost: numberAt(values, 3),
      stdCost: numberAt(values, 4),
      meanTimeMs: numberAt(values, 5),
      stdTimeMs: numberAt(values, 6),
      meanProcessed: numberAt(values, 7),
      stdProcessed: numberAt(values, 8),
    };
  });
}

export const PAPER_RESULTS = parsePaperResults(csvText);

export function paperResultsForScenario(scenario: ScenarioKind): PaperResult[] {
  return PAPER_RESULTS.filter((result) => result.scenario === scenario);
}

