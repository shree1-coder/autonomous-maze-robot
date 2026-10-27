import { describe, it, expect } from "vitest";
import { KnowledgeMap } from "../src/domain/mapping/KnowledgeMap.js";
import { BfsPathfinder } from "../src/domain/pathfinding/BfsPathfinder.js";

describe("BFS Pathfinder", () => {
  it("finds straight corridor shortest path", () => {
    const map = new KnowledgeMap(5, 5);
    // Mark a line of cells as OPEN: (0,0) -> (0,1) -> (0,2)
    map.setWall({ row: 0, col: 0 }, "EAST", "OPEN");
    map.setWall({ row: 0, col: 1 }, "EAST", "OPEN");

    const result = BfsPathfinder.findPath(map, { row: 0, col: 0 }, { row: 0, col: 2 }, "EAST");
    expect(result.found).toBe(true);
    expect(result.cellMoves).toBe(2);
    expect(result.path).toEqual([
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      { row: 0, col: 2 },
    ]);
    expect(result.actions).toEqual(["FORWARD", "FORWARD"]);
    expect(result.turns).toBe(0);
  });

  it("calculates necessary turns when executing path", () => {
    const map = new KnowledgeMap(5, 5);
    // Move from (1, 1) facing NORTH to (0, 1), then turn right to (0, 2)
    map.setWall({ row: 1, col: 1 }, "NORTH", "OPEN");
    map.setWall({ row: 0, col: 1 }, "EAST", "OPEN");

    const result = BfsPathfinder.findPath(map, { row: 1, col: 1 }, { row: 0, col: 2 }, "NORTH");
    expect(result.found).toBe(true);
    expect(result.cellMoves).toBe(2);
    // Actions should be: FORWARD, TURN_RIGHT, FORWARD
    expect(result.actions).toEqual(["FORWARD", "TURN_RIGHT", "FORWARD"]);
    expect(result.turns).toBe(1);
  });

  it("returns zero length when start equals goal", () => {
    const map = new KnowledgeMap(5, 5);
    const result = BfsPathfinder.findPath(map, { row: 2, col: 2 }, { row: 2, col: 2 }, "NORTH");
    expect(result.found).toBe(true);
    expect(result.cellMoves).toBe(0);
    expect(result.path).toEqual([{ row: 2, col: 2 }]);
    expect(result.actions).toEqual([]);
  });

  it("handles unreachable goal gracefully without crashing", () => {
    const map = new KnowledgeMap(5, 5);
    // No open walls connecting (0, 0) to (4, 4)
    const result = BfsPathfinder.findPath(map, { row: 0, col: 0 }, { row: 4, col: 4 }, "NORTH");
    expect(result.found).toBe(false);
    expect(result.path).toEqual([]);
    expect(result.unreachableReason).toBeDefined();
  });

  it("selects the shortest path when multiple routes exist", () => {
    const map = new KnowledgeMap(3, 3);
    // Route 1 (shorter): (0,0) -> (0,1) -> (1,1) [2 moves]
    map.setWall({ row: 0, col: 0 }, "EAST", "OPEN");
    map.setWall({ row: 0, col: 1 }, "SOUTH", "OPEN");

    // Route 2 (longer): (0,0) -> (1,0) -> (2,0) -> (2,1) -> (1,1) [4 moves]
    map.setWall({ row: 0, col: 0 }, "SOUTH", "OPEN");
    map.setWall({ row: 1, col: 0 }, "SOUTH", "OPEN");
    map.setWall({ row: 2, col: 0 }, "EAST", "OPEN");
    map.setWall({ row: 2, col: 1 }, "NORTH", "OPEN");

    const result = BfsPathfinder.findPath(map, { row: 0, col: 0 }, { row: 1, col: 1 }, "EAST");
    expect(result.found).toBe(true);
    expect(result.cellMoves).toBe(2);
    expect(result.path).toEqual([
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      { row: 1, col: 1 },
    ]);
  });
});

