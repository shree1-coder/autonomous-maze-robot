import React from "react";
import { useSimulation } from "../hooks/useSimulation.js";
import { CheckCircle2, Download, History, XCircle } from "lucide-react";

export const HistoryPage: React.FC = () => {
  const { history } = useSimulation();

  const handleExportHistory = () => {
    const jsonStr = JSON.stringify(history, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `simulation-history-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col gap-6">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <History className="w-5 h-5 text-cyan-400" />
            Simulation & Exploration Run History
          </h2>
          <p className="text-xs text-slate-400">
            Audit log of autonomous runs, completion status, movements, and path performance.
          </p>
        </div>

        {history.length > 0 && (
          <button
            onClick={handleExportHistory}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export History JSON</span>
          </button>
        )}
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-lg overflow-hidden">
        {history.length === 0 ? (
          <div className="py-16 text-center text-slate-500 font-mono text-xs">
            No simulation runs completed during this session yet. Launch an exploration from Dashboard or Simulation!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">Time</th>
                  <th className="px-4 py-3">Maze / Size</th>
                  <th className="px-4 py-3">Strategy</th>
                  <th className="px-4 py-3">Mode</th>
                  <th className="px-4 py-3">Goal Reached</th>
                  <th className="px-4 py-3">Movements</th>
                  <th className="px-4 py-3">Exploration %</th>
                  <th className="px-4 py-3">Path Length</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {history.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 text-slate-400">
                      {new Date(record.startTime).toLocaleTimeString()}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-200">
                      {record.mazeName} ({record.gridSize})
                    </td>
                    <td className="px-4 py-3 text-cyan-400">{record.strategy}</td>
                    <td className="px-4 py-3">
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px]">
                        {record.mode}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {record.goalReached ? (
                        <span className="flex items-center gap-1 text-emerald-400 font-bold">
                          <CheckCircle2 className="w-4 h-4" /> SUCCESS
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-rose-400 font-bold">
                          <XCircle className="w-4 h-4" /> FAILED
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">{record.movements}</td>
                    <td className="px-4 py-3 text-emerald-400 font-bold">
                      {record.explorationPercentage}%
                    </td>
                    <td className="px-4 py-3">
                      {record.pathLength !== null ? (
                        <span className="text-cyan-400 font-bold">{record.pathLength} moves</span>
                      ) : (
                        <span className="text-slate-500">--</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

