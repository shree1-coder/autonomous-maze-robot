import { CellKnowledge, CellPosition, GroundTruthMaze, MazeConfig } from "./maze.js";
import { MovementAction, RobotState } from "./robot.js";
import { RobotSensors } from "./telemetry.js";

export type SimulationSpeed = "SLOW" | "NORMAL" | "FAST" | "MAX";

export type ExplorationStrategy =
  | "WALL_FOLLOWER_LEFT"
  | "WALL_FOLLOWER_RIGHT"
  | "SYSTEMATIC";

export type SimulationConfig = {
  speed: SimulationSpeed;
  stepDelayMs: number;
  maxSteps: number;
  strategy: ExplorationStrategy;
};

export type SimulationStats = {
  steps: number;
  movements: number;
  turns: number;
  exploredCellsCount: number;
  totalCells: number;
  explorationPercentage: number;
  knownWallsCount: number;
  unknownWallsCount: number;
  deadEndsCount: number;
  elapsedTimeMs: number;
  goalReached: boolean;
};

export type SimulationState = {
  robot: RobotState;
  mazeConfig: MazeConfig;
  groundTruth: GroundTruthMaze;
  knowledgeMap: CellKnowledge[][];
  sensors: RobotSensors;
  stats: SimulationStats;
  currentPath: CellPosition[] | null;
  plannedActions: MovementAction[] | null;
  isRunning: boolean;
  isPaused: boolean;
  activeStrategy: ExplorationStrategy;
  lastAction?: MovementAction;
  recentLogs: Array<{ id: string; timestamp: number; message: string; type: "info" | "warn" | "error" | "success" }>;
};

export type RunRecord = {
  id: string;
  startTime: number;
  endTime: number;
  mazeName: string;
  gridSize: string;
  goalReached: boolean;
  movements: number;
  explorationPercentage: number;
  pathLength: number | null;
  strategy: ExplorationStrategy;
  mode: "SIMULATION" | "PHYSICAL";
};

