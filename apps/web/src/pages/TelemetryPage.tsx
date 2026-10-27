import React, { useState } from "react";
import { useSimulation } from "../hooks/useSimulation.js";
import { SensorPanel } from "../components/SensorPanel.js";
import { MotorPanel } from "../components/MotorPanel.js";
import {
  AlertOctagon,
  BatteryCharging,
  Cpu,
  Power,
  Radio,
  ShieldAlert,
  Wifi,
  WifiOff,
  Zap,
} from "lucide-react";
import { api } from "../services/api.js";

export const TelemetryPage: React.FC = () => {
  const { state, telemetry, setMode, stop } = useSimulation();
  const [esp32Host, setEsp32Host] = useState<string>("192.168.4.1");
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [statusNote, setStatusNote] = useState<string | null>(null);

  if (!state) return null;

  const isPhysical = telemetry?.mode === "PHYSICAL";
  const isConnected = telemetry?.connected ?? false;

  const handleToggleMode = async () => {
    setIsConnecting(true);
    setStatusNote(null);
    try {
      if (isPhysical) {
        await setMode("SIMULATION");
        setStatusNote("Switched to Simulation Mode.");
      } else {
        await setMode("PHYSICAL");
        setStatusNote(`Connecting to ESP32 at ${esp32Host}...`);
      }
    } catch (err: any) {
      setStatusNote(`Mode toggle error: ${err.message}`);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleManualAction = async (action: any) => {
    try {
      await api.sendRobotCommand(action);
    } catch (err: any) {
      setStatusNote(`Manual command error: ${err.message}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col gap-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-cyan-400" />
            Robot Telemetry & Hardware Interface
          </h2>
          <p className="text-xs text-slate-400">
            Real-time digital obstacle telemetry, L298N motor driver PWM commands, and ESP32 hardware bridge.
          </p>
        </div>

        {/* Emergency Stop */}
        <button
          onClick={stop}
          className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm uppercase px-4 py-2 rounded-lg shadow-lg shadow-rose-900/30 transition-all border border-rose-500"
        >
          <ShieldAlert className="w-5 h-5" />
          <span>Emergency Stop</span>
        </button>
      </div>

      {statusNote && (
        <div className="p-3 rounded-lg border bg-slate-900 border-cyan-800 text-cyan-300 text-xs font-mono">
          {statusNote}
        </div>
      )}

      {/* Hardware Connection Config Box */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <Radio className={`w-5 h-5 ${isPhysical ? "text-amber-400" : "text-cyan-400"}`} />
            <div>
              <h3 className="text-sm font-bold text-slate-200">
                Operating Mode: {isPhysical ? "Physical Hardware (ESP32)" : "Local Simulation Mode"}
              </h3>
              <p className="text-[11px] text-slate-400">
                {isPhysical
                  ? "Forwarding commands to physical ESP32 microcontroller over Wi-Fi bridge."
                  : "Running fully isolated local simulation. Physical motors and GPIOs are inactive."}
              </p>
            </div>
          </div>

          <button
            onClick={handleToggleMode}
            disabled={isConnecting}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all border ${
              isPhysical
                ? "bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700"
                : "bg-amber-600 hover:bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-900/30"
            }`}
          >
            {isPhysical ? "Switch to Simulation" : "Enable Physical Robot"}
          </button>
        </div>

        {isPhysical && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
            <div>
              <label className="text-xs text-slate-400 block mb-1">ESP32 Host / IP Address</label>
              <input
                type="text"
                value={esp32Host}
                onChange={(e) => setEsp32Host(e.target.value)}
                placeholder="192.168.4.1"
                className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-xs font-mono text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="text-xs font-mono">
              <span className="text-slate-400 block mb-1">Hardware Status:</span>
              <span className={`flex items-center gap-1.5 font-bold ${isConnected ? "text-emerald-400" : "text-amber-400"}`}>
                {isConnected ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
                {isConnected ? "CONNECTED" : "DISCONNECTED / AWAITING ESP32"}
              </span>
            </div>

            <div className="text-xs font-mono">
              <span className="text-slate-400 block mb-1">Battery Voltage:</span>
              <span className="text-slate-400">
                {telemetry?.batteryVoltage !== null ? `${telemetry?.batteryVoltage} V` : "Not Available (Uninstrumented)"}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Sensor & Motor Telemetry Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SensorPanel sensors={state.sensors} />
        <MotorPanel command={telemetry?.motorCommand} />
      </div>

      {/* Manual Jogging / Calibration Controller */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <Zap className="w-4 h-4 text-cyan-400" />
            Manual Robot Actuation & Jog Controls
          </h3>
          <span className="text-[10px] font-mono text-slate-500">
            For bench testing & sensor calibration
          </span>
        </div>

        <div className="flex flex-col items-center gap-2 max-w-xs mx-auto">
          <button
            onClick={() => handleManualAction("FORWARD")}
            className="w-28 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg border border-slate-700 transition-colors"
          >
            FORWARD
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => handleManualAction("TURN_LEFT")}
              className="w-28 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg border border-slate-700 transition-colors"
            >
              TURN LEFT
            </button>
            <button
              onClick={() => handleManualAction("STOP")}
              className="w-28 py-2 bg-rose-950/80 hover:bg-rose-900 text-rose-300 text-xs font-bold rounded-lg border border-rose-800 transition-colors"
            >
              STOP
            </button>
            <button
              onClick={() => handleManualAction("TURN_RIGHT")}
              className="w-28 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg border border-slate-700 transition-colors"
            >
              TURN RIGHT
            </button>
          </div>
          <button
            onClick={() => handleManualAction("REVERSE")}
            className="w-28 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg border border-slate-700 transition-colors"
          >
            REVERSE
          </button>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-500">
          * Actuation commands send discrete timed PWM pulses to the motors. Due to open-loop DC motor physics, individual surface friction and battery levels will create slight drift on physical ground without encoder closed-loop correction.
        </div>
      </div>
    </div>
  );
};

