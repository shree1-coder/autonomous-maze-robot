import { describe, it, expect } from "vitest";
import { Maze } from "../src/domain/maze/Maze.js";
import { PRESETS } from "../src/domain/maze/presets.js";
import { MazeExportSchema } from "@maze/shared";

describe("Maze Domain Model", () => {
  it("initializes grid with perimeter walls and open interior", () => {
    const maze = Maze.createDefault(5, 5);
    const config = maze.getConfig();
    expect(config.rows).toBe(5);
    expect(config.cols).toBe(5);

    // Perimeter walls must be true
    expect(maze.hasWall({ row: 0, col: 0 }, "NORTH")).toBe(true);
    expect(maze.hasWall({ row: 0, col: 0 }, "WEST")).toBe(true);
    expect(maze.hasWall({ row: 4, col: 4 }, "SOUTH")).toBe(true);
    expect(maze.hasWall({ row: 4, col: 4 }, "EAST")).toBe(true);

    // Interior walls should be open by default
    expect(maze.hasWall({ row: 2, col: 2 }, "NORTH")).toBe(false);
    expect(maze.hasWall({ row: 2, col: 2 }, "EAST")).toBe(false);
  });

  it("maintains shared-wall consistency between adjacent cells", () => {
    const maze = Maze.createDefault(5, 5);
    const cellA = { row: 1, col: 1 };
    const cellB = { row: 1, col: 2 }; // east of cellA

    expect(maze.hasWall(cellA, "EAST")).toBe(false);
    expect(maze.hasWall(cellB, "WEST")).toBe(false);

    // Set wall on cellA east
    maze.setWall(cellA, "EAST", true);
    // cellB west must now also be wall
    expect(maze.hasWall(cellA, "EAST")).toBe(true);
    expect(maze.hasWall(cellB, "WEST")).toBe(true);

    // Now remove it from cellB west
    maze.setWall(cellB, "WEST", false);
    expect(maze.hasWall(cellA, "EAST")).toBe(false);
    expect(maze.hasWall(cellB, "WEST")).toBe(false);
  });

  it("prevents removing outer boundary walls", () => {
    const maze = Maze.createDefault(5, 5);
    // Toggling outer boundary via toggleWall should fail
    const toggled = maze.toggleWall("horizontal", 0, 0);
    expect(toggled).toBe(false);
    expect(maze.hasWall({ row: 0, col: 0 }, "NORTH")).toBe(true);
  });

  it("handles out of bounds positions gracefully", () => {
    const maze = Maze.createDefault(4, 4);
    expect(maze.isWithinBounds({ row: -1, col: 0 })).toBe(false);
    expect(maze.isWithinBounds({ row: 4, col: 0 })).toBe(false);
    expect(maze.hasWall({ row: -1, col: 0 }, "NORTH")).toBe(true);
    expect(maze.getNeighbor({ row: 0, col: 0 }, "NORTH")).toBeNull();
  });

  it("exports and imports maze correctly conforming to schema", () => {
    const maze = Maze.createDefault(6, 6);
    maze.setWall({ row: 2, col: 2 }, "NORTH", true);
    maze.setWall({ row: 3, col: 3 }, "EAST", true);

    const exported = maze.exportJson();
    const validated = MazeExportSchema.safeParse(exported);
    expect(validated.success).toBe(true);

    const imported = Maze.fromJson(exported);
    expect(imported.hasWall({ row: 2, col: 2 }, "NORTH")).toBe(true);
    expect(imported.hasWall({ row: 3, col: 3 }, "EAST")).toBe(true);
    expect(imported.getConfig().rows).toBe(6);
  });

  it("loads all built-in presets successfully", () => {
    for (const [name, fn] of Object.entries(PRESETS)) {
      const data = fn();
      expect(MazeExportSchema.safeParse(data).success).toBe(true);
      const maze = Maze.fromJson(data);
      expect(maze.isWithinBounds(data.config.start)).toBe(true);
      expect(maze.isWithinBounds(data.config.goal)).toBe(true);
    }
  });
});

