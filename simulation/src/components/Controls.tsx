import {
  Activity,
  FileText,
  Grid3X3,
  Network,
  Pause,
  Play,
  Radar,
  RotateCcw,
} from "lucide-react";
import { ALGORITHMS } from "../simulation/algorithms";
import { SCENARIOS, SEEDS } from "../simulation/scenarios";
import type { AlgorithmKey, ScenarioKind } from "../simulation/types";

interface ControlsProps {
  scenario: ScenarioKind;
  seed: number;
  enabled: Record<AlgorithmKey, boolean>;
  playing: boolean;
  speed: number;
  showGrid: boolean;
  showProcessed: boolean;
  showTree: boolean;
  onScenarioChange: (scenario: ScenarioKind) => void;
  onSeedChange: (seed: number) => void;
  onToggleAlgorithm: (key: AlgorithmKey) => void;
  onPlayingChange: (playing: boolean) => void;
  onSpeedChange: (speed: number) => void;
  onGridChange: (enabled: boolean) => void;
  onProcessedChange: (enabled: boolean) => void;
  onTreeChange: (enabled: boolean) => void;
  onReset: () => void;
  onPaperMode: () => void;
}

export default function Controls({
  scenario,
  seed,
  enabled,
  playing,
  speed,
  showGrid,
  showProcessed,
  showTree,
  onScenarioChange,
  onSeedChange,
  onToggleAlgorithm,
  onPlayingChange,
  onSpeedChange,
  onGridChange,
  onProcessedChange,
  onTreeChange,
  onReset,
  onPaperMode,
}: ControlsProps) {
  return (
    <aside className="control-rail" aria-label="Simulation controls">
      <div className="brand-block">
        <div className="brand-mark">
          <Radar size={22} />
        </div>
        <div>
          <p className="eyebrow">ASA 2026-1</p>
          <h1>Robot Path Lab</h1>
        </div>
      </div>

      <div className="control-group">
        <div className="group-title">
          <Activity size={16} />
          Skenario
        </div>
        <div className="scenario-grid" role="group" aria-label="Scenario selector">
          {SCENARIOS.map((item) => (
            <button
              className={item === scenario ? "segmented active" : "segmented"}
              key={item}
              type="button"
              onClick={() => onScenarioChange(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="control-group">
        <div className="group-title">Seed</div>
        <div className="seed-row" role="group" aria-label="Seed selector">
          {SEEDS.map((item) => (
            <button
              className={item === seed ? "seed active" : "seed"}
              key={item}
              type="button"
              onClick={() => onSeedChange(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="control-group">
        <div className="group-title">Algoritma</div>
        <div className="algorithm-toggles">
          {ALGORITHMS.map((algorithm) => (
            <button
              className={enabled[algorithm.key] ? "algo-toggle active" : "algo-toggle"}
              key={algorithm.key}
              type="button"
              onClick={() => onToggleAlgorithm(algorithm.key)}
            >
              <span className="algo-swatch" style={{ backgroundColor: algorithm.tone }} />
              <span>
                <strong>{algorithm.label}</strong>
                <small>{algorithm.description}</small>
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="transport-row">
        <button
          className="icon-button primary"
          type="button"
          aria-label={playing ? "Pause animation" : "Play animation"}
          title={playing ? "Pause" : "Play"}
          onClick={() => onPlayingChange(!playing)}
        >
          {playing ? <Pause size={18} /> : <Play size={18} />}
        </button>
        <button
          className="icon-button"
          type="button"
          aria-label="Reset animation"
          title="Reset"
          onClick={onReset}
        >
          <RotateCcw size={18} />
        </button>
        <button
          className="text-button"
          type="button"
          onClick={onPaperMode}
        >
          <FileText size={17} />
          Paper mode
        </button>
      </div>

      <div className="control-group">
        <label className="slider-label" htmlFor="speed">
          Speed
          <span>{speed.toFixed(1)}x</span>
        </label>
        <input
          id="speed"
          className="speed-slider"
          type="range"
          min="0.5"
          max="3"
          step="0.1"
          value={speed}
          onChange={(event) => onSpeedChange(Number(event.target.value))}
        />
      </div>

      <div className="control-group compact">
        <button
          className={showGrid ? "option-toggle active" : "option-toggle"}
          type="button"
          onClick={() => onGridChange(!showGrid)}
        >
          <Grid3X3 size={16} />
          Grid
        </button>
        <button
          className={showProcessed ? "option-toggle active" : "option-toggle"}
          type="button"
          onClick={() => onProcessedChange(!showProcessed)}
        >
          <Activity size={16} />
          Processed
        </button>
        <button
          className={showTree ? "option-toggle active" : "option-toggle"}
          type="button"
          onClick={() => onTreeChange(!showTree)}
        >
          <Network size={16} />
          RRT* tree
        </button>
      </div>
    </aside>
  );
}
