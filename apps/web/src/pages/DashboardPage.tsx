import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useSimulation } from "../hooks/useSimulation.js";
import { MazeGrid } from "../components/MazeGrid.js";
import { ControlBar } from "../components/ControlBar.js";
import { StatsPanel } from "../components/StatsPanel.js";
import { SensorPanel } from "../components/SensorPanel.js";
import { MotorPanel } from "../components/MotorPanel.js";
import { EventLog } from "../components/EventLog.js";
import { Legend } from "../components/Legend.js";
import { Esp32CodeModal } from "../components/Esp32CodeModal.js";
import { Cpu, Edit3, Sparkles } from "lucide-react";

export const DashboardPage: React.FC = () => {
  const { state, telemetry, debugMode } = useSimulation();
  const [showEsp32Modal, setShowEsp32Modal] = useState<boolean>(false);

  if (!state) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 font-mono text-sm">Connecting to simulation engine...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col gap-6">
      {/* Quick Action Workflow Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-600/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-100">
              Autonomous Physical Maze Solver Pipeline
            </h1>
            <p className="text-xs text-slate-400">
              1. Customize Maze Walls → 2. Solve Algorithm → 3. Export to ESP32 Hardware
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/maze-editor"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Customize Maze</span>
          </Link>

          <button
            onClick={() => setShowEsp32Modal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white text-xs font-extrabold rounded-lg shadow-md shadow-orange-900/30 transition-all border border-amber-400"
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Generate ESP32 Code</span>
          </button>
        </div>
      </div>

      {/* Top Controls */}
      <ControlBar />

      {/* Main Content Grid: Maze on Left/Center, Sidebars on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Maze + Legend */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl flex flex-col items-center">
            <div className="w-full flex items-center justify-between pb-3 mb-2 border-b border-slate-800 text-xs text-slate-400">
              <span className="font-semibold text-slate-200">
                {state.mazeConfig.name || "Active Maze Grid"} ({state.mazeConfig.rows} × {state.mazeConfig.cols})
              </span>
              <span className="font-mono">
                View: {debugMode ? "GROUND TRUTH (DEBUG OVERLAY)" : "ROBOT KNOWLEDGE MAP"}
              </span>
            </div>

            <MazeGrid
              config={state.mazeConfig}
              groundTruth={state.groundTruth}
              knowledgeMap={state.knowledgeMap}
              robotPos={state.robot.position}
              robotFacing={state.robot.orientation}
              plannedPath={state.currentPath}
              displayMode={debugMode ? "GROUND_TRUTH" : "KNOWLEDGE"}
            />
          </div>

          <Legend />
        </div>

        {/* Right: Panels & Telemetry */}
        <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-4">
          <StatsPanel
            stats={state.stats}
            robot={state.robot}
            pathLength={state.currentPath ? state.currentPath.length - 1 : null}
          />
          <SensorPanel sensors={state.sensors} />
          <MotorPanel command={telemetry?.motorCommand} />
          <EventLog logs={state.recentLogs} />
        </div>
      </div>

      {/* ESP32 Code Modal */}
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
