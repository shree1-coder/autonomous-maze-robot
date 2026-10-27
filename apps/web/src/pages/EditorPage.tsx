import React, { useState } from "react";
import { useSimulation } from "../hooks/useSimulation.js";
import { MazeGrid } from "../components/MazeGrid.js";
import {
  CellPosition,
  Direction,
  MazeExportSchema,
  MovementAction,
  solveGroundTruthBfs,
} from "@maze/shared";
import {
  AlertCircle,
  CheckCircle2,
  Cpu,
  Download,
  FolderOpen,
  Navigation,
  Play,
  RotateCcw,
  Sliders,
  Sparkles,
  Trash2,
  Upload,
  Zap,
} from "lucide-react";
import { Esp32CodeModal } from "../components/Esp32CodeModal.js";

export const EditorPage: React.FC = () => {
  const {
    state,
    toggleWall,
    clearWalls,
    updateConfig,
    loadPreset,
    importMaze,
  } = useSimulation();

  const [selectedCell, setSelectedCell] = useState<CellPosition | null>(null);
  const [rowsInput, setRowsInput] = useState<number>(state?.mazeConfig.rows || 10);
  const [colsInput, setColsInput] = useState<number>(state?.mazeConfig.cols || 10);
  const [importText, setImportText] = useState<string>("");
  const [importError, setImportError] = useState<string | null>(null);
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [showEsp32Modal, setShowEsp32Modal] = useState<boolean>(false);

  // Local state for solved route on this customized maze
  const [solvedPath, setSolvedPath] = useState<CellPosition[] | null>(null);
  const [solvedActions, setSolvedActions] = useState<MovementAction[] | null>(null);
  const [solveStatus, setSolveStatus] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  if (!state) return null;

  const handleApplyDimensions = () => {
    updateConfig({ rows: rowsInput, cols: colsInput });
    setSolvedPath(null);
    setSolvedActions(null);
    setSolveStatus(null);
  };

  const handleSetStart = () => {
    if (!selectedCell) return;
    updateConfig({ start: selectedCell });
    setSolvedPath(null);
    setSolvedActions(null);
  };

  const handleSetGoal = () => {
    if (!selectedCell) return;
    updateConfig({ goal: selectedCell });
    setSolvedPath(null);
    setSolvedActions(null);
  };

  const handleSetFacing = (dir: Direction) => {
    updateConfig({ initialDirection: dir });
  };

  const handleToggleWallCustom = (type: "horizontal" | "vertical", r: number, c: number) => {
    toggleWall(type, r, c);
    // Invalidate previous solved path when walls are modified
    setSolvedPath(null);
    setSolvedActions(null);
    setSolveStatus(null);
  };

  const handleSolveAndGenerateEsp32 = () => {
    const result = solveGroundTruthBfs(state.groundTruth);
    if (result.found) {
      setSolvedPath(result.path);
      setSolvedActions(result.actions);
      setSolveStatus({
        success: true,
        message: `Shortest path solved: ${result.cellMoves} moves, ${result.turns} turns! Ready for ESP32.`,
      });
      setShowEsp32Modal(true);
    } else {
      setSolvedPath(null);
      setSolvedActions(null);
      setSolveStatus({
        success: false,
        message: result.unreachableReason || "Goal is unreachable. Please remove a wall to open a passage.",
      });
    }
  };

  const handleExportJson = () => {
    const jsonStr = JSON.stringify(state.groundTruth, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `maze-${state.mazeConfig.rows}x${state.mazeConfig.cols}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportSubmit = () => {
    setImportError(null);
    try {
      const parsed = JSON.parse(importText);
      const validation = MazeExportSchema.safeParse(parsed);
      if (!validation.success) {
        setImportError(
          "Invalid maze schema: " +
            validation.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ")
        );
        return;
      }
      importMaze(parsed);
      setShowImportModal(false);
      setImportText("");
      setSolvedPath(null);
      setSolvedActions(null);
    } catch (err: any) {
      setImportError("JSON parse error: " + (err.message || "Malformed JSON"));
    }
  };

  const presets = [
    { id: "empty", label: "Empty Grid" },
    { id: "corridor", label: "Simple S-Corridor" },
    { id: "dead-end", label: "Dead-End Challenge" },
    { id: "intersections", label: "Intersections" },
    { id: "backtracking", label: "Backtracking" },
    { id: "known-path", label: "Known Shortest Path" },
    { id: "unreachable", label: "Unreachable Goal" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col gap-6">
      {/* Primary Goal Banner: Customize -> Solve -> Generate ESP32 Code */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-cyan-800/60 rounded-2xl p-5 shadow-2xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400 px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-800">
              CORE WORKFLOW
            </span>
            <span className="text-xs text-slate-400">Design Maze → BFS Solve → Upload to Robot</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            Customize Maze & Generate ESP32 Robot Code
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
            Click internal grid lines below to add or remove physical walls. Click any cell to place Start and Goal. When satisfied, click <strong>Solve & Generate ESP32 Code</strong> to create upload-ready C++ firmware for your physical robot!
          </p>
        </div>

        {/* Primary CTA Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleSolveAndGenerateEsp32}
            className="px-5 py-3 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-500 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-orange-900/40 flex items-center gap-2.5 transition-all transform hover:scale-105 active:scale-95 border border-amber-400"
          >
            <Cpu className="w-5 h-5 animate-pulse" />
            <span>Solve & Generate ESP32 Code</span>
          </button>
        </div>
      </div>

      {/* Solver Status Banner */}
      {solveStatus && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 text-xs font-semibold ${
            solveStatus.success
              ? "bg-emerald-950/50 border-emerald-800 text-emerald-200"
              : "bg-rose-950/50 border-rose-800 text-rose-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {solveStatus.success ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            )}
            <span>{solveStatus.message}</span>
          </div>

          {solveStatus.success && (
            <button
              onClick={() => setShowEsp32Modal(true)}
              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-sm"
            >
              View ESP32 Code
            </button>
          )}
        </div>
      )}

      {/* Main Work Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Custom Canvas */}
        <div className="lg:col-span-8 flex flex-col items-center bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl">
          <div className="w-full flex items-center justify-between pb-3 mb-2 border-b border-slate-800 text-xs">
            <span className="font-semibold text-slate-200">
              Interactive Grid Canvas ({state.mazeConfig.rows} × {state.mazeConfig.cols})
            </span>
            <span className="font-mono text-cyan-400">
              {selectedCell
                ? `Selected: (${selectedCell.row}, ${selectedCell.col})`
                : "Click edge to toggle wall • Click cell to select"}
            </span>
          </div>

          <MazeGrid
            config={state.mazeConfig}
            groundTruth={state.groundTruth}
            plannedPath={solvedPath}
            displayMode="GROUND_TRUTH"
            editable={true}
            onToggleWall={handleToggleWallCustom}
            onSelectCell={(pos) => setSelectedCell(pos)}
            selectedCell={selectedCell}
            robotPos={state.mazeConfig.start}
            robotFacing={state.mazeConfig.initialDirection}
          />

          <div className="w-full mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-emerald-500"></span> Start Cell
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-amber-500"></span> Goal Cell
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-4 h-1 bg-rose-500"></span> Physical Wall
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-4 h-1 bg-cyan-400"></span> Solved Path
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={clearWalls}
                className="px-2.5 py-1 text-[11px] font-semibold text-rose-400 hover:text-rose-300 rounded border border-rose-900/60 hover:bg-rose-950/40"
              >
                Clear All Walls
              </button>
            </div>
          </div>
        </div>

        {/* Right: Controls, Dimensions & Presets */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          {/* Quick Solve Card */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-xl p-4 shadow-lg">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-2 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-400" />
              Autonomous Path Solver
            </h3>
            <p className="text-xs text-slate-400 mb-3">
              Calculates the shortest route across your custom walls using BFS.
            </p>
            <button
              onClick={handleSolveAndGenerateEsp32}
              className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-lg shadow-md transition-all flex items-center justify-center gap-2"
            >
              <Cpu className="w-4 h-4" />
              <span>Solve Maze & Generate ESP32 Code</span>
            </button>
          </div>

          {/* Cell Configuration */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
              Cell Assignment
            </h3>
            <p className="text-xs text-slate-400 mb-3">
              Selected:{" "}
              <span className="font-mono text-cyan-400 font-bold">
                {selectedCell ? `(${selectedCell.row}, ${selectedCell.col})` : "Click any cell on the grid"}
              </span>
            </p>
            <div className="grid grid-cols-2 gap-2 mb-3">
              <button
                disabled={!selectedCell}
                onClick={handleSetStart}
                className="py-1.5 px-3 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 disabled:opacity-40 rounded-lg text-xs font-semibold"
              >
                Set as Start
              </button>
              <button
                disabled={!selectedCell}
                onClick={handleSetGoal}
                className="py-1.5 px-3 bg-amber-950/80 hover:bg-amber-900 text-amber-300 border border-amber-800 disabled:opacity-40 rounded-lg text-xs font-semibold"
              >
                Set as Goal
              </button>
            </div>

            <div className="pt-2 border-t border-slate-800">
              <label className="text-[11px] text-slate-400 block mb-1">Robot Initial Direction</label>
              <div className="grid grid-cols-4 gap-1">
                {(["NORTH", "EAST", "SOUTH", "WEST"] as Direction[]).map((d) => (
                  <button
                    key={d}
                    onClick={() => handleSetFacing(d)}
                    className={`py-1 text-[10px] font-mono font-bold rounded border ${
                      state.mazeConfig.initialDirection === d
                        ? "bg-cyan-600 text-white border-cyan-500"
                        : "bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200"
                    }`}
                  >
                    {d[0]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Grid Dimensions */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2 flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-cyan-400" />
              Grid Dimensions (3 - 30)
            </h3>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Rows</label>
                <input
                  type="number"
                  min={3}
                  max={30}
                  value={rowsInput}
                  onChange={(e) => setRowsInput(parseInt(e.target.value, 10) || 3)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs font-mono text-slate-100"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Columns</label>
                <input
                  type="number"
                  min={3}
                  max={30}
                  value={colsInput}
                  onChange={(e) => setColsInput(parseInt(e.target.value, 10) || 3)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs font-mono text-slate-100"
                />
              </div>
            </div>
            <button
              onClick={handleApplyDimensions}
              className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-lg transition-colors border border-slate-700"
            >
              Resize Grid
            </button>
          </div>

          {/* Preset Mazes & JSON Actions */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2 flex items-center gap-1.5">
              <FolderOpen className="w-4 h-4 text-cyan-400" />
              Load Preset Challenge
            </h3>
            <div className="grid grid-cols-1 gap-1.5 mb-3">
              {presets.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    loadPreset(p.id);
                    setSolvedPath(null);
                    setSolvedActions(null);
                  }}
                  className="text-left px-3 py-1.5 bg-slate-950 hover:bg-slate-800 text-xs text-slate-300 rounded border border-slate-800/80 hover:border-slate-700 transition-colors flex items-center justify-between"
                >
                  <span>{p.label}</span>
                  <span className="text-[10px] text-slate-500 font-mono">Load →</span>
                </button>
              ))}
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setShowImportModal(true)}
                className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-slate-950 hover:bg-slate-800 text-slate-300 text-xs rounded border border-slate-800"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Import JSON</span>
              </button>
              <button
                onClick={handleExportJson}
                className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-slate-950 hover:bg-slate-800 text-slate-300 text-xs rounded border border-slate-800"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export JSON</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ESP32 Code Modal */}
      <Esp32CodeModal
        isOpen={showEsp32Modal}
        onClose={() => setShowEsp32Modal(false)}
        path={solvedPath || state.currentPath}
        actions={solvedActions || state.plannedActions}
        config={state.mazeConfig}
      />

      {/* JSON Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-lg w-full shadow-2xl">
            <h3 className="text-base font-bold text-slate-100 mb-2">Import Maze JSON</h3>
            <p className="text-xs text-slate-400 mb-3">
              Paste the exported JSON data containing rows, cols, start, goal, and wall matrices.
            </p>
            <textarea
              rows={8}
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder='{"version": 1, "config": { ... }, "horizontalWalls": [...], ...}'
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
            />
            {importError && (
              <div className="mt-2 text-xs text-rose-400 bg-rose-950/40 border border-rose-900/60 p-2 rounded">
                {importError}
              </div>
            )}
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setImportError(null);
                }}
                className="px-4 py-1.5 text-xs text-slate-400 hover:text-slate-200 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleImportSubmit}
                className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs rounded transition-colors"
              >
                Import
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
