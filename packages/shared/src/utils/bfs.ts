import { CellPosition, Direction, MazeConfig, GroundTruthMaze } from "../types/maze.js";
import { MovementAction } from "../types/robot.js";

export type PathfindingResult = {
  found: boolean;
  path: CellPosition[];
  actions: MovementAction[];
  cellMoves: number;
  turns: number;
  unreachableReason?: string;
};

const DIRECTIONS: Direction[] = ["NORTH", "EAST", "SOUTH", "WEST"];

function turnLeft(dir: Direction): Direction {
  switch (dir) {
    case "NORTH": return "WEST";
    case "WEST": return "SOUTH";
    case "SOUTH": return "EAST";
    case "EAST": return "NORTH";
  }
}

function turnRight(dir: Direction): Direction {
  switch (dir) {
    case "NORTH": return "EAST";
    case "EAST": return "SOUTH";
    case "SOUTH": return "WEST";
    case "WEST": return "NORTH";
  }
}

function getStepVector(dir: Direction): { dRow: number; dCol: number } {
  switch (dir) {
    case "NORTH": return { dRow: -1, dCol: 0 };
    case "SOUTH": return { dRow: 1, dCol: 0 };
    case "EAST": return { dRow: 0, dCol: 1 };
    case "WEST": return { dRow: 0, dCol: -1 };
  }
}

export function hasGroundTruthWall(
  maze: GroundTruthMaze,
  pos: CellPosition,
  dir: Direction
): boolean {
  const { rows, cols } = maze.config;
  if (pos.row < 0 || pos.row >= rows || pos.col < 0 || pos.col >= cols) return true;

  switch (dir) {
    case "NORTH":
      return !!maze.horizontalWalls[pos.row]?.[pos.col];
    case "SOUTH":
      return !!maze.horizontalWalls[pos.row + 1]?.[pos.col];
    case "WEST":
      return !!maze.verticalWalls[pos.row]?.[pos.col];
    case "EAST":
      return !!maze.verticalWalls[pos.row]?.[pos.col + 1];
  }
}

export function solveGroundTruthBfs(
  maze: GroundTruthMaze,
  start: CellPosition = maze.config.start,
  goal: CellPosition = maze.config.goal,
  initialFacing: Direction = maze.config.initialDirection
): PathfindingResult {
  const { rows, cols } = maze.config;

  if (start.row === goal.row && start.col === goal.col) {
    return {
      found: true,
      path: [start],
      actions: [],
      cellMoves: 0,
      turns: 0,
    };
  }

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

    for (const dir of DIRECTIONS) {
      if (!hasGroundTruthWall(maze, current, dir)) {
        const vec = getStepVector(dir);
        const nextPos: CellPosition = {
          row: current.row + vec.dRow,
          col: current.col + vec.dCol,
        };

        if (
          nextPos.row >= 0 &&
          nextPos.row < rows &&
          nextPos.col >= 0 &&
          nextPos.col < cols &&
          !visited[nextPos.row][nextPos.col]
        ) {
          visited[nextPos.row][nextPos.col] = true;
          parent[nextPos.row][nextPos.col] = current;
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
      unreachableReason: "No traversable path exists from Start to Goal in this custom maze configuration.",
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

  // Convert to actions
  const actions: MovementAction[] = [];
  let facing = initialFacing;
  let turns = 0;

  for (let i = 0; i < path.length - 1; i++) {
    const from = path[i];
    const to = path[i + 1];

    let targetDir: Direction;
    if (to.row < from.row) targetDir = "NORTH";
    else if (to.row > from.row) targetDir = "SOUTH";
    else if (to.col < from.col) targetDir = "WEST";
    else targetDir = "EAST";

    while (facing !== targetDir) {
      if (turnLeft(facing) === targetDir) {
        actions.push("TURN_LEFT");
        facing = turnLeft(facing);
        turns++;
      } else {
        actions.push("TURN_RIGHT");
        facing = turnRight(facing);
        turns++;
      }
    }

    actions.push("FORWARD");
  }

  return {
    found: true,
    path,
    actions,
    cellMoves: path.length - 1,
    turns,
  };
}
