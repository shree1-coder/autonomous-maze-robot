import React from "react";
import {
  ExplorationStrategy,
  SimulationSpeed,
} from "@maze/shared";
import {
  Eye,
  EyeOff,
  FastForward,
  Pause,
  Play,
  RotateCcw,
  SkipForward,
  Square,
} from "lucide-react";
import { useSimulation } from "../hooks/useSimulation.js";

interface ControlBarProps {
  showGroundTruthToggle?: boolean;
}

export const ControlBar: React.FC<ControlBarProps> = ({ showGroundTruthToggle = true }) => {
  const {
    state,
    start,
    pause,
    resume,
    step,
    stop,
    reset,
    setSpeed,
    setStrategy,
    debugMode,
    setDebugMode,
  } = useSimulation();

  const isRunning = state?.isRunning ?? false;
  const isPaused = state?.isPaused ?? false;
  const currentSpeed = (state as any)?.speed || "NORMAL";
  const currentStrategy = state?.activeStrategy || "SYSTEMATIC";

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg flex flex-wrap items-center justify-between gap-3">
      {/* Primary Action Buttons */}
      <div className="flex items-center gap-2">
        {!isRunning ? (
          <button
            onClick={start}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-sm shadow-md shadow-cyan-900/30 transition-all"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Start</span>
          </button>
        ) : isPaused ? (
          <button
            onClick={resume}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm shadow-md shadow-emerald-900/30 transition-all"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Resume</span>
          </button>
        ) : (
          <button
            onClick={pause}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold text-sm shadow-md shadow-amber-900/30 transition-all"
          >
            <Pause className="w-4 h-4" />
            <span>Pause</span>
          </button>
        )}

        <button
          onClick={step}
          disabled={isRunning && !isPaused}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-slate-200 font-semibold text-sm border border-slate-700 transition-all"
          title="Execute Single Simulation Step"
        >
          <SkipForward className="w-4 h-4" />
          <span>Step</span>
        </button>

        <button
          onClick={stop}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-rose-400 font-semibold text-sm border border-slate-700 transition-all"
          title="Stop Simulation"
        >
          <Square className="w-4 h-4 fill-current" />
          <span>Stop</span>
        </button>

        <button
          onClick={reset}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-sm border border-slate-700 transition-all"
          title="Reset Maze and Robot to Start"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Reset</span>
        </button>
      </div>

      {/* Speed & Strategy Selectors */}
      <div className="flex items-center gap-3">
        {/* Speed */}
        <div className="flex items-center gap-1.5 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800 text-xs">
          <FastForward className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-slate-400 font-medium">Speed:</span>
          {(["SLOW", "NORMAL", "FAST", "MAX"] as SimulationSpeed[]).map((sp) => (
            <button
              key={sp}
              onClick={() => setSpeed(sp)}
              className={`px-2 py-0.5 rounded font-mono text-[11px] font-semibold transition-colors ${
                currentSpeed === sp
                  ? "bg-cyan-600 text-white"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {sp}
            </button>
          ))}
        </div>

        {/* Strategy */}
        <select
          value={currentStrategy}
          onChange={(e) => setStrategy(e.target.value as ExplorationStrategy)}
          className="bg-slate-950 border border-slate-800 text-slate-300 rounded-lg px-2.5 py-1 text-xs font-medium focus:outline-none focus:border-cyan-500"
        >
          <option value="SYSTEMATIC">Systematic + Backtracking</option>
          <option value="WALL_FOLLOWER_LEFT">Wall Follower (Left-Hand)</option>
          <option value="WALL_FOLLOWER_RIGHT">Wall Follower (Right-Hand)</option>
        </select>

        {/* Ground Truth Debug Toggle */}
        {showGroundTruthToggle && (
          <button
            onClick={() => setDebugMode(!debugMode)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
              debugMode
                ? "bg-amber-950/60 border-amber-800 text-amber-300"
                : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
            }`}
            title="Ground truth reveals physical walls in UI. The exploration algorithm strictly uses only discovered walls."
          >
            {debugMode ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>Ground Truth</span>
          </button>
        )}
      </div>
    </div>
  );
};

