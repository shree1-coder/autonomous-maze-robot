import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Compass,
  Cpu,
  Edit3,
  History,
  LayoutDashboard,
  Map,
  PlayCircle,
  Settings,
  ShieldAlert,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useSimulation } from "../hooks/useSimulation.js";
import { Esp32CodeModal } from "./Esp32CodeModal.js";

export const Navbar: React.FC = () => {
  const location = useLocation();
  const { state, telemetry, connectionStatus, stop } = useSimulation();
  const [showCodeModal, setShowCodeModal] = useState<boolean>(false);

  const navLinks = [
    { to: "/", label: "Dashboard", icon: LayoutDashboard },
    { to: "/maze-editor", label: "Maze Editor", icon: Edit3 },
    { to: "/simulation", label: "Simulation", icon: PlayCircle },
    { to: "/mapping", label: "Mapping & BFS", icon: Map },
    { to: "/telemetry", label: "Telemetry", icon: Cpu },
    { to: "/history", label: "History", icon: History },
    { to: "/settings", label: "Settings", icon: Settings },
  ];

  const modeBadgeColor: Record<string, string> = {
    IDLE: "bg-slate-700 text-slate-200 border-slate-600",
    EXPLORING: "bg-cyan-950 text-cyan-400 border-cyan-800 animate-pulse",
    PAUSED: "bg-amber-950 text-amber-400 border-amber-800",
    SOLVING: "bg-indigo-950 text-indigo-400 border-indigo-800 animate-pulse",
    FOLLOWING_PATH: "bg-blue-950 text-blue-400 border-blue-800 animate-pulse",
    GOAL_REACHED: "bg-emerald-950 text-emerald-400 border-emerald-700",
    FAULT: "bg-rose-950 text-rose-400 border-rose-800",
  };

  const currentMode = state?.robot.mode || "IDLE";

  return (
    <>
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Brand */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
                <Compass className="w-5 h-5 animate-spin-slow" />
              </div>
              <div>
                <span className="font-bold text-slate-100 tracking-tight text-lg">
                  ROBOMAP
                </span>
                <span className="ml-2 text-xs uppercase px-1.5 py-0.5 rounded font-mono bg-cyan-950 text-cyan-400 border border-cyan-800">
                  ESP32
                </span>
              </div>
            </div>

            {/* Navigation Links */}
            <nav className="hidden md:flex items-center space-x-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = location.pathname === link.to;
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-slate-800 text-cyan-400 border border-slate-700 shadow-sm"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            {/* Status & Quick Action Buttons */}
            <div className="flex items-center gap-2.5">
              {/* ESP32 Physical Code Button */}
              <button
                onClick={() => setShowCodeModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold text-xs uppercase rounded-lg shadow-md shadow-orange-900/30 transition-all border border-amber-400"
                title="Generate physical C++ firmware code for ESP32"
              >
                <Cpu className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">ESP32 Code</span>
              </button>

              {/* Robot Mode Badge */}
              <div
                className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-medium border ${
                  modeBadgeColor[currentMode] || "bg-slate-800 text-slate-300 border-slate-700"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-current"></span>
                {currentMode}
              </div>

              {/* Connection Status Pill */}
              <div className="flex items-center gap-1.5 text-xs font-mono">
                {connectionStatus === "CONNECTED" ? (
                  <span className="flex items-center gap-1 text-emerald-400">
                    <Wifi className="w-3.5 h-3.5" />
                    <span className="hidden xl:inline">ONLINE</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-rose-400">
                    <WifiOff className="w-3.5 h-3.5" />
                    <span className="hidden xl:inline">{connectionStatus}</span>
                  </span>
                )}
              </div>

              {/* Emergency STOP */}
              <button
                onClick={stop}
                className="flex items-center gap-1 bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white font-bold text-xs uppercase px-3 py-1.5 rounded-md shadow-md shadow-rose-900/30 transition-all border border-rose-500"
                title="Immediate Emergency Stop"
              >
                <ShieldAlert className="w-4 h-4" />
                <span>STOP</span>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Nav row */}
        <div className="md:hidden flex overflow-x-auto px-4 py-2 border-t border-slate-800 bg-slate-900/95 gap-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs whitespace-nowrap font-medium ${
                  isActive
                    ? "bg-slate-800 text-cyan-400 border border-slate-700"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {link.label}
              </Link>
            );
          })}
        </div>
      </header>

      {/* Global ESP32 Code Modal */}
      {state && (
        <Esp32CodeModal
          isOpen={showCodeModal}
          onClose={() => setShowCodeModal(false)}
          path={state.currentPath}
          actions={state.plannedActions}
          config={state.mazeConfig}
        />
      )}
    </>
  );
};
