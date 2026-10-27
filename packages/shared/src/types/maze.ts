export type Direction = "NORTH" | "EAST" | "SOUTH" | "WEST";

export type CellPosition = {
  row: number;
  col: number;
};

export type WallState = "UNKNOWN" | "OPEN" | "WALL";

export type CellWalls = {
  north: WallState;
  east: WallState;
  south: WallState;
  west: WallState;
};

export type CellKnowledge = {
  north: WallState;
  east: WallState;
  south: WallState;
  west: WallState;
  visited: boolean;
  fullyExplored: boolean;
  deadEnd?: boolean;
};

export type MazeConfig = {
  rows: number;
  cols: number;
  start: CellPosition;
  goal: CellPosition;
  initialDirection: Direction;
  name?: string;
};

/**
 * GroundTruthMaze uses canonical internal arrays for edges:
 * - horizontalWalls: (rows + 1) x cols. horizontalWalls[r][c] is the wall above row r (or outer wall when r=0 or r=rows).
 * - verticalWalls: rows x (cols + 1). verticalWalls[r][c] is the wall to the left of col c (or outer wall when c=0 or c=cols).
 * True = wall exists, False = open passage.
 */
export type GroundTruthMaze = {
  config: MazeConfig;
  horizontalWalls: boolean[][];
  verticalWalls: boolean[][];
};

export type MazeExportFormat = {
  version: 1;
  config: MazeConfig;
  horizontalWalls: boolean[][];
  verticalWalls: boolean[][];
  createdAt?: string;
  description?: string;
};

