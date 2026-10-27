import React from "react";
import { Terminal } from "lucide-react";

interface EventLogProps {
  logs?: Array<{ id: string; timestamp: number; message: string; type: "info" | "warn" | "error" | "success" }>;
}

export const EventLog: React.FC<EventLogProps> = ({ logs = [] }) => {
  const badgeClass: Record<string, string> = {
    info: "text-cyan-400 bg-cyan-950/60 border-cyan-800",
    warn: "text-amber-400 bg-amber-950/60 border-amber-800",
    error: "text-rose-400 bg-rose-950/60 border-rose-800",
    success: "text-emerald-400 bg-emerald-950/60 border-emerald-800",
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg flex flex-col h-64">
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
        <h3 className="text-sm font-bold tracking-wide uppercase text-slate-200 flex items-center gap-2">
          <Terminal className="w-4 h-4 text-cyan-400" />
          Event & Execution Log
        </h3>
        <span className="text-[10px] text-slate-500 font-mono">
          {logs.length} entries
        </span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 font-mono text-xs">
        {logs.length === 0 ? (
          <div className="text-slate-600 text-center py-8 italic">No events recorded yet</div>
        ) : (
          logs.map((log) => (
            <div
              key={log.id}
              className="flex items-start gap-2 p-1.5 rounded hover:bg-slate-800/40 transition-colors"
            >
              <span className="text-[10px] text-slate-500 whitespace-nowrap pt-0.5">
                {new Date(log.timestamp).toLocaleTimeString()}
              </span>
              <span
                className={`text-[9px] uppercase font-bold px-1.5 py-0.2 rounded border whitespace-nowrap ${
                  badgeClass[log.type] || badgeClass.info
                }`}
              >
                {log.type}
              </span>
              <span className="text-slate-300 break-words flex-1">{log.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

