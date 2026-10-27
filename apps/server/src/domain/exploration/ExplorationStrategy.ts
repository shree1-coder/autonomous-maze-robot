import {
  CellPosition,
  Direction,
  ExplorationStrategy,
  MovementAction,
  RelativeDirection,
  RobotSensors,
} from "@maze/shared";
import { KnowledgeMap } from "../mapping/KnowledgeMap.js";
import { Orientation } from "../robot/Orientation.js";

export type NextMoveDecision = {
  action: MovementAction;
  reason: string;
  targetPos?: CellPosition;
};

export interface IExplorationStrategy {
  chooseNextAction(
    currentPos: CellPosition,
    currentFacing: Direction,
    sensors: RobotSensors,
    map: KnowledgeMap,
    goal: CellPosition,
    history: CellPosition[]
  ): NextMoveDecision;
}

/**
 * Classical Wall Follower (Left-hand or Right-hand rule).
 */
export class WallFollowerStrategy implements IExplorationStrategy {
  private hand: "LEFT" | "RIGHT";

  constructor(hand: "LEFT" | "RIGHT") {
    this.hand = hand;
  }

  public chooseNextAction(
    currentPos: CellPosition,
    currentFacing: Direction,
    sensors: RobotSensors,
    map: KnowledgeMap,
    _goal: CellPosition,
    _history: CellPosition[]
  ): NextMoveDecision {
    const primaryDir: RelativeDirection = this.hand === "LEFT" ? "LEFT" : "RIGHT";
    const secondaryDir: RelativeDirection = this.hand === "LEFT" ? "RIGHT" : "LEFT";

    const primarySensor = this.hand === "LEFT" ? sensors.left : sensors.right;
    const secondarySensor = this.hand === "LEFT" ? sensors.right : sensors.left;

    // 1. If wall follower preferred side is clear, turn towards it
    if (primarySensor.state === "CLEAR") {
      const turnAction: MovementAction = this.hand === "LEFT" ? "TURN_LEFT" : "TURN_RIGHT";
      return {
        action: turnAction,
        reason: `${this.hand} side is open, turning ${this.hand.toLowerCase()}`,
      };
    }

    // 2. If front is clear, proceed forward
    if (sensors.front.state === "CLEAR") {
      return {
        action: "FORWARD",
        reason: "Front is open, advancing forward",
      };
    }

    // 3. If opposite side is clear, turn towards it
    if (secondarySensor.state === "CLEAR") {
      const turnAction: MovementAction = this.hand === "LEFT" ? "TURN_RIGHT" : "TURN_LEFT";
      return {
        action: turnAction,
        reason: `Front and ${this.hand.toLowerCase()} blocked, turning ${secondaryDir.toLowerCase()}`,
      };
    }

    // 4. Dead end: Turn to begin 180 turnaround
    return {
      action: "TURN_RIGHT",
      reason: "Dead end encountered, turning around",
    };
  }
}

/**
 * Systematic Exploration with Backtracking (Pledge / Trémaux / Frontier-based BFS).
 * Operates purely on accumulated knowledge and local sensors.
 */
export class SystematicExplorationStrategy implements IExplorationStrategy {
  // Queue of planned actions when executing a backtrack path
  private backtrackQueue: MovementAction[] = [];

