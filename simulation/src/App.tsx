import { useEffect, useMemo, useRef, useState } from "react";
import Controls from "./components/Controls";
import FieldView from "./components/FieldView";
import MetricsPanel from "./components/MetricsPanel";
import ComparisonTable from "./components/ComparisonTable";
import { ALGORITHMS, runComparison } from "./simulation/algorithms";
import { enabledResults } from "./simulation/metrics";
import type { AlgorithmKey, ScenarioKind } from "./simulation/types";

const defaultEnabled = Object.fromEntries(
  ALGORITHMS.map((algorithm) => [algorithm.key, true]),
) as Record<AlgorithmKey, boolean>;

export default function App() {
  const [scenario, setScenario] = useState<ScenarioKind>("Sulit");
  const [seed, setSeed] = useState(4);
  const [enabled, setEnabled] = useState<Record<AlgorithmKey, boolean>>(defaultEnabled);
  const [playing, setPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [speed, setSpeed] = useState(1.2);
  const [showGrid, setShowGrid] = useState(true);
  const [showProcessed, setShowProcessed] = useState(true);
  const [showTree, setShowTree] = useState(true);
  const lastFrame = useRef<number | null>(null);

  const run = useMemo(() => runComparison(scenario, seed), [scenario, seed]);
  const visibleResults = useMemo(
    () => enabledResults(run.results, enabled),
    [run.results, enabled],
  );

  useEffect(() => {
    setProgress(0);
    setPlaying(true);
    lastFrame.current = null;
  }, [scenario, seed]);

  useEffect(() => {
    if (!playing) {
      lastFrame.current = null;
      return undefined;
    }

    let frame = 0;
    const tick = (time: number) => {
      if (lastFrame.current === null) {
        lastFrame.current = time;
      }
      const delta = time - lastFrame.current;
      lastFrame.current = time;
      setProgress((current) => {
        const next = Math.min(1, current + (delta / 4200) * speed);
        if (next >= 1) {
          setPlaying(false);
        }
        return next;
      });
      frame = window.requestAnimationFrame(tick);
    };

    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [playing, speed]);

  const toggleAlgorithm = (key: AlgorithmKey) => {
    setEnabled((current) => {
      const enabledCount = Object.values(current).filter(Boolean).length;
      if (current[key] && enabledCount === 1) {
        return current;
      }
      return { ...current, [key]: !current[key] };
    });
  };

  const reset = () => {
    setProgress(0);
    setPlaying(false);
    lastFrame.current = null;
  };

  const paperMode = () => {
    setScenario("Sulit");
    setSeed(4);
    setEnabled(defaultEnabled);
    setShowGrid(true);
    setShowProcessed(true);
    setShowTree(true);
    setProgress(0);
    setPlaying(true);
    lastFrame.current = null;
  };

  return (
    <main className="app-shell">
      <Controls
        scenario={scenario}
        seed={seed}
        enabled={enabled}
        playing={playing}
        speed={speed}
        showGrid={showGrid}
        showProcessed={showProcessed}
        showTree={showTree}
        onScenarioChange={setScenario}
        onSeedChange={setSeed}
        onToggleAlgorithm={toggleAlgorithm}
        onPlayingChange={setPlaying}
        onSpeedChange={setSpeed}
        onGridChange={setShowGrid}
        onProcessedChange={setShowProcessed}
        onTreeChange={setShowTree}
        onReset={reset}
        onPaperMode={paperMode}
      />

      <div className="workspace">
        <MetricsPanel results={visibleResults} enabled={enabled} />
        <FieldView
          run={run}
          enabled={enabled}
          progress={progress}
          showGrid={showGrid}
          showProcessed={showProcessed}
          showTree={showTree}
        />
        <ComparisonTable results={run.results} enabled={enabled} />
      </div>
    </main>
  );
}
