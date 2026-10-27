import { describe, it, expect } from "vitest";
import { Maze } from "../src/domain/maze/Maze.js";
import { SimulationEngine } from "../src/simulation/SimulationEngine.js";
import { PRESETS } from "../src/domain/maze/presets.js";

describe("Simulation Exploration Engine", () => {
  it("never penetrates or jumps through ground-truth walls", () => {
    const maze = Maze.createDefault(4, 4);
    // Put a wall directly in front of start (3, 0) towards NORTH (2, 0)
    maze.setWall({ row: 3, col: 0 }, "NORTH", true);

    const engine = new SimulationEngine(maze.getConfig(), maze.toGroundTruth());
    const initialPos = { ...engine.getState().robot.position };

    // Attempting forward movement directly into wall should be prevented
    engine.step();
    const currentPos = engine.getState().robot.position;
    // Robot cannot be in (2, 0) because wall is there
    expect(currentPos).not.toEqual({ row: 2, col: 0 });
  });

  it("progressively discovers walls and marks them in knowledge map", () => {
    const maze = Maze.createDefault(5, 5);
    maze.setWall({ row: 4, col: 0 }, "NORTH", true);
    maze.setWall({ row: 4, col: 0 }, "EAST", false);

    const engine = new SimulationEngine(maze.getConfig(), maze.toGroundTruth());
    // Observe initial state
    engine.observeAndMap();

    const kMap = engine.getKnowledgeMap();
    // Facing NORTH at (4, 0), front sensor sees wall
    expect(kMap.getWall({ row: 4, col: 0 }, "NORTH")).toBe("WALL");
    expect(kMap.getWall({ row: 4, col: 0 }, "EAST")).toBe("OPEN");
    expect(kMap.getWall({ row: 4, col: 0 }, "WEST")).toBe("WALL"); // Outer boundary
  });

  it("systematically explores and reaches goal in simple corridor", () => {
    const corridorData = PRESETS["corridor"]();
    const maze = Maze.fromJson(corridorData);
    const engine = new SimulationEngine(maze.getConfig(), maze.toGroundTruth(), {
      strategy: "SYSTEMATIC",
      maxSteps: 300,
    });

    let steps = 0;
    while (engine.getState().robot.mode !== "GOAL_REACHED" && steps < 200) {
      const cont = engine.step();
      steps++;
      if (!cont) break;
    }

    const finalState = engine.getState();
    expect(finalState.robot.mode).toBe("GOAL_REACHED");
    expect(finalState.stats.goalReached).toBe(true);
    expect(finalState.robot.position).toEqual(maze.getConfig().goal);
  });

  it("handles dead ends and backtracks successfully in challenge maze", () => {
    const deadEndData = PRESETS["dead-end"]();
    const maze = Maze.fromJson(deadEndData);
    const engine = new SimulationEngine(maze.getConfig(), maze.toGroundTruth(), {
      strategy: "SYSTEMATIC",
      maxSteps: 500,
    });

    let steps = 0;
    while (engine.getState().robot.mode !== "GOAL_REACHED" && steps < 400) {
      const cont = engine.step();
      steps++;
      if (!cont) break;
    }

    const finalState = engine.getState();
    expect(finalState.robot.mode).toBe("GOAL_REACHED");
    expect(finalState.stats.deadEndsCount).toBeGreaterThan(0);
  });

  it("stops safely and does not loop forever when goal is unreachable", () => {
    const unreachableData = PRESETS["unreachable"]();
    const maze = Maze.fromJson(unreachableData);
    const engine = new SimulationEngine(maze.getConfig(), maze.toGroundTruth(), {
      strategy: "SYSTEMATIC",
      maxSteps: 100,
    });

    let steps = 0;
    while (steps < 100) {
      const cont = engine.step();
      steps++;
      if (!cont) break;
    }

    const state = engine.getState();
    // Must stop safely without crash
    expect(state.stats.steps).toBeLessThanOrEqual(100);
    expect(state.stats.goalReached).toBe(false);
  });
});

