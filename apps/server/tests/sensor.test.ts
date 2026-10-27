import { describe, it, expect } from "vitest";
import { Maze } from "../src/domain/maze/Maze.js";
import { SensorSimulator } from "../src/simulation/SensorSimulator.js";
import { Orientation } from "../src/domain/robot/Orientation.js";

describe("Sensor Simulation & Orientation Conversion", () => {
  it("correctly maps relative sensor positions based on robot orientation", () => {
    // When facing NORTH:
    expect(Orientation.relativeToAbsolute("NORTH", "FRONT")).toBe("NORTH");
    expect(Orientation.relativeToAbsolute("NORTH", "LEFT")).toBe("WEST");
    expect(Orientation.relativeToAbsolute("NORTH", "RIGHT")).toBe("EAST");

    // When facing EAST:
    expect(Orientation.relativeToAbsolute("EAST", "FRONT")).toBe("EAST");
    expect(Orientation.relativeToAbsolute("EAST", "LEFT")).toBe("NORTH");
    expect(Orientation.relativeToAbsolute("EAST", "RIGHT")).toBe("SOUTH");

    // When facing SOUTH:
    expect(Orientation.relativeToAbsolute("SOUTH", "FRONT")).toBe("SOUTH");
    expect(Orientation.relativeToAbsolute("SOUTH", "LEFT")).toBe("EAST");
    expect(Orientation.relativeToAbsolute("SOUTH", "RIGHT")).toBe("WEST");

    // When facing WEST:
    expect(Orientation.relativeToAbsolute("WEST", "FRONT")).toBe("WEST");
    expect(Orientation.relativeToAbsolute("WEST", "LEFT")).toBe("SOUTH");
    expect(Orientation.relativeToAbsolute("WEST", "RIGHT")).toBe("NORTH");
  });

  it("detects walls accurately using simulated sensors", () => {
    const maze = Maze.createDefault(5, 5);
    // Position (0, 0): NORTH and WEST are outer perimeter walls
    const simulator = new SensorSimulator("ACTIVE_LOW");

    // Facing EAST at (0, 0):
    // FRONT is EAST (open)
    // LEFT is NORTH (wall)
    // RIGHT is SOUTH (open)
    const sensors = simulator.readAll(maze, { row: 0, col: 0 }, "EAST");
    expect(sensors.front.state).toBe("CLEAR");
    expect(sensors.front.raw).toBe("HIGH"); // ACTIVE_LOW clear = HIGH

    expect(sensors.left.state).toBe("BLOCKED");
    expect(sensors.left.raw).toBe("LOW"); // ACTIVE_LOW blocked = LOW

    expect(sensors.right.state).toBe("CLEAR");
    expect(sensors.right.raw).toBe("HIGH");
  });

  it("honors sensor polarity configuration", () => {
    const maze = Maze.createDefault(5, 5);
    const pos = { row: 0, col: 0 };
    // North is wall

    const simActiveLow = new SensorSimulator("ACTIVE_LOW");
    const rLow = simActiveLow.readSensor(maze, pos, "NORTH", "FRONT");
    expect(rLow.state).toBe("BLOCKED");
    expect(rLow.raw).toBe("LOW");

    const simActiveHigh = new SensorSimulator("ACTIVE_HIGH");
    const rHigh = simActiveHigh.readSensor(maze, pos, "NORTH", "FRONT");
    expect(rHigh.state).toBe("BLOCKED");
    expect(rHigh.raw).toBe("HIGH");
  });
});

