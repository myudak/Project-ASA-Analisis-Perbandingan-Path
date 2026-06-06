import type { AlgorithmKey, AlgorithmResult } from "./types";

export function formatCost(value: number): string {
  return Number.isFinite(value) ? value.toFixed(2) : "-";
}

export function formatMs(value: number): string {
  if (value < 10) {
    return value.toFixed(2);
  }
  if (value < 100) {
    return value.toFixed(1);
  }
  return Math.round(value).toString();
}

export function bestSuccessfulBy(
  results: AlgorithmResult[],
  selector: (result: AlgorithmResult) => number,
): AlgorithmResult | undefined {
  let best: AlgorithmResult | undefined;
  let bestValue = Number.POSITIVE_INFINITY;

  for (const result of results) {
    if (!result.success) {
      continue;
    }
    const value = selector(result);
    if (value < bestValue) {
      best = result;
      bestValue = value;
    }
  }

  return best;
}

export function enabledResults(
  results: Record<AlgorithmKey, AlgorithmResult>,
  enabled: Record<AlgorithmKey, boolean>,
): AlgorithmResult[] {
  return Object.values(results).filter((result) => enabled[result.key]);
}
