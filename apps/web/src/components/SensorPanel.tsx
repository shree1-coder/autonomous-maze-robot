import React from "react";
import { RobotSensors, SensorReading } from "@maze/shared";
import { AlertCircle, CheckCircle2, Radio } from "lucide-react";

interface SensorPanelProps {
  sensors?: RobotSensors;
}

export const SensorPanel: React.FC<SensorPanelProps> = ({ sensors }) => {
  const renderSensor = (name: string, reading?: SensorReading, pinLabel?: string) => {
    const isBlocked = reading?.state === "BLOCKED";
    const isStale = reading?.stale ?? true;

    return (
      <div
        className={`p-3 rounded-lg border transition-all ${
          isBlocked
            ? "bg-rose-950/40 border-rose-800/80 text-rose-200"
            : "bg-emerald-950/30 border-emerald-800/80 text-emerald-200"
        }`}
      >
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider">
            <Radio className={`w-3.5 h-3.5 ${isBlocked ? "text-rose-400" : "text-emerald-400"}`} />
            <span>{name}</span>
          </div>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
            {pinLabel}
          </span>
        </div>

        <div className="flex items-baseline justify-between mt-2">
          <div className="flex items-center gap-1">
            {isBlocked ? (
              <AlertCircle className="w-4 h-4 text-rose-400" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            )}
            <span className="text-sm font-semibold tracking-wide">
              {reading?.state || "UNKNOWN"}
            </span>
          </div>

          <div className="text-right">
            <div className="text-[11px] font-mono text-slate-400">
              RAW: <span className="text-slate-100 font-bold">{reading?.raw ?? "--"}</span>
            </div>
          </div>
        </div>

        <div className="mt-2 pt-1.5 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-400">
          <span>{isStale ? "Stale" : "Active"}</span>
          <span>{reading?.timestamp ? new Date(reading.timestamp).toLocaleTimeString() : "--"}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg">
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
        <h3 className="text-sm font-bold tracking-wide uppercase text-slate-200 flex items-center gap-2">
          <Radio className="w-4 h-4 text-cyan-400" />
          Digital IR Obstacle Sensors
        </h3>
        <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-400 border border-slate-700">
          ACTIVE-LOW
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {renderSensor("Left IR", sensors?.left, "GPIO 34")}
        {renderSensor("Front IR", sensors?.front, "GPIO 35")}
        {renderSensor("Right IR", sensors?.right, "GPIO 36")}
      </div>

      <div className="mt-2.5 text-[10px] text-slate-500 italic">
        * Digital threshold sensors only (HIGH/LOW). Does not measure physical centimeter distance.
      </div>
    </div>
  );
};

