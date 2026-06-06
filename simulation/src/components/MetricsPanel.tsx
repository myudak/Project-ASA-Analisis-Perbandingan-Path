import { Award, Gauge, MousePointer2, TimerReset } from "lucide-react";
import { ALGORITHM_BY_KEY } from "../simulation/algorithms";
import { bestSuccessfulBy, formatCost, formatMs } from "../simulation/metrics";
import type { AlgorithmKey, AlgorithmResult } from "../simulation/types";

interface MetricsPanelProps {
  results: AlgorithmResult[];
  enabled: Record<AlgorithmKey, boolean>;
}

export default function MetricsPanel({ results }: MetricsPanelProps) {
  const bestCost = bestSuccessfulBy(results, (result) => result.cost);
  const fastest = bestSuccessfulBy(results, (result) => result.runtimeMs);
  const leanest = bestSuccessfulBy(results, (result) => result.processed);
  const successCount = results.filter((result) => result.success).length;

  const metrics = [
    {
      label: "Best cost",
      value: bestCost ? formatCost(bestCost.cost) : "-",
      caption: bestCost ? ALGORITHM_BY_KEY[bestCost.key].label : "No path",
      icon: <Award size={18} />,
    },
    {
      label: "Fastest run",
      value: fastest ? `${formatMs(fastest.runtimeMs)} ms` : "-",
      caption: fastest ? ALGORITHM_BY_KEY[fastest.key].label : "No path",
      icon: <TimerReset size={18} />,
    },
    {
      label: "Lowest processed",
      value: leanest ? Math.round(leanest.processed).toLocaleString("en-US") : "-",
      caption: leanest ? ALGORITHM_BY_KEY[leanest.key].label : "No path",
      icon: <Gauge size={18} />,
    },
    {
      label: "Success",
      value: `${successCount}/${results.length}`,
      caption: "enabled methods",
      icon: <MousePointer2 size={18} />,
    },
  ];

  return (
    <section className="metrics-strip" aria-label="Simulation metrics">
      {metrics.map((metric) => (
        <article className="metric-tile" key={metric.label}>
          <div className="metric-icon">{metric.icon}</div>
          <div>
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
            <small>{metric.caption}</small>
          </div>
        </article>
      ))}
    </section>
  );
}
