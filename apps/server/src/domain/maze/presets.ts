import { MazeConfig, MazeExportFormat } from "@maze/shared";
import { Maze } from "./Maze.js";

export function createEmptyPreset(rows = 10, cols = 10): MazeExportFormat {
  const maze = Maze.createDefault(rows, cols);
  maze.setConfig({ name: "Empty Grid" });
  return maze.exportJson();
}

export function createCorridorPreset(): MazeExportFormat {
  const maze = Maze.createDefault(6, 6);
  maze.setConfig({
    name: "Simple S-Corridor",
    start: { row: 5, col: 0 },
    goal: { row: 0, col: 5 },
    initialDirection: "NORTH",
  });
  // Clear interior first
  maze.clearInteriorWalls();

  // Create an S-shaped corridor with walls
  // Row 1: wall across cols 0..4
  for (let c = 0; c < 5; c++) {
    maze.setWall({ row: 1, col: c }, "SOUTH", true);
  }
  // Row 3: wall across cols 1..5
  for (let c = 1; c < 6; c++) {
    maze.setWall({ row: 3, col: c }, "SOUTH", true);
  }

  return maze.exportJson();
}

export function createDeadEndPreset(): MazeExportFormat {
  const maze = Maze.createDefault(8, 8);
  maze.setConfig({
    name: "Dead-End Challenge",
    start: { row: 7, col: 0 },
    goal: { row: 0, col: 7 },
    initialDirection: "NORTH",
  });
  maze.clearInteriorWalls();

  // Vertical spine at col 2
  for (let r = 1; r < 7; r++) {
    maze.setWall({ row: r, col: 2 }, "EAST", true);
  }

  // Definite dead-end pocket at (2, 0): outer WEST is wall, add NORTH and EAST
  maze.setWall({ row: 2, col: 0 }, "NORTH", true);
  maze.setWall({ row: 2, col: 0 }, "EAST", true);

  // Another dead-end at (5, 1): south and east walls
  maze.setWall({ row: 5, col: 1 }, "SOUTH", true);
  maze.setWall({ row: 5, col: 1 }, "EAST", true);

  // Right side dead end
  for (let c = 4; c < 7; c++) {
    maze.setWall({ row: 4, col: c }, "SOUTH", true);
  }
  maze.setWall({ row: 4, col: 6 }, "EAST", true);

  return maze.exportJson();
}

export function createIntersectionsPreset(): MazeExportFormat {
  const maze = Maze.createDefault(8, 8);
  maze.setConfig({
    name: "Multiple Intersections",
    start: { row: 7, col: 0 },
    goal: { row: 0, col: 7 },
    initialDirection: "NORTH",
  });
  maze.clearInteriorWalls();

  // Grid blocks in middle to create multiple distinct branch routes
  maze.setWall({ row: 2, col: 2 }, "SOUTH", true);
  maze.setWall({ row: 2, col: 3 }, "SOUTH", true);
  maze.setWall({ row: 2, col: 2 }, "WEST", true);
  maze.setWall({ row: 2, col: 3 }, "EAST", true);

  maze.setWall({ row: 5, col: 4 }, "NORTH", true);
  maze.setWall({ row: 5, col: 5 }, "NORTH", true);
  maze.setWall({ row: 5, col: 4 }, "WEST", true);
  maze.setWall({ row: 5, col: 5 }, "EAST", true);

  return maze.exportJson();
}

export function createBacktrackingPreset(): MazeExportFormat {
  const maze = Maze.createDefault(8, 8);
  maze.setConfig({
    name: "Backtracking Test",
    start: { row: 7, col: 0 },
    goal: { row: 0, col: 7 },
    initialDirection: "NORTH",
  });
  maze.clearInteriorWalls();

  // Deep deceptive pocket on the left
  for (let r = 2; r < 7; r++) {
    maze.setWall({ row: r, col: 1 }, "EAST", true);
  }
  // Dead-end cap at row 2 col 0-1
  maze.setWall({ row: 2, col: 0 }, "NORTH", true);
  maze.setWall({ row: 2, col: 1 }, "NORTH", true);

  // Right route to goal
  for (let r = 0; r < 5; r++) {
    maze.setWall({ row: r, col: 4 }, "WEST", true);
  }

  return maze.exportJson();
}

export function createKnownShortestPathPreset(): MazeExportFormat {
  const maze = Maze.createDefault(6, 6);
  maze.setConfig({
    name: "Known Shortest Path (10 moves)",
    start: { row: 5, col: 0 },
    goal: { row: 0, col: 5 },
    initialDirection: "NORTH",
  });
  maze.clearInteriorWalls();

  // Long route around the outside, short route through middle
  // Block middle slightly to make exact known path
  maze.setWall({ row: 3, col: 1 }, "EAST", true);
  maze.setWall({ row: 3, col: 2 }, "EAST", true);
  maze.setWall({ row: 1, col: 3 }, "SOUTH", true);
  maze.setWall({ row: 1, col: 4 }, "SOUTH", true);

  return maze.exportJson();
}

export function createUnreachableGoalPreset(): MazeExportFormat {
  const maze = Maze.createDefault(6, 6);
  maze.setConfig({
    name: "Unreachable Goal (Negative Test)",
    start: { row: 5, col: 0 },
    goal: { row: 0, col: 5 },
    initialDirection: "NORTH",
  });
  maze.clearInteriorWalls();

  // Completely enclose the goal cell (0, 5)
  maze.setWall({ row: 0, col: 5 }, "WEST", true);
  maze.setWall({ row: 0, col: 5 }, "SOUTH", true);

  return maze.exportJson();
}

export const PRESETS: Record<string, () => MazeExportFormat> = {
  "empty": () => createEmptyPreset(10, 10),
  "corridor": createCorridorPreset,
  "dead-end": createDeadEndPreset,
  "intersections": createIntersectionsPreset,
  "backtracking": createBacktrackingPreset,
  "known-path": createKnownShortestPathPreset,
  "unreachable": createUnreachableGoalPreset,
};
