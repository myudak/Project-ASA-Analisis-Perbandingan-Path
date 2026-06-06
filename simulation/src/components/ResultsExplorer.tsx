import { useMemo, useState } from "react";
import { BarChart3, Database, Sigma } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  PAPER_RESULTS,
  paperResultsForScenario,
  type PaperResult,
} from "../data/paperResults";
import { ALGORITHMS, ALGORITHM_BY_KEY } from "../simulation/algorithms";
import { SCENARIOS } from "../simulation/scenarios";
import type { AlgorithmKey, ScenarioKind } from "../simulation/types";
import {
  motionTransition,
  revealVariants,
  staggerContainerVariants,
  staggerItemVariants,
  VIEWPORT_ONCE,
} from "../motion/variants";

type MetricKey = "cost" | "time" | "processed";

const METRICS: Record<
  MetricKey,
  {
    title: string;
    shortTitle: string;
    mean: keyof Pick<PaperResult, "meanCost" | "meanTimeMs" | "meanProcessed">;
    std: keyof Pick<PaperResult, "stdCost" | "stdTimeMs" | "stdProcessed">;
    unit: string;
  }
> = {
  cost: {
    title: "Biaya lintasan rata-rata",
    shortTitle: "Cost",
    mean: "meanCost",
    std: "stdCost",
    unit: "unit",
  },
  time: {
    title: "Waktu eksekusi rata-rata",
    shortTitle: "Waktu",
    mean: "meanTimeMs",
    std: "stdTimeMs",
    unit: "ms",
  },
  processed: {
    title: "Jumlah processed rata-rata",
    shortTitle: "Processed",
    mean: "meanProcessed",
    std: "stdProcessed",
    unit: "item",
  },
};

function formatValue(value: number, metric: MetricKey): string {
  if (metric === "processed") {
    return value.toLocaleString("id-ID", { maximumFractionDigits: 1 });
  }
  return value.toLocaleString("id-ID", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  });
}

interface BarChartProps {
  metric: MetricKey;
  rows: PaperResult[];
  reducedMotion: boolean;
}

