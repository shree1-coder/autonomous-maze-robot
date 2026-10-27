import React, { useState } from "react";
import { useSimulation } from "../hooks/useSimulation.js";
import { Check, Settings, ShieldCheck, Sliders } from "lucide-react";
import { ExplorationStrategy, SimulationSpeed } from "@maze/shared";

export const SettingsPage: React.FC = () => {
  const { state, setSpeed, setStrategy, debugMode, setDebugMode } = useSimulation();

  const [savedNotice, setSavedNotice] = useState<boolean>(false);
  const [selectedSpeed, setSelectedSpeed] = useState<SimulationSpeed>("NORMAL");
  const [selectedStrategy, setSelectedStrategy] = useState<ExplorationStrategy>("SYSTEMATIC");
  const [polarity, setPolarity] = useState<string>("ACTIVE_LOW");

  const handleSave = () => {
    setSpeed(selectedSpeed);
    setStrategy(selectedStrategy);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 flex flex-col gap-6">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Settings className="w-5 h-5 text-cyan-400" />
            System & Simulator Settings
          </h2>
          <p className="text-xs text-slate-400">
            Configure default exploration algorithms, simulation speeds, and hardware polarity flags.
          </p>
        </div>

        {savedNotice && (
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold px-3 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-800 animate-fadeIn">
            <Check className="w-4 h-4" />
            <span>Settings Saved!</span>
          </div>
        )}
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg space-y-6">
        {/* Simulation Speed */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-2">
            Default Simulation Speed
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(["SLOW", "NORMAL", "FAST", "MAX"] as SimulationSpeed[]).map((sp) => (
              <button
                key={sp}
                onClick={() => setSelectedSpeed(sp)}
                className={`py-2 px-3 text-xs font-mono font-bold rounded-lg border transition-all ${
                  selectedSpeed === sp
                    ? "bg-cyan-600 text-white border-cyan-500 shadow-sm"
                    : "bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200"
                }`}
              >
                {sp}
              </button>
            ))}
          </div>
        </div>

        {/* Exploration Strategy */}
        <div className="pt-4 border-t border-slate-800">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-2">
            Default Autonomous Exploration Strategy
          </label>
          <select
            value={selectedStrategy}
            onChange={(e) => setSelectedStrategy(e.target.value as ExplorationStrategy)}
            className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-lg p-2.5 text-xs font-medium focus:outline-none focus:border-cyan-500"
          >
            <option value="SYSTEMATIC">Systematic Frontier Search with Backtracking (Recommended)</option>
            <option value="WALL_FOLLOWER_LEFT">Left-Hand Wall Follower</option>
            <option value="WALL_FOLLOWER_RIGHT">Right-Hand Wall Follower</option>
          </select>
          <p className="text-[11px] text-slate-500 mt-1.5">
            Systematic mode uses graph frontier search to backtrack out of dead ends and explore all reachable passages.
          </p>
        </div>

        {/* Sensor Polarity */}
        <div className="pt-4 border-t border-slate-800">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block mb-2">
            Digital IR Obstacle Sensor Polarity
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setPolarity("ACTIVE_LOW")}
              className={`p-3 text-left rounded-lg border text-xs transition-all ${
                polarity === "ACTIVE_LOW"
                  ? "bg-cyan-950/60 border-cyan-700 text-cyan-200"
                  : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
              }`}
            >
              <div className="font-bold">ACTIVE-LOW (Default)</div>
              <div className="text-[11px] text-slate-400 mt-1">Obstacle present = LOW (0), Clear = HIGH (1)</div>
            </button>

            <button
              onClick={() => setPolarity("ACTIVE_HIGH")}
              className={`p-3 text-left rounded-lg border text-xs transition-all ${
                polarity === "ACTIVE_HIGH"
                  ? "bg-cyan-950/60 border-cyan-700 text-cyan-200"
                  : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
              }`}
            >
              <div className="font-bold">ACTIVE-HIGH</div>
              <div className="text-[11px] text-slate-400 mt-1">Obstacle present = HIGH (1), Clear = LOW (0)</div>
            </button>
          </div>
        </div>

        {/* Developer Debug Ground Truth */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Developer Ground-Truth Overlay
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Renders physical walls visually. Does not affect algorithm information isolation.
            </div>
          </div>
          <button
            onClick={() => setDebugMode(!debugMode)}
            className={`w-12 h-6 rounded-full transition-colors relative border ${
              debugMode ? "bg-cyan-600 border-cyan-500" : "bg-slate-800 border-slate-700"
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-0.5 ${
                debugMode ? "right-1" : "left-1"
              }`}
            />
          </button>
        </div>

        {/* Save Button */}
        <div className="pt-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs rounded-lg shadow-md shadow-cyan-900/30 transition-all"
          >
            Apply & Save Settings
          </button>
        </div>
      </div>
    </div>
  );
};

