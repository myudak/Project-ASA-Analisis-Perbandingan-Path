import { ALGORITHMS } from "../simulation/algorithms";
import { formatCost, formatMs } from "../simulation/metrics";
import type { AlgorithmKey, AlgorithmResult } from "../simulation/types";

interface ComparisonTableProps {
  results: Record<AlgorithmKey, AlgorithmResult>;
  enabled: Record<AlgorithmKey, boolean>;
}

export default function ComparisonTable({ results, enabled }: ComparisonTableProps) {
  return (
    <section className="table-panel" aria-label="Algorithm comparison table">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Ringkasan run</p>
          <h2>Perbandingan algoritma</h2>
        </div>
      </div>

      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Algoritma</th>
              <th>Status</th>
              <th>Cost</th>
              <th>Processed</th>
              <th>Browser ms</th>
            </tr>
          </thead>
          <tbody>
            {ALGORITHMS.map((algorithm) => {
              const result = results[algorithm.key];
              return (
                <tr className={enabled[algorithm.key] ? "" : "disabled-row"} key={algorithm.key}>
                  <td>
                    <span className="table-algorithm">
                      <span style={{ backgroundColor: algorithm.tone }} />
                      {algorithm.label}
                    </span>
                  </td>
                  <td>
                    <span className={result.success ? "status-pill ok" : "status-pill fail"}>
                      {result.success ? "OK" : "Gagal"}
                    </span>
                  </td>
                  <td>{formatCost(result.cost)}</td>
                  <td>{Math.round(result.processed).toLocaleString("en-US")}</td>
                  <td>{formatMs(result.runtimeMs)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
