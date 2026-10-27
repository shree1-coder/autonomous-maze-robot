import React, { useState, useEffect } from "react";
import {
  CellPosition,
  Direction,
  MazeConfig,
  MovementAction,
  generateEsp32Firmware,
} from "@maze/shared";
import {
  Check,
  Code2,
  Copy,
  Cpu,
  Download,
  HelpCircle,
  Play,
  Sliders,
  X,
  Zap,
} from "lucide-react";

interface Esp32CodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  path: CellPosition[] | null;
  actions: MovementAction[] | null;
  config: MazeConfig;
}

export const Esp32CodeModal: React.FC<Esp32CodeModalProps> = ({
  isOpen,
  onClose,
  path,
  actions,
  config,
}) => {
  const [forwardMs, setForwardMs] = useState<number>(600);
  const [turnMs, setTurnMs] = useState<number>(380);
  const [settleMs, setSettleMs] = useState<number>(200);
  const [speedPwm, setSpeedPwm] = useState<number>(200);
  const [useIrSafety, setUseIrSafety] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"code" | "guide">("code");

  if (!isOpen) return null;

  const validPath = path && path.length > 0;
  const validActions = actions && actions.length > 0;

  const generatedCode = validPath && validActions
    ? generateEsp32Firmware(path, actions, config, {
        forwardMs,
        turnMs,
        settleMs,
        speedPwm,
        useIrSafety,
        robotName: "Autonomous Physical Maze Rover",
      })
    : "// No path currently calculated. Please solve the maze first.";

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([generatedCode], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `maze_solver_esp32_${config.rows}x${config.cols}.ino`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
                Generate ESP32 Physical Robot Code
              </h2>
              <p className="text-xs text-slate-400">
                Exports the calculated maze solution directly into upload-ready C++ firmware for your physical ESP32.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Path Quick Metrics Bar */}
        <div className="px-6 py-2.5 bg-slate-950 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-4 text-slate-300">
            <span>
              Start: <span className="text-emerald-400 font-bold">({config.start.row}, {config.start.col})</span>
            </span>
            <span>
              Goal: <span className="text-amber-400 font-bold">({config.goal.row}, {config.goal.col})</span>
            </span>
            <span>
              Moves: <span className="text-cyan-400 font-bold">{path ? path.length - 1 : 0} cells</span>
            </span>
            <span>
              Actions: <span className="text-indigo-400 font-bold">{actions ? actions.length : 0} steps</span>
            </span>
          </div>

          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setActiveTab("code")}
              className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                activeTab === "code"
                  ? "bg-cyan-600 text-white font-semibold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              C++ Code (.ino)
            </button>
            <button
              onClick={() => setActiveTab("guide")}
              className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                activeTab === "guide"
                  ? "bg-cyan-600 text-white font-semibold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Flashing Instructions
            </button>
          </div>
        </div>

        {/* Main Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {/* Calibration Tuning Controls */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-amber-400" />
                Physical Robot Calibration Parameters
              </span>
              <span className="text-[11px] text-slate-500 font-mono">
                Adjusts timing delays for TT geared motors
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">
                  Cell Forward (ms)
                </label>
                <input
                  type="number"
                  min={100}
                  max={3000}
                  step={20}
                  value={forwardMs}
                  onChange={(e) => setForwardMs(parseInt(e.target.value, 10) || 600)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-cyan-400 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">
                  90° Turn Time (ms)
                </label>
                <input
                  type="number"
                  min={100}
                  max={2000}
                  step={10}
                  value={turnMs}
                  onChange={(e) => setTurnMs(parseInt(e.target.value, 10) || 380)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-cyan-400 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">
                  Motor PWM (0-255)
                </label>
                <input
                  type="number"
                  min={80}
                  max={255}
                  value={speedPwm}
                  onChange={(e) => setSpeedPwm(parseInt(e.target.value, 10) || 200)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-cyan-400 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">
                  Settle Inertia (ms)
                </label>
                <input
                  type="number"
                  min={50}
                  max={1000}
                  step={20}
                  value={settleMs}
                  onChange={(e) => setSettleMs(parseInt(e.target.value, 10) || 200)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-mono text-cyan-400 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="mt-3 flex items-center gap-2">
              <input
                type="checkbox"
                id="irSafetyCheck"
                checked={useIrSafety}
                onChange={(e) => setUseIrSafety(e.target.checked)}
                className="rounded border-slate-800 bg-slate-900 text-cyan-600 focus:ring-0"
              />
              <label htmlFor="irSafetyCheck" className="text-xs text-slate-300 cursor-pointer">
                Enable Front IR Obstacle Safety Failsafe (stops and aborts the planned route if an obstacle is detected)
              </label>
            </div>
          </div>

          {activeTab === "code" ? (
            /* Code View */
            <div className="relative">
              <div className="flex items-center justify-between px-3 py-2 bg-slate-950 rounded-t-xl border border-b-0 border-slate-800 text-xs text-slate-400">
                <span className="font-mono text-[11px]">maze_solver_esp32.ino (Ready for Arduino IDE)</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-semibold text-[11px] border border-slate-700 transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? "Copied!" : "Copy Code"}</span>
                  </button>
                  <button
                    onClick={handleDownload}
                    className="flex items-center gap-1.5 px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded font-semibold text-[11px] shadow-sm transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download .ino</span>
                  </button>
                </div>
              </div>

              <pre className="bg-slate-950 border border-slate-800 rounded-b-xl p-4 text-xs font-mono text-cyan-200/90 overflow-x-auto max-h-[380px] selection:bg-cyan-900 leading-relaxed">
                <code>{generatedCode}</code>
              </pre>
            </div>
          ) : (
            /* Flashing Guide */
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-5 space-y-4 text-xs">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-cyan-400" />
                How to Flash the Generated Code to your ESP32
              </h3>

              <ol className="list-decimal list-inside space-y-3 text-slate-300 leading-relaxed">
                <li>
                  <strong className="text-white">Download or Copy:</strong> Click{" "}
                  <span className="text-cyan-400 font-bold">Download .ino</span> above or copy the code.
                </li>
                <li>
                  <strong className="text-white">Open in Arduino IDE:</strong> Open the Arduino IDE (v2.x recommended). If not already installed, install the{" "}
                  <code className="text-amber-300 bg-slate-900 px-1 py-0.5 rounded">esp32 by Espressif Systems</code> board package.
                </li>
                <li>
                  <strong className="text-white">Select Board & Port:</strong> Under{" "}
                  <span className="text-slate-200 italic">Tools &gt; Board</span>, choose{" "}
                  <span className="text-cyan-400 font-semibold">ESP32 Dev Module</span> (or your specific DevKit model). Select the corresponding USB serial port.
                </li>
                <li>
                  <strong className="text-white">Upload Firmware:</strong> Click the{" "}
                  <span className="text-emerald-400 font-semibold">Upload (→)</span> button. Wait until it shows{" "}
                  <code className="text-emerald-400 bg-slate-900 px-1 py-0.5 rounded">Done uploading</code>.
                </li>
                <li>
                  <strong className="text-white">Place the Robot in the Maze:</strong> Disconnect the USB cable. Set the robot onto your physical arena exactly at Start cell:{" "}
                  <span className="text-emerald-400 font-bold">({config.start.row}, {config.start.col})</span> facing{" "}
                  <span className="text-cyan-400 font-bold">{config.initialDirection}</span>.
                </li>
                <li>
                  <strong className="text-white">Power On:</strong> Turn on your 2-cell 18650 battery switch. The onboard LED will blink for a 5-second countdown, after which the robot will autonomously follow the exact path to the goal!
                </li>
              </ol>

              <div className="p-3 bg-amber-950/30 border border-amber-800/60 rounded-lg text-amber-200 text-[11px]">
                <strong>Calibration Tip:</strong> Because yellow TT DC motors are open-loop (no encoders), if your robot slightly under-rotates on a 90° turn, increase <code className="font-bold">TURN_90_DEG_MS</code> by +20 ms. If it moves too far forward across a cell boundary, reduce <code className="font-bold">MOVE_FORWARD_MS</code> by -30 ms.
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between text-xs">
          <div className="text-slate-400">
            Pin mapping: Left IR: <span className="text-slate-200">34</span>, Front IR: <span className="text-slate-200">35</span>, Right IR: <span className="text-slate-200">36</span>, Motors: <span className="text-slate-200">25/26/27 & 14/18/19</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-lg transition-colors"
            >
              Close
            </button>
            <button
              onClick={handleDownload}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold rounded-lg shadow-md shadow-orange-900/30 flex items-center gap-1.5 transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Download ESP32 Code (.ino)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

