import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import Controls from "./Controls";
import FieldView from "./FieldView";
import MetricsPanel from "./MetricsPanel";
import ComparisonTable from "./ComparisonTable";
import { ALGORITHMS, runComparison } from "../simulation/algorithms";
import { enabledResults } from "../simulation/metrics";
import type { AlgorithmKey, ScenarioKind } from "../simulation/types";
import {
  revealVariants,
  staggerContainerVariants,
  staggerItemVariants,
  VIEWPORT_ONCE,
} from "../motion/variants";

const DEFAULT_ENABLED = Object.fromEntries(
  ALGORITHMS.map((algorithm) => [algorithm.key, true]),
) as Record<AlgorithmKey, boolean>;

export default function SimulatorLab() {
  const reducedMotion = Boolean(useReducedMotion());
  const [scenario, setScenario] = useState<ScenarioKind>("Sulit");
  const [seed, setSeed] = useState(4);
  const [enabled, setEnabled] =
    useState<Record<AlgorithmKey, boolean>>(DEFAULT_ENABLED);
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
    setEnabled(DEFAULT_ENABLED);
    setShowGrid(true);
    setShowProcessed(true);
    setShowTree(true);
    setProgress(0);
    setPlaying(true);
    lastFrame.current = null;
  };

  return (
    <motion.div
      className="simulator-lab"
      initial="hidden"
      whileInView="visible"
      viewport={VIEWPORT_ONCE}
      variants={revealVariants(reducedMotion, 30)}
    >
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

      <motion.div
        className="simulator-workspace"
        variants={staggerContainerVariants(reducedMotion, 0.08)}
      >
        <motion.div
          className="data-provenance live-provenance"
          variants={staggerItemVariants(reducedMotion)}
        >
          <span className="provenance-dot" />
          Simulasi browser saat ini
        </motion.div>
        <motion.div variants={staggerItemVariants(reducedMotion)}>
          <MetricsPanel results={visibleResults} enabled={enabled} />
        </motion.div>
        <motion.div variants={staggerItemVariants(reducedMotion)}>
          <FieldView
            run={run}
            enabled={enabled}
            progress={progress}
            showGrid={showGrid}
            showProcessed={showProcessed}
            showTree={showTree}
          />
        </motion.div>
        <motion.div variants={staggerItemVariants(reducedMotion)}>
          <ComparisonTable results={run.results} enabled={enabled} />
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
