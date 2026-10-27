import {
  CellPosition,
  Direction,
  MovementAction,
} from "@maze/shared";
import { KnowledgeMap } from "../mapping/KnowledgeMap.js";
import { Orientation } from "../domain/../robot/Orientation.js";

export type PathfindingResult = {
  found: boolean;
  path: CellPosition[];
  actions: MovementAction[];
  cellMoves: number;
  turns: number;
  unreachableReason?: string;
};

export class BfsPathfinder {
  /**
   * Finds the shortest path through known OPEN traversable edges in the knowledge map.
   */
  public static findPath(
    map: KnowledgeMap,
    start: CellPosition,
    goal: CellPosition,
    initialOrientation: Direction
  ): PathfindingResult {
    if (!map.isWithinBounds(start) || !map.isWithinBounds(goal)) {
      return {
        found: false,
        path: [],
        actions: [],
        cellMoves: 0,
        turns: 0,
        unreachableReason: "Start or goal position is outside grid boundaries.",
      };
    }

    if (start.row === goal.row && start.col === goal.col) {
      return {
        found: true,
        path: [start],
        actions: [],
        cellMoves: 0,
        turns: 0,
      };
    }

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

    let reached = false;

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (current.row === goal.row && current.col === goal.col) {
        reached = true;
        break;
      }

      for (const dir of Orientation.DIRECTIONS) {
        // Can only traverse if wall is known to be OPEN
        if (map.getWall(current, dir) === "OPEN") {
          const vec = Orientation.getStepVector(dir);
          const nextRow = current.row + vec.dRow;
          const nextCol = current.col + vec.dCol;
          const nextPos: CellPosition = { row: nextRow, col: nextCol };

          if (map.isWithinBounds(nextPos) && !visited[nextRow][nextCol]) {
            visited[nextRow][nextCol] = true;
            parent[nextRow][nextCol] = current;
            queue.push(nextPos);
          }
        }
      }
    }

    if (!reached) {
      return {
        found: false,
        path: [],
        actions: [],
        cellMoves: 0,
        turns: 0,
        unreachableReason: "No known open path connects start to goal in the accumulated map.",
      };
    }

    // Reconstruct path
    const path: CellPosition[] = [];
    let curr: CellPosition | null = goal;
    while (curr !== null) {
      path.push(curr);
      if (curr.row === start.row && curr.col === start.col) break;
      curr = parent[curr.row][curr.col];
    }
    path.reverse();

    // Convert path into discrete movement actions and count turns
    const { actions, turns } = this.pathToActions(path, initialOrientation);

    return {
      found: true,
      path,
      actions,
      cellMoves: path.length - 1,
      turns,
    };
  }

  /**
   * Converts a cell-by-cell path into movement actions (FORWARD, TURN_LEFT, TURN_RIGHT).
   */
  public static pathToActions(
    path: CellPosition[],
    startFacing: Direction
  ): { actions: MovementAction[]; turns: number } {
    const actions: MovementAction[] = [];
    let facing = startFacing;
    let turns = 0;

    for (let i = 0; i < path.length - 1; i++) {
      const from = path[i];
      const to = path[i + 1];

      let targetDir: Direction;
      if (to.row < from.row) targetDir = "NORTH";
      else if (to.row > from.row) targetDir = "SOUTH";
      else if (to.col < from.col) targetDir = "WEST";
      else targetDir = "EAST";

      // Rotate robot until facing target direction
      while (facing !== targetDir) {
        const leftCandidate = Orientation.turnLeft(facing);
        if (leftCandidate === targetDir) {
          actions.push("TURN_LEFT");
          facing = leftCandidate;
          turns++;
        } else {
          actions.push("TURN_RIGHT");
          facing = Orientation.turnRight(facing);
          turns++;
        }
      }

      actions.push("FORWARD");
    }

    return { actions, turns };
  }
}

