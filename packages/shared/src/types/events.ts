import { GroundTruthMaze, MazeConfig, CellPosition } from "./maze.js";
import { MovementAction, RobotMode } from "./robot.js";
import { SimulationState, SimulationStats } from "./simulation.js";
import { HardwareTelemetry } from "./telemetry.js";

export interface ServerToClientEvents {
  "simulation:state": (state: SimulationState) => void;
  "simulation:started": (payload: { timestamp: number }) => void;
  "simulation:paused": (payload: { timestamp: number }) => void;
  "simulation:resumed": (payload: { timestamp: number }) => void;
  "simulation:step": (state: SimulationState) => void;
  "simulation:completed": (payload: { success: boolean; reason: string; stats: SimulationStats }) => void;
  "simulation:reset": (payload: { timestamp: number }) => void;
  "robot:telemetry": (telemetry: HardwareTelemetry) => void;
  "robot:status": (payload: { mode: RobotMode; message: string }) => void;
  "robot:error": (payload: { message: string; code?: string }) => void;
  "maze:updated": (payload: { config: MazeConfig; groundTruth: GroundTruthMaze }) => void;
  "path:updated": (payload: { path: CellPosition[] | null; actions: MovementAction[] | null }) => void;
}

export interface ClientToServerEvents {
  "simulation:start": () => void;
  "simulation:pause": () => void;
  "simulation:resume": () => void;
  "simulation:step": () => void;
  "simulation:reset": () => void;
  "simulation:stop": () => void;
  "simulation:solve": () => void;
  "simulation:followPath": () => void;
}

