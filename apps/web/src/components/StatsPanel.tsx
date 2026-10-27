import React from "react";
import { SimulationStats, RobotState } from "@maze/shared";
import { Compass, Flag, MapPin, Navigation, Route, Sparkles } from "lucide-react";

interface StatsPanelProps {
  stats?: SimulationStats;
  robot?: RobotState;
  pathLength?: number | null;
}

export const StatsPanel: React.FC<StatsPanelProps> = ({ stats, robot, pathLength }) => {
  const percentage = stats?.explorationPercentage ?? 0;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg flex flex-col gap-3">
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <h3 className="text-sm font-bold tracking-wide uppercase text-slate-200 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          Exploration Telemetry & Stats
        </h3>
        <span className="text-xs font-mono font-semibold text-cyan-400">
          {percentage}% Mapped
        </span>
      </div>

      {/* Exploration progress bar */}
      <div>
        <div className="flex justify-between text-xs text-slate-400 mb-1">
          <span>Exploration Progress</span>
          <span className="font-mono text-slate-200">
            {stats?.exploredCellsCount ?? 0} / {stats?.totalCells ?? 100} cells
          </span>
        </div>
        <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
          <div
            className="bg-gradient-to-r from-cyan-500 to-emerald-400 h-full transition-all duration-300"
            style={{ width: `${Math.min(100, percentage)}%` }}
          />
        </div>
      </div>

      {/* Metric Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        {/* Robot Position */}
        <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800">
          <div className="text-slate-400 flex items-center gap-1 mb-1">
            <MapPin className="w-3.5 h-3.5 text-cyan-400" />
            <span>Position</span>
          </div>
          <div className="font-mono font-bold text-sm text-slate-100">
            R:{robot?.position.row ?? 0}, C:{robot?.position.col ?? 0}
          </div>
        </div>

        {/* Orientation */}
        <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800">
          <div className="text-slate-400 flex items-center gap-1 mb-1">
            <Compass className="w-3.5 h-3.5 text-cyan-400" />
            <span>Facing</span>
          </div>
          <div className="font-mono font-bold text-sm text-cyan-400">
            {robot?.orientation ?? "NORTH"}
          </div>
        </div>

        {/* Movements */}
        <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800">
          <div className="text-slate-400 flex items-center gap-1 mb-1">
            <Navigation className="w-3.5 h-3.5 text-amber-400" />
            <span>Movements</span>
          </div>
          <div className="font-mono font-bold text-sm text-slate-100">
            {stats?.movements ?? 0}
            <span className="text-[10px] text-slate-500 font-normal ml-1">({stats?.turns ?? 0} turns)</span>
          </div>
        </div>

        {/* Path Length / Goal */}
        <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-800">
          <div className="text-slate-400 flex items-center gap-1 mb-1">
            <Route className="w-3.5 h-3.5 text-emerald-400" />
            <span>Path Moves</span>
          </div>
          <div className="font-mono font-bold text-sm text-slate-100">
            {pathLength !== null && pathLength !== undefined ? (
              <span className="text-emerald-400">{pathLength} moves</span>
            ) : (
              <span className="text-slate-500">Unsolved</span>
            )}
          </div>
        </div>
      </div>

      {/* Wall Stats & Dead Ends */}
      <div className="grid grid-cols-3 gap-2 text-[11px] font-mono bg-slate-950/40 p-2 rounded-lg border border-slate-800">
        <div>
          <span className="text-slate-500">Known Walls: </span>
          <span className="text-rose-400 font-bold">{stats?.knownWallsCount ?? 0}</span>
        </div>
        <div>
          <span className="text-slate-500">Unknown Edges: </span>
          <span className="text-slate-400 font-bold">{stats?.unknownWallsCount ?? 0}</span>
        </div>
        <div>
          <span className="text-slate-500">Dead Ends: </span>
          <span className="text-amber-400 font-bold">{stats?.deadEndsCount ?? 0}</span>
        </div>
      </div>

      {/* Status message */}
      {robot?.statusMessage && (
        <div className="text-xs text-slate-300 bg-slate-950/80 px-3 py-1.5 rounded border border-slate-800 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
          <span>{robot.statusMessage}</span>
        </div>
      )}
    </div>
  );
};

