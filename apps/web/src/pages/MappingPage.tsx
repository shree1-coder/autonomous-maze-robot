import React, { useState } from "react";
import { useSimulation } from "../hooks/useSimulation.js";
import { MazeGrid } from "../components/MazeGrid.js";
import { Legend } from "../components/Legend.js";
import { Esp32CodeModal } from "../components/Esp32CodeModal.js";
import {
  AlertTriangle,
  CheckCircle2,
  Cpu,
  Navigation,
  Play,
  RotateCcw,
  Route,
  Zap,
} from "lucide-react";

export const MappingPage: React.FC = () => {
  const { state, solve, followPath, reset } = useSimulation();
  const [solveMessage, setSolveMessage] = useState<string | null>(null);
  const [isSolving, setIsSolving] = useState<boolean>(false);
  const [showEsp32Modal, setShowEsp32Modal] = useState<boolean>(false);

  if (!state) return null;

  const handleSolve = async () => {
    setIsSolving(true);
    setSolveMessage(null);
    try {
      const res = await solve();
      setSolveMessage(res.message);
    } catch (err: any) {
      setSolveMessage(err.message || "Pathfinding calculation failed");
    } finally {
      setIsSolving(false);
    }
  };

  const handleExecute = async () => {
    await followPath();
  };

  const pathLength = state.currentPath ? state.currentPath.length - 1 : null;
  const turnsCount = state.plannedActions
    ? state.plannedActions.filter((a) => a === "TURN_LEFT" || a === "TURN_RIGHT").length
    : null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col gap-6">
      {/* Pathfinding Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Route className="w-5 h-5 text-cyan-400" />
            Mapping Knowledge & Breadth-First Search (BFS)
          </h2>
          <p className="text-xs text-slate-400">
            Calculates the shortest traversable path using only the robot's confirmed open passages.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleSolve}
            disabled={isSolving}
            className="flex items-center gap-1.5 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-semibold text-xs rounded-lg shadow-md shadow-cyan-900/30 transition-all"
          >
            <Zap className="w-4 h-4 fill-current" />
            <span>Calculate Shortest Path (BFS)</span>
          </button>

          <button
            onClick={() => setShowEsp32Modal(true)}
            disabled={!state.currentPath || state.currentPath.length === 0}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 disabled:opacity-40 text-white font-bold text-xs rounded-lg shadow-md shadow-orange-900/30 transition-all border border-amber-400"
          >
            <Cpu className="w-4 h-4" />
            <span>Generate ESP32 Code</span>
          </button>

          <button
            onClick={handleExecute}
            disabled={!state.currentPath || state.currentPath.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-semibold text-xs rounded-lg shadow-md shadow-emerald-900/30 transition-all"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Execute Path</span>
          </button>

          <button
            onClick={reset}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-lg border border-slate-700 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Path result banner if present */}
      {solveMessage && (
        <div
          className={`p-3 rounded-lg border text-xs flex items-center gap-2 ${
            state.currentPath
              ? "bg-cyan-950/40 border-cyan-800 text-cyan-300"
              : "bg-amber-950/40 border-amber-800 text-amber-300"
          }`}
        >
          {state.currentPath ? (
            <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          )}
          <span>{solveMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Map Visualization */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl flex flex-col items-center">
            <div className="w-full flex items-center justify-between pb-3 mb-2 border-b border-slate-800 text-xs text-slate-400">
              <span className="font-semibold text-slate-200">
                Discovered Knowledge Graph ({state.mazeConfig.rows} × {state.mazeConfig.cols})
              </span>
              <span className="font-mono text-cyan-400">
                {pathLength !== null ? `Planned Route: ${pathLength} cell moves` : "No Active Route"}
              </span>
            </div>

            <MazeGrid
              config={state.mazeConfig}
              groundTruth={state.groundTruth}
              knowledgeMap={state.knowledgeMap}
              robotPos={state.robot.position}
              robotFacing={state.robot.orientation}
              plannedPath={state.currentPath}
              displayMode="KNOWLEDGE"
            />
          </div>

          <Legend />
        </div>

        {/* Right: Pathfinding & Mapping Analysis */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* Mapping Stats Tile */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">
              Accumulated Knowledge Graph
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-800/80">
                <span className="text-slate-400">Visited Cells:</span>
                <span className="font-mono font-bold text-slate-100">
                  {state.stats.exploredCellsCount} / {state.stats.totalCells} ({state.stats.explorationPercentage}%)
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/80">
                <span className="text-slate-400">Confirmed Walls:</span>
                <span className="font-mono font-bold text-rose-400">{state.stats.knownWallsCount}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/80">
                <span className="text-slate-400">Unobserved Edges:</span>
                <span className="font-mono font-bold text-slate-400">{state.stats.unknownWallsCount}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/80">
                <span className="text-slate-400">Discovered Dead Ends:</span>
                <span className="font-mono font-bold text-amber-400">{state.stats.deadEndsCount}</span>
              </div>
            </div>
          </div>

          {/* Route Details */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">
              Shortest Route Analysis
            </h3>
            {state.currentPath ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Path Length</span>
                    <span className="font-mono font-bold text-emerald-400 text-sm">
                      {pathLength} moves
                    </span>
                  </div>
                  <div className="bg-slate-950 p-2.5 rounded border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Turns Required</span>
                    <span className="font-mono font-bold text-cyan-400 text-sm">
                      {turnsCount} turns
                    </span>
                  </div>
                </div>

                {state.plannedActions && (
                  <div>
                    <span className="text-[11px] text-slate-400 block mb-1">
                      Execution Instruction Stream:
                    </span>
                    <div className="bg-slate-950 p-2.5 rounded border border-slate-800 max-h-40 overflow-y-auto font-mono text-[11px] text-slate-300 space-y-1">
                      {state.plannedActions.map((act, i) => (
                        <div key={i} className="flex justify-between">
                          <span className="text-slate-500">Step {i + 1}:</span>
                          <span className={act === "FORWARD" ? "text-emerald-400" : "text-cyan-400 font-bold"}>
                            {act}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-xs text-slate-500 italic py-4 text-center">
                Click "Calculate Shortest Path" to solve traversable graph using BFS.
              </div>
            )}
          </div>

          <div className="bg-slate-950/60 border border-slate-800 p-3 rounded-xl text-[11px] text-slate-400">
            * Note: BFS computes the optimal path strictly through currently known OPEN edges. If regions remain unexplored, shorter physical shortcuts may exist that the robot has not yet encountered.
          </div>
        </div>
      </div>

      <Esp32CodeModal
        isOpen={showEsp32Modal}
        onClose={() => setShowEsp32Modal(false)}
        path={state.currentPath}
        actions={state.plannedActions}
        config={state.mazeConfig}
      />
    </div>
  );
};

