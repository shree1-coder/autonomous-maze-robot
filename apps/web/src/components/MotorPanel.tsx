import React from "react";
import { MotorCommand } from "@maze/shared";
import { Gauge, Zap } from "lucide-react";

interface MotorPanelProps {
  command?: MotorCommand;
}

export const MotorPanel: React.FC<MotorPanelProps> = ({ command }) => {
  const leftPwm = command?.leftPwm ?? 0;
  const rightPwm = command?.rightPwm ?? 0;
  const action = command?.action ?? "STOP";

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg">
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
        <h3 className="text-sm font-bold tracking-wide uppercase text-slate-200 flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-400" />
          L298N Dual DC Motor Driver
        </h3>
        <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-amber-400 border border-slate-700">
          PWM COMMAND
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        {/* Left Motor */}
        <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800">
          <div className="text-[11px] font-mono uppercase text-slate-400 flex justify-between">
            <span>Left Motor (M1)</span>
            <span className="text-cyan-400">GPIO 25/26/27</span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xs font-semibold uppercase text-slate-300">
              {command?.leftDirection ?? "STOP"}
            </span>
            <span className="text-sm font-bold font-mono text-cyan-400">
              {leftPwm} <span className="text-[10px] text-slate-500 font-normal">/ 255</span>
            </span>
          </div>
          {/* Progress bar */}
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-cyan-500 h-full transition-all duration-200"
              style={{ width: `${(leftPwm / 255) * 100}%` }}
            />
          </div>
        </div>

        {/* Right Motor */}
        <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800">
          <div className="text-[11px] font-mono uppercase text-slate-400 flex justify-between">
            <span>Right Motor (M2)</span>
            <span className="text-cyan-400">GPIO 14/18/19</span>
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-xs font-semibold uppercase text-slate-300">
              {command?.rightDirection ?? "STOP"}
            </span>
            <span className="text-sm font-bold font-mono text-cyan-400">
              {rightPwm} <span className="text-[10px] text-slate-500 font-normal">/ 255</span>
            </span>
          </div>
          {/* Progress bar */}
          <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-cyan-500 h-full transition-all duration-200"
              style={{ width: `${(rightPwm / 255) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs bg-slate-950/40 px-3 py-2 rounded-lg border border-slate-800/80">
        <span className="text-slate-400">Current Motion Action:</span>
        <span className="font-mono font-bold text-amber-400 px-2 py-0.5 rounded bg-amber-950/40 border border-amber-800/60">
          {action}
        </span>
      </div>

      <div className="mt-2 text-[10px] text-slate-500 italic">
        * Open-loop PWM duty cycle commands. Physical robot does not have wheel encoders or RPM sensors.
      </div>
    </div>
  );
};

