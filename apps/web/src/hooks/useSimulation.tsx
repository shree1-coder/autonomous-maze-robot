import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import {
  CellPosition,
  ExplorationStrategy,
  HardwareTelemetry,
  MovementAction,
  RunRecord,
  SimulationSpeed,
  SimulationState,
} from "@maze/shared";
import { socket } from "../services/socket.js";
import { api } from "../services/api.js";

type ConnectionStatus = "CONNECTED" | "CONNECTING" | "DISCONNECTED" | "ERROR";

interface SimulationContextValue {
  state: SimulationState | null;
  telemetry: HardwareTelemetry | null;
  connectionStatus: ConnectionStatus;
  history: RunRecord[];
  debugMode: boolean;
  setDebugMode: (val: boolean) => void;
  // Controls
  start: () => void;
  pause: () => void;
  resume: () => void;
  step: () => void;
  stop: () => void;
  reset: () => void;
  solve: () => Promise<{ found: boolean; path: CellPosition[]; actions: MovementAction[]; message: string }>;
  followPath: () => Promise<void>;
  setSpeed: (speed: SimulationSpeed) => Promise<void>;
  setStrategy: (strategy: ExplorationStrategy) => Promise<void>;
  loadPreset: (name: string) => Promise<void>;
  toggleWall: (type: "horizontal" | "vertical", row: number, col: number) => Promise<void>;
  clearWalls: () => Promise<void>;
  updateConfig: (config: any) => Promise<void>;
  importMaze: (data: any) => Promise<void>;
  setMode: (mode: "SIMULATION" | "PHYSICAL") => Promise<void>;
}

const SimulationContext = createContext<SimulationContextValue | null>(null);

export const SimulationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<SimulationState | null>(null);
  const [telemetry, setTelemetry] = useState<HardwareTelemetry | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("CONNECTING");
  const [history, setHistory] = useState<RunRecord[]>([]);
  const [debugMode, setDebugMode] = useState<boolean>(false);
  const [runStartTime, setRunStartTime] = useState<number | null>(null);

  // Initial fetch as fallback in case socket connects slightly after
  useEffect(() => {
    api.getSimulationState()
      .then((st) => setState(st))
      .catch((err) => console.warn("Initial state fetch error:", err));

    api.getTelemetry()
      .then((t) => setTelemetry(t))
      .catch((err) => console.warn("Initial telemetry fetch error:", err));
  }, []);

  useEffect(() => {
    function onConnect() {
      setConnectionStatus("CONNECTED");
    }
    function onDisconnect() {
      setConnectionStatus("DISCONNECTED");
    }
    function onConnectError() {
      setConnectionStatus("ERROR");
    }

    function onSimulationState(newState: SimulationState) {
      setState(newState);
    }

    function onTelemetry(newTelemetry: HardwareTelemetry) {
      setTelemetry(newTelemetry);
    }

    function onCompleted(payload: { success: boolean; reason: string; stats: any }) {
      if (state) {
        const record: RunRecord = {
          id: Math.random().toString(36).substring(2, 9),
          startTime: runStartTime || Date.now() - 5000,
          endTime: Date.now(),
          mazeName: state.mazeConfig.name || "Custom Maze",
          gridSize: `${state.mazeConfig.rows}x${state.mazeConfig.cols}`,
          goalReached: payload.success,
          movements: payload.stats.movements,
          explorationPercentage: payload.stats.explorationPercentage,
          pathLength: state.currentPath ? state.currentPath.length - 1 : null,
          strategy: state.activeStrategy,
          mode: telemetry?.mode || "SIMULATION",
        };
        setHistory((prev) => [record, ...prev]);
      }
    }

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);
    socket.on("simulation:state", onSimulationState);
    socket.on("robot:telemetry", onTelemetry);
    socket.on("simulation:completed", onCompleted);

    if (socket.connected) {
      setConnectionStatus("CONNECTED");
    }

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onConnectError);
      socket.off("simulation:state", onSimulationState);
      socket.off("robot:telemetry", onTelemetry);
      socket.off("simulation:completed", onCompleted);
    };
  }, [state, runStartTime, telemetry]);

  const start = useCallback(() => {
    setRunStartTime(Date.now());
    socket.emit("simulation:start");
  }, []);

  const pause = useCallback(() => {
    socket.emit("simulation:pause");
  }, []);

  const resume = useCallback(() => {
    socket.emit("simulation:resume");
  }, []);

  const step = useCallback(() => {
    socket.emit("simulation:step");
  }, []);

  const stop = useCallback(() => {
    socket.emit("simulation:stop");
  }, []);

  const reset = useCallback(() => {
    setRunStartTime(null);
    socket.emit("simulation:reset");
  }, []);

  const solve = useCallback(async () => {
    const res = await api.solvePath();
    // Refresh state
    const newState = await api.getSimulationState();
    setState(newState);
    return res;
  }, []);

  const followPath = useCallback(async () => {
    await api.executePath();
  }, []);

  const setSpeed = useCallback(async (speed: SimulationSpeed) => {
    await api.updateSimulationConfig({ speed });
  }, []);

  const setStrategy = useCallback(async (strategy: ExplorationStrategy) => {
    await api.updateSimulationConfig({ strategy });
  }, []);

  const loadPreset = useCallback(async (name: string) => {
    await api.loadPreset(name);
    const newState = await api.getSimulationState();
    setState(newState);
  }, []);

  const toggleWall = useCallback(async (type: "horizontal" | "vertical", row: number, col: number) => {
    await api.toggleWall(type, row, col);
    const newState = await api.getSimulationState();
    setState(newState);
  }, []);

  const clearWalls = useCallback(async () => {
    await api.clearMazeWalls();
    const newState = await api.getSimulationState();
    setState(newState);
  }, []);

  const updateConfig = useCallback(async (cfg: any) => {
    await api.updateMazeConfig(cfg);
    const newState = await api.getSimulationState();
    setState(newState);
  }, []);

  const importMaze = useCallback(async (data: any) => {
    await api.importMaze(data);
    const newState = await api.getSimulationState();
    setState(newState);
  }, []);

  const setMode = useCallback(async (mode: "SIMULATION" | "PHYSICAL") => {
    await api.setRobotMode(mode);
    const tel = await api.getTelemetry();
    setTelemetry(tel);
  }, []);

  return (
    <SimulationContext.Provider
      value={{
        state,
        telemetry,
        connectionStatus,
        history,
        debugMode,
        setDebugMode,
        start,
        pause,
        resume,
        step,
        stop,
        reset,
        solve,
        followPath,
        setSpeed,
        setStrategy,
        loadPreset,
        toggleWall,
        clearWalls,
        updateConfig,
        importMaze,
        setMode,
      }}
    >
      {children}
    </SimulationContext.Provider>
  );
};

export function useSimulation(): SimulationContextValue {
  const context = useContext(SimulationContext);
  if (!context) {
    throw new Error("useSimulation must be used within a SimulationProvider");
  }
  return context;
}
