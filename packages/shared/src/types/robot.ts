import { CellPosition, Direction } from "./maze.js";

export type RobotMode =
  | "IDLE"
  | "EXPLORING"
  | "PAUSED"
  | "RETURNING"
  | "SOLVING"
  | "FOLLOWING_PATH"
  | "GOAL_REACHED"
  | "FAULT";

export type RelativeDirection = "LEFT" | "FRONT" | "RIGHT";

export type MovementAction =
  | "FORWARD"
  | "TURN_LEFT"
  | "TURN_RIGHT"
  | "REVERSE"
  | "STOP";

export type RobotState = {
  position: CellPosition;
  orientation: Direction;
  mode: RobotMode;
  statusMessage?: string;
  pathIndex?: number;
};

