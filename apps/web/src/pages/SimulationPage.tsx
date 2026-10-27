import React from "react";
import { useSimulation } from "../hooks/useSimulation.js";
import { MazeGrid } from "../components/MazeGrid.js";
import { ControlBar } from "../components/ControlBar.js";
import { SensorPanel } from "../components/SensorPanel.js";
import { MotorPanel } from "../components/MotorPanel.js";
import { StatsPanel } from "../components/StatsPanel.js";
import { Legend } from "../components/Legend.js";
import { EventLog } from "../components/EventLog.js";
import { Eye, ShieldCheck, Terminal } from "lucide-react";

export const SimulationPage: React.FC = () => {
  const { state, telemetry, debugMode, setDebugMode } = useSimulation();

  if (!state) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col gap-6">
      {/* Simulation Controls Header */}
      <ControlBar />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Primary Maze View */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl flex flex-col items-center">
            {/* View Mode Banner */}
            <div className="w-full flex items-center justify-between pb-3 mb-2 border-b border-slate-800 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-200">
                  {debugMode ? "Ground Truth Maze (Debug Overlay)" : "Robot Knowledge Map (Operational View)"}
                </span>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                    debugMode
                      ? "bg-amber-950/60 text-amber-400 border-amber-800"
                      : "bg-cyan-950/60 text-cyan-400 border-cyan-800"
                  }`}
                >
                  {debugMode ? "GLOBAL VIEW" : "STRICT SENSOR DISCOVERY"}
                </span>
              </div>

              <button
                onClick={() => setDebugMode(!debugMode)}
                className="text-xs font-mono text-slate-400 hover:text-cyan-400 flex items-center gap-1 transition-colors"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Toggle Ground Truth</span>
              </button>
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

          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3 text-xs text-slate-400 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-200">Information Isolation Guarantee: </span>
              The robot's exploration algorithm never queries or inspects the ground-truth maze. It navigates purely via simulated sensor readings and updates its internal knowledge map cell by cell.
            </div>
          </div>

          <Legend />
        </div>

        {/* Right: Sensors, Telemetry & Stats */}
        <div className="lg:col-span-4 flex flex-col gap-4">
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
    </div>
  );
};