function BarChart({ metric, rows, reducedMotion }: BarChartProps) {
  const config = METRICS[metric];
  const width = 720;
  const height = 310;
  const margin = { top: 24, right: 24, bottom: 58, left: 70 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;
  const maximum = Math.max(
    ...rows.map((row) => Number(row[config.mean]) + Number(row[config.std])),
    1,
  );
  const paddedMaximum = maximum * 1.12;
  const slot = innerWidth / rows.length;
  const barWidth = Math.min(68, slot * 0.58);
  const ticks = [0, 0.25, 0.5, 0.75, 1];
  const baseline = margin.top + innerHeight;
  const geometryTransition = motionTransition(reducedMotion, 0.52);

  return (
    <motion.article
      className="result-chart"
      variants={staggerItemVariants(reducedMotion)}
    >
      <div className="chart-heading">
        <div>
          <span>{config.shortTitle}</span>
          <h3>{config.title}</h3>
        </div>
        <BarChart3 size={20} />
      </div>

      <svg
        className="bar-chart"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={`${config.title} untuk algoritma yang dipilih`}
      >
        {ticks.map((tick) => {
          const y = margin.top + innerHeight - tick * innerHeight;
          const value = paddedMaximum * tick;
          return (
            <g key={tick}>
              <line
                className="chart-grid-line"
                x1={margin.left}
                x2={width - margin.right}
                y1={y}
                y2={y}
              />
              <text className="chart-axis-label" x={margin.left - 10} y={y + 4} textAnchor="end">
                {formatValue(value, metric)}
              </text>
            </g>
          );
        })}

        <AnimatePresence initial={!reducedMotion}>
          {rows.map((row, index) => {
            const mean = Number(row[config.mean]);
            const std = Number(row[config.std]);
            const x = margin.left + index * slot + (slot - barWidth) / 2;
            const barHeight = (mean / paddedMaximum) * innerHeight;
            const y = baseline - barHeight;
            const errorTop =
              baseline - ((mean + std) / paddedMaximum) * innerHeight;
            const errorBottom =
              baseline -
              (Math.max(0, mean - std) / paddedMaximum) * innerHeight;
            const tone = ALGORITHM_BY_KEY[row.key].tone;
            const center = x + barWidth / 2;

            return (
              <motion.g
                key={row.key}
                initial={reducedMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={geometryTransition}
              >
                <title>
                  {`${row.algorithm}: ${formatValue(mean, metric)} ± ${formatValue(std, metric)} ${config.unit}`}
                </title>
                <motion.rect
                  className="chart-bar"
                  fill={tone}
                  initial={
                    reducedMotion
                      ? false
                      : { x, y: baseline, width: barWidth, height: 0 }
                  }
                  animate={{ x, y, width: barWidth, height: barHeight }}
                  exit={{ y: baseline, height: 0 }}
                  transition={geometryTransition}
                />
                <motion.line
                  className="error-line"
                  initial={
                    reducedMotion
                      ? false
                      : { x1: center, x2: center, y1: baseline, y2: baseline }
                  }
                  animate={{
                    x1: center,
                    x2: center,
                    y1: errorTop,
                    y2: errorBottom,
                  }}
                  exit={{ y1: baseline, y2: baseline }}
                  transition={geometryTransition}
                />
                <motion.line
                  className="error-line"
                  initial={
                    reducedMotion
                      ? false
                      : { x1: center, x2: center, y1: baseline, y2: baseline }
                  }
                  animate={{
                    x1: x + barWidth * 0.3,
                    x2: x + barWidth * 0.7,
                    y1: errorTop,
                    y2: errorTop,
                  }}
                  exit={{ x1: center, x2: center, y1: baseline, y2: baseline }}
                  transition={geometryTransition}
                />
                <motion.line
                  className="error-line"
                  initial={
                    reducedMotion
                      ? false
                      : { x1: center, x2: center, y1: baseline, y2: baseline }
                  }
                  animate={{
                    x1: x + barWidth * 0.3,
                    x2: x + barWidth * 0.7,
                    y1: errorBottom,
                    y2: errorBottom,
                  }}
                  exit={{ x1: center, x2: center, y1: baseline, y2: baseline }}
                  transition={geometryTransition}
                />
                <motion.text
                  className="chart-value-label"
                  textAnchor="middle"
                  initial={
                    reducedMotion
                      ? false
                      : { x: center, y: baseline, opacity: 0 }
                  }
                  animate={{
                    x: center,
                    y: Math.max(16, errorTop - 7),
                    opacity: 1,
                  }}
                  exit={{ y: baseline, opacity: 0 }}
                  transition={geometryTransition}
                >
                  {formatValue(mean, metric)}
                </motion.text>
                <motion.text
                  className="chart-category-label"
                  textAnchor="middle"
                  initial={reducedMotion ? false : { opacity: 0 }}
                  animate={{ x: center, y: height - 22, opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={geometryTransition}
                >
                  {ALGORITHM_BY_KEY[row.key].shortLabel}
                </motion.text>
              </motion.g>
            );
          })}
        </AnimatePresence>
      </svg>

      <div className="chart-details">
        <AnimatePresence initial={false}>
          {rows.map((row) => (
            <motion.span
              layout="position"
              key={row.key}
              initial={reducedMotion ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={motionTransition(reducedMotion, 0.28)}
            >
              <i style={{ backgroundColor: ALGORITHM_BY_KEY[row.key].tone }} />
              {row.algorithm}: {formatValue(Number(row[config.mean]), metric)} ±{" "}
              {formatValue(Number(row[config.std]), metric)}
            </motion.span>
          ))}
        </AnimatePresence>
      </div>
    </motion.article>
  );
}

interface SuccessMatrixProps {
  enabled: Record<AlgorithmKey, boolean>;
  reducedMotion: boolean;
}

function SuccessMatrix({ enabled, reducedMotion }: SuccessMatrixProps) {
  const algorithms = ALGORITHMS.filter((algorithm) => enabled[algorithm.key]);

  return (
    <motion.article
      className="success-panel"
      variants={staggerItemVariants(reducedMotion)}
    >
      <div className="chart-heading">
        <div>
          <span>Reliabilitas</span>
          <h3>Tingkat keberhasilan lintasan</h3>
        </div>
        <Sigma size={20} />
      </div>
      <div className="success-scroll">
        <table className="success-matrix">
          <thead>
            <tr>
              <th>Skenario</th>
              <AnimatePresence initial={false}>
                {algorithms.map((algorithm) => (
                  <motion.th
                    layout="position"
                    key={algorithm.key}
                    initial={reducedMotion ? false : { opacity: 0, scale: 0.94 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.94 }}
                    transition={motionTransition(reducedMotion, 0.28)}
                  >
                    {algorithm.shortLabel}
                  </motion.th>
                ))}
              </AnimatePresence>
            </tr>
          </thead>
          <tbody>
            {SCENARIOS.map((scenario) => (
              <tr key={scenario}>
                <th>{scenario}</th>
                <AnimatePresence initial={false}>
                  {algorithms.map((algorithm) => {
                    const result = PAPER_RESULTS.find(
                      (row) =>
                        row.scenario === scenario && row.key === algorithm.key,
                    );
                    const rate = result?.successRate ?? 0;
                    return (
                      <motion.td
                        layout="position"
                        key={algorithm.key}
                        initial={
                          reducedMotion ? false : { opacity: 0, scale: 0.94 }
                        }
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.94 }}
                        transition={motionTransition(reducedMotion, 0.28)}
                      >
                        <motion.span
                          className={`success-cell ${rate === 100 ? "perfect" : rate >= 80 ? "partial" : "weak"}`}
                          initial={
                            reducedMotion ? false : { opacity: 0, y: 5 }
                          }
                          animate={{ opacity: 1, y: 0 }}
                          transition={motionTransition(reducedMotion, 0.32)}
                        >
                          {rate.toFixed(0)}%
                        </motion.span>
                      </motion.td>
                    );
                  })}
                </AnimatePresence>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.article>
  );
}

export default function ResultsExplorer() {
  const reducedMotion = Boolean(useReducedMotion());
  const [scenario, setScenario] = useState<ScenarioKind>("Sulit");
  const [enabled, setEnabled] = useState<Record<AlgorithmKey, boolean>>({
    brute: true,
    ucs: true,
    gbfs: true,
    astar: true,
    rrt: true,
  });

  const rows = useMemo(
    () => paperResultsForScenario(scenario).filter((result) => enabled[result.key]),
    [scenario, enabled],
  );

  const toggleAlgorithm = (key: AlgorithmKey) => {
    setEnabled((current) => {
      const activeCount = Object.values(current).filter(Boolean).length;
      if (current[key] && activeCount === 1) {
        return current;
      }
      return { ...current, [key]: !current[key] };
    });
  };

  return (
    <motion.div
      className="results-explorer"
      initial="hidden"
      whileInView="visible"
      viewport={VIEWPORT_ONCE}
      variants={revealVariants(reducedMotion, 28)}
    >
      <motion.div
        className="results-toolbar"
        variants={staggerContainerVariants(reducedMotion)}
      >
        <div>
          <p className="toolbar-label">Skenario eksperimen</p>
          <div className="report-segments" role="group" aria-label="Filter skenario hasil">
            {SCENARIOS.map((item) => (
              <motion.button
                layout
                key={item}
                type="button"
                className={item === scenario ? "active" : ""}
                aria-pressed={item === scenario}
                onClick={() => setScenario(item)}
                whileTap={reducedMotion ? undefined : { scale: 0.97 }}
                transition={motionTransition(reducedMotion, 0.18)}
              >
                {item}
              </motion.button>
            ))}
          </div>
        </div>

        <div>
          <p className="toolbar-label">Algoritma ditampilkan</p>
          <div className="result-algorithm-filter" role="group" aria-label="Filter algoritma hasil">
            {ALGORITHMS.map((algorithm) => (
              <motion.button
                layout
                key={algorithm.key}
                type="button"
                className={enabled[algorithm.key] ? "active" : ""}
                aria-pressed={enabled[algorithm.key]}
                onClick={() => toggleAlgorithm(algorithm.key)}
                whileTap={reducedMotion ? undefined : { scale: 0.97 }}
                transition={motionTransition(reducedMotion, 0.18)}
              >
                <i style={{ backgroundColor: algorithm.tone }} />
                {algorithm.shortLabel}
              </motion.button>
            ))}
          </div>
        </div>

        <div className="data-provenance">
          <Database size={15} />
          Data makalah, rata-rata 5 seed
        </div>
      </motion.div>

      <motion.div
        className="charts-grid"
        variants={staggerContainerVariants(reducedMotion, 0.08)}
      >
        <BarChart metric="cost" rows={rows} reducedMotion={reducedMotion} />
        <BarChart metric="time" rows={rows} reducedMotion={reducedMotion} />
        <BarChart metric="processed" rows={rows} reducedMotion={reducedMotion} />
        <SuccessMatrix enabled={enabled} reducedMotion={reducedMotion} />
      </motion.div>
    </motion.div>
  );
}
