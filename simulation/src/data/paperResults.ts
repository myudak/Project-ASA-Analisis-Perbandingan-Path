import csvText from "./ringkasan_eksperimen.csv?raw";
import scalingCsvText from "./ringkasan_grid_scaling.csv?raw";
import densityCsvText from "./ringkasan_density_sweep.csv?raw";
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
  meanDetour: number;
  stdDetour: number;
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
  const headers = lines[0].split(",");
  const index = (name: string) => {
    const position = headers.indexOf(name);
    if (position < 0) throw new Error(`Missing CSV column: ${name}`);
    return position;
  };
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
      successRate: numberAt(values, index("success_rate")),
      meanCost: numberAt(values, index("avg_cost")),
      stdCost: numberAt(values, index("std_cost")),
      meanDetour: numberAt(values, index("avg_detour_ratio")),
      stdDetour: numberAt(values, index("std_detour_ratio")),
      meanTimeMs: numberAt(values, index("avg_time_ms")),
      stdTimeMs: numberAt(values, index("std_time_ms")),
      meanProcessed: numberAt(values, index("avg_expanded")),
      stdProcessed: numberAt(values, index("std_expanded")),
    };
  });
}

function parseRecords(csv: string): Record<string, string>[] {
  const lines = csv.trim().split(/\r?\n/);
  const headers = lines[0].split(",");
  return lines.slice(1).map((line) =>
    Object.fromEntries(line.split(",").map((value, index) => [headers[index], value])),
  );
}

export const PAPER_RESULTS = parsePaperResults(csvText);
export const SCALING_RESULTS = parseRecords(scalingCsvText);
export const DENSITY_RESULTS = parseRecords(densityCsvText);

export function paperResultsForScenario(scenario: ScenarioKind): PaperResult[] {
  return PAPER_RESULTS.filter((result) => result.scenario === scenario);
}