  public chooseNextAction(
    currentPos: CellPosition,
    currentFacing: Direction,
    sensors: RobotSensors,
    map: KnowledgeMap,
    goal: CellPosition,
    _history: CellPosition[]
  ): NextMoveDecision {
    // If executing a backtrack sequence, dequeue next action
    if (this.backtrackQueue.length > 0) {
      const action = this.backtrackQueue.shift()!;
      return {
        action,
        reason: `Backtracking to unexplored frontier (${this.backtrackQueue.length} steps remaining)`,
      };
    }

    // Check adjacent cells for an immediate unvisited open neighbor
    // Evaluate candidates: FRONT, LEFT, RIGHT
    const candidates: { rel: RelativeDirection; dir: Direction; pos: CellPosition }[] = [
      { rel: "FRONT", dir: currentFacing, pos: this.getNeighbor(currentPos, currentFacing) },
      { rel: "LEFT", dir: Orientation.turnLeft(currentFacing), pos: this.getNeighbor(currentPos, Orientation.turnLeft(currentFacing)) },
      { rel: "RIGHT", dir: Orientation.turnRight(currentFacing), pos: this.getNeighbor(currentPos, Orientation.turnRight(currentFacing)) },
    ];

    // Priority 1: Directly adjacent cell that is OPEN and UNVISITED
    for (const c of candidates) {
      const sensor = c.rel === "FRONT" ? sensors.front : c.rel === "LEFT" ? sensors.left : sensors.right;
      if (sensor.state === "CLEAR" && map.isWithinBounds(c.pos) && !map.isVisited(c.pos)) {
        if (c.rel === "FRONT") {
          return { action: "FORWARD", reason: "Advancing into unvisited adjacent cell" };
        } else if (c.rel === "LEFT") {
          return { action: "TURN_LEFT", reason: "Turning left towards unvisited cell" };
        } else {
          return { action: "TURN_RIGHT", reason: "Turning right towards unvisited cell" };
        }
      }
    }

    // Priority 2: If front is OPEN and not yet fully explored (maybe has unknown side walls)
    if (sensors.front.state === "CLEAR") {
      const frontPos = this.getNeighbor(currentPos, currentFacing);
      if (map.isWithinBounds(frontPos) && !map.isFullyExplored(frontPos)) {
        return { action: "FORWARD", reason: "Advancing into partially explored forward cell" };
      }
    }

    // Priority 3: Find nearest unvisited cell or cell with unexplored walls via BFS on known OPEN map
    const backtrackPath = this.findNearestFrontier(map, currentPos);
    if (backtrackPath && backtrackPath.length > 1) {
      // Convert path to actions
      const { actions } = this.pathToActions(backtrackPath, currentFacing);
      if (actions.length > 0) {
        const first = actions.shift()!;
        this.backtrackQueue = actions;
        return {
          action: first,
          reason: `Plotting backtrack route to unexplored frontier at (${backtrackPath[backtrackPath.length - 1].row}, ${backtrackPath[backtrackPath.length - 1].col})`,
        };
      }
    }

    // Fallback: If no frontier found but front is clear, go forward; else turn
    if (sensors.front.state === "CLEAR") {
      return { action: "FORWARD", reason: "Searching forward" };
    }
    if (sensors.left.state === "CLEAR") {
      return { action: "TURN_LEFT", reason: "Turning left to avoid obstacle" };
    }
    if (sensors.right.state === "CLEAR") {
      return { action: "TURN_RIGHT", reason: "Turning right to avoid obstacle" };
    }

    return { action: "TURN_RIGHT", reason: "Dead end, turning" };
  }

  private getNeighbor(pos: CellPosition, dir: Direction): CellPosition {
    const vec = Orientation.getStepVector(dir);
    return { row: pos.row + vec.dRow, col: pos.col + vec.dCol };
  }

  /**
   * Breadth-first search through known OPEN cells to find the closest cell that either:
   * 1. Is unvisited, or
   * 2. Has an adjacent traversable edge to an unvisited cell or unknown wall.
   */
  private findNearestFrontier(map: KnowledgeMap, start: CellPosition): CellPosition[] | null {
    const rows = map.getRows();
    const cols = map.getCols();
    const visited: boolean[][] = Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => false)
    );
    const parent: (CellPosition | null)[][] = Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => null)
    );

    const queue: CellPosition[] = [start];
    visited[start.row][start.col] = true;

    let target: CellPosition | null = null;

    while (queue.length > 0) {
      const curr = queue.shift()!;

      // Check if curr is a frontier: not visited, or visited but has unknown walls / unvisited neighbors
      if (curr.row !== start.row || curr.col !== start.col) {
        if (!map.isVisited(curr) || !map.isFullyExplored(curr)) {
          target = curr;
          break;
        }
      }

      for (const dir of Orientation.DIRECTIONS) {
        if (map.getWall(curr, dir) === "OPEN") {
          const vec = Orientation.getStepVector(dir);
          const nextPos: CellPosition = { row: curr.row + vec.dRow, col: curr.col + vec.dCol };
          if (map.isWithinBounds(nextPos) && !visited[nextPos.row][nextPos.col]) {
            visited[nextPos.row][nextPos.col] = true;
            parent[nextPos.row][nextPos.col] = curr;
            queue.push(nextPos);
          }
        }
      }
    }

    if (!target) return null;

    // Reconstruct path
    const path: CellPosition[] = [];
    let p: CellPosition | null = target;
    while (p !== null) {
      path.push(p);
      if (p.row === start.row && p.col === start.col) break;
      p = parent[p.row][p.col];
    }
    return path.reverse();
  }

  private pathToActions(
    path: CellPosition[],
    startFacing: Direction
  ): { actions: MovementAction[] } {
    const actions: MovementAction[] = [];
    let facing = startFacing;

    for (let i = 0; i < path.length - 1; i++) {
      const from = path[i];
      const to = path[i + 1];

      let targetDir: Direction;
      if (to.row < from.row) targetDir = "NORTH";
      else if (to.row > from.row) targetDir = "SOUTH";
      else if (to.col < from.col) targetDir = "WEST";
      else targetDir = "EAST";

      while (facing !== targetDir) {
        if (Orientation.turnLeft(facing) === targetDir) {
          actions.push("TURN_LEFT");
          facing = Orientation.turnLeft(facing);
        } else {
          actions.push("TURN_RIGHT");
          facing = Orientation.turnRight(facing);
        }
      }
      actions.push("FORWARD");
    }

    return { actions };
  }

  public reset(): void {
    this.backtrackQueue = [];
  }
}

