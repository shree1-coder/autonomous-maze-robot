import {
  MazeConfig,
  MazeExportFormat,
  SimulationSpeed,
  ExplorationStrategy,
  MovementAction,
} from "@maze/shared";

const API_BASE = "/api";

export async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
    ...options,
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP ${res.status}: ${res.statusText}`);
  }
  return res.json();
}

export const api = {
  // Health
  getHealth: () => fetchJson<{ status: string }>("/health"),

  // Maze
  getMaze: () => fetchJson<{ config: MazeConfig; groundTruth: any }>("/maze"),
  updateMazeConfig: (config: Partial<MazeConfig>) =>
    fetchJson("/maze/config", { method: "POST", body: JSON.stringify(config) }),
  toggleWall: (type: "horizontal" | "vertical", row: number, col: number) =>
    fetchJson("/maze/toggle-wall", { method: "POST", body: JSON.stringify({ type, row, col }) }),
  clearMazeWalls: () => fetchJson("/maze/clear", { method: "POST" }),
  exportMaze: () => fetchJson<MazeExportFormat>("/maze/export"),
  importMaze: (data: MazeExportFormat) =>
    fetchJson("/maze/import", { method: "POST", body: JSON.stringify(data) }),
  getPresets: () => fetchJson<{ presets: string[] }>("/maze/presets"),
  loadPreset: (name: string) => fetchJson(`/maze/presets/${name}`, { method: "POST" }),
  getKnowledge: () => fetchJson<{ knowledgeMap: any[][]; stats: any }>("/maze/knowledge"),

  // Simulation
  getSimulationState: () => fetchJson<any>("/simulation/state"),
  startSimulation: () => fetchJson("/simulation/start", { method: "POST" }),
  pauseSimulation: () => fetchJson("/simulation/pause", { method: "POST" }),
  resumeSimulation: () => fetchJson("/simulation/resume", { method: "POST" }),
  stepSimulation: () => fetchJson("/simulation/step", { method: "POST" }),
  stopSimulation: () => fetchJson("/simulation/stop", { method: "POST" }),
  resetSimulation: () => fetchJson("/simulation/reset", { method: "POST" }),
  updateSimulationConfig: (config: {
    speed?: SimulationSpeed;
    stepDelayMs?: number;
    strategy?: ExplorationStrategy;
  }) => fetchJson("/simulation/config", { method: "POST", body: JSON.stringify(config) }),

  // Pathfinding
  solvePath: () => fetchJson<{ found: boolean; path: any[]; actions: MovementAction[]; message: string }>("/pathfinding/solve", { method: "POST" }),
  executePath: () => fetchJson("/pathfinding/execute", { method: "POST" }),

  // Robot & Telemetry
  getTelemetry: () => fetchJson<any>("/robot/telemetry"),
  sendRobotCommand: (action: MovementAction) =>
    fetchJson("/robot/command", { method: "POST", body: JSON.stringify({ action }) }),
  setRobotMode: (mode: "SIMULATION" | "PHYSICAL") =>
    fetchJson("/robot/mode", { method: "POST", body: JSON.stringify({ mode }) }),
  emergencyStop: () => fetchJson("/robot/stop", { method: "POST" }),
  generateFirmware: (options?: any) =>
    fetchJson<{
      success: boolean;
      code: string;
      pathLength: number;
      actionCount: number;
      actions: MovementAction[];
      config: any;
    }>("/robot/generate-firmware", { method: "POST", body: JSON.stringify(options || {}) }),
};

