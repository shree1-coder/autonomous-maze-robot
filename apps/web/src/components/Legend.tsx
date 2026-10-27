import React from "react";

export const Legend: React.FC = () => {
  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 text-xs text-slate-300">
      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
        Maze Map Legend
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 flex items-center justify-center text-[8px] font-bold text-white">
            S
          </span>
          <span>Start Cell</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded-full bg-amber-500 flex items-center justify-center text-[8px] font-bold text-black">
            G
          </span>
          <span>Goal Cell</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded bg-cyan-600 border border-cyan-400 flex items-center justify-center text-[8px] text-white">
            ▲
          </span>
          <span>Robot Facing</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded bg-slate-800 border border-slate-700"></span>
          <span>Visited Cell</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded bg-slate-950 border border-slate-800"></span>
          <span>Unexplored Cell</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-1 bg-rose-500 rounded"></span>
          <span>Known Wall</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-0.5 border-t border-dashed border-slate-500"></span>
          <span>Unknown Wall</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-1 bg-cyan-400 rounded"></span>
          <span>Calculated Path</span>
        </div>
      </div>
    </div>
  );
};

