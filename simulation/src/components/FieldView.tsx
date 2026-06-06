import { ALGORITHMS, ALGORITHM_BY_KEY } from "../simulation/algorithms";
import type { AlgorithmKey, ComparisonRun, Point } from "../simulation/types";

interface FieldViewProps {
  run: ComparisonRun;
  enabled: Record<AlgorithmKey, boolean>;
  progress: number;
  showGrid: boolean;
  showProcessed: boolean;
  showTree: boolean;
}

function toPointList(points: Point[]): string {
  return points.map(([x, y]) => `${x.toFixed(3)},${y.toFixed(3)}`).join(" ");
}

function clippedPath(points: Point[], progress: number): Point[] {
  if (points.length <= 1 || progress <= 0) {
    return points.length > 0 ? [points[0]] : [];
  }
  if (progress >= 1) {
    return points;
  }

  let total = 0;
  for (let i = 0; i < points.length - 1; i += 1) {
    total += Math.hypot(points[i + 1][0] - points[i][0], points[i + 1][1] - points[i][1]);
  }

  const target = total * progress;
  const output: Point[] = [points[0]];
  let walked = 0;

  for (let i = 0; i < points.length - 1; i += 1) {
    const current = points[i];
    const next = points[i + 1];
    const segment = Math.hypot(next[0] - current[0], next[1] - current[1]);
    if (walked + segment <= target) {
      output.push(next);
      walked += segment;
      continue;
    }

    const remaining = Math.max(0, target - walked);
    const t = segment === 0 ? 0 : remaining / segment;
    output.push([
      current[0] + (next[0] - current[0]) * t,
      current[1] + (next[1] - current[1]) * t,
    ]);
    break;
  }

  return output;
}

export default function FieldView({
  run,
  enabled,
  progress,
  showGrid,
  showProcessed,
  showTree,
}: FieldViewProps) {
  const { scenario } = run;
  const rrt = run.results.rrt;
  const visibleAlgorithms = ALGORITHMS.filter((algorithm) => enabled[algorithm.key]);

  return (
    <section className="field-shell" aria-label="Path-planning field comparison">
      <div className="field-topbar">
        <div>
          <p className="eyebrow">Arena simulasi</p>
          <h2>{scenario.name} / seed {run.seedIndex}</h2>
        </div>
        <div className="field-badges" aria-label="Map statistics">
          <span>{scenario.circles.length} circle obstacles</span>
          <span>{scenario.rects.length} wall blocks</span>
          <span>{scenario.width} x {scenario.height}</span>
        </div>
      </div>

      <div className="field-frame">
        <svg
          className="field-svg"
          viewBox={`0 0 ${scenario.width} ${scenario.height}`}
          role="img"
          aria-label={`Robot path planning field for scenario ${scenario.name}`}
        >
          <g transform={`translate(0 ${scenario.height}) scale(1 -1)`}>
            <rect
              className="field-turf"
              x="0"
              y="0"
              width={scenario.width}
              height={scenario.height}
              rx="1"
            />

            <line className="field-midline" x1={scenario.width / 2} y1="0" x2={scenario.width / 2} y2={scenario.height} />
            <circle className="field-center" cx={scenario.width / 2} cy={scenario.height / 2} r="5.4" />

            {showGrid
              ? Array.from({ length: scenario.width + 1 }, (_, index) => (
                  <line
                    className="grid-line"
                    key={`x-${index}`}
                    x1={index}
                    y1="0"
                    x2={index}
                    y2={scenario.height}
                  />
                ))
              : null}
            {showGrid
              ? Array.from({ length: scenario.height + 1 }, (_, index) => (
                  <line
                    className="grid-line"
                    key={`y-${index}`}
                    x1="0"
                    y1={index}
                    x2={scenario.width}
                    y2={index}
                  />
                ))
              : null}

            {scenario.circles.map((circle, index) => (
              <circle
                className="obstacle obstacle-circle"
                key={`circle-${index}`}
                cx={circle.x}
                cy={circle.y}
                r={circle.r}
              />
            ))}
            {scenario.rects.map((rect, index) => (
              <rect
                className="obstacle obstacle-rect"
                key={`rect-${index}`}
                x={rect.x1}
                y={rect.y1}
                width={rect.x2 - rect.x1}
                height={rect.y2 - rect.y1}
              />
            ))}

            {showProcessed
              ? visibleAlgorithms.map((algorithm) => {
                  const result = run.results[algorithm.key];
                  const cells = result.visited.slice(
                    0,
                    Math.ceil(result.visited.length * progress),
                  );
                  return (
                    <g key={`visited-${algorithm.key}`}>
                      {cells.map((cell, index) => (
                        <rect
                          className="visited-cell"
                          key={`${algorithm.key}-${index}`}
                          x={cell[0]}
                          y={cell[1]}
                          width="1"
                          height="1"
                          fill={algorithm.tone}
                        />
                      ))}
                    </g>
                  );
                })
              : null}

            {showProcessed && enabled.brute
              ? run.results.brute.candidates?.map((point, index) => (
                  <circle
                    className="candidate-dot"
                    key={`candidate-${index}`}
                    cx={point[0]}
                    cy={point[1]}
                    r="0.28"
                  />
                ))
              : null}

            {showTree && enabled.rrt && rrt.treeEdges
              ? rrt.treeEdges
                  .slice(0, Math.ceil(rrt.treeEdges.length * progress))
                  .map((edge, index) => (
                    <line
                      className="rrt-edge"
                      key={`rrt-edge-${index}`}
                      x1={edge.from[0]}
                      y1={edge.from[1]}
                      x2={edge.to[0]}
                      y2={edge.to[1]}
                    />
                  ))
              : null}

            {showTree && enabled.rrt && rrt.treeNodes
              ? rrt.treeNodes
                  .slice(0, Math.ceil(rrt.treeNodes.length * progress))
                  .map((point, index) => (
                    <circle
                      className="rrt-node"
                      key={`rrt-node-${index}`}
                      cx={point[0]}
                      cy={point[1]}
                      r="0.16"
                    />
                  ))
              : null}

            {visibleAlgorithms.map((algorithm) => {
              const result = run.results[algorithm.key];
              if (!result.success) {
                return null;
              }

              const animated = clippedPath(result.path, progress);
              return (
                <g key={`path-${algorithm.key}`}>
                  <polyline
                    className="path-ghost"
                    points={toPointList(result.path)}
                    stroke={algorithm.tone}
                  />
                  <polyline
                    className="path-live"
                    points={toPointList(animated)}
                    stroke={algorithm.tone}
                  />
                </g>
              );
            })}

            <circle className="start-node" cx={scenario.start[0] + 0.5} cy={scenario.start[1] + 0.5} r="1.1" />
            <g className="goal-node">
              <line x1={scenario.goal[0] - 0.8} y1={scenario.goal[1] - 0.8} x2={scenario.goal[0] + 1.8} y2={scenario.goal[1] + 1.8} />
              <line x1={scenario.goal[0] - 0.8} y1={scenario.goal[1] + 1.8} x2={scenario.goal[0] + 1.8} y2={scenario.goal[1] - 0.8} />
            </g>
          </g>
        </svg>

        <div className="legend-strip">
          {visibleAlgorithms.map((algorithm) => {
            const result = run.results[algorithm.key];
            return (
              <span
                className={result.success ? "legend-item" : "legend-item muted"}
                key={algorithm.key}
              >
                <span style={{ backgroundColor: algorithm.tone }} />
                {ALGORITHM_BY_KEY[algorithm.key].label}
              </span>
            );
          })}
        </div>
      </div>
    </section>
  );
}
