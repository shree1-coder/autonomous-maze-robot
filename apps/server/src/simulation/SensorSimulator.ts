import {
  CellPosition,
  DigitalReading,
  Direction,
  ObstacleState,
  RelativeDirection,
  RobotSensors,
  SensorPolarity,
  SensorReading,
} from "@maze/shared";
import { Maze } from "../domain/maze/Maze.js";
import { Orientation } from "../domain/robot/Orientation.js";

export class SensorSimulator {
  private polarity: SensorPolarity;

  constructor(polarity: SensorPolarity = "ACTIVE_LOW") {
    this.polarity = polarity;
  }

  public setPolarity(polarity: SensorPolarity): void {
    this.polarity = polarity;
  }

  public getPolarity(): SensorPolarity {
    return this.polarity;
  }

  /**
   * Reads a single simulated sensor against the ground-truth maze.
   */
  public readSensor(
    maze: Maze,
    pos: CellPosition,
    facing: Direction,
    relative: RelativeDirection
  ): SensorReading {
    const absDir = Orientation.relativeToAbsolute(facing, relative);
    const hasObstacle = maze.hasWall(pos, absDir);
    const state: ObstacleState = hasObstacle ? "BLOCKED" : "CLEAR";

    let raw: DigitalReading;
    if (this.polarity === "ACTIVE_LOW") {
      // ACTIVE_LOW: BLOCKED -> LOW, CLEAR -> HIGH
      raw = hasObstacle ? "LOW" : "HIGH";
    } else {
      // ACTIVE_HIGH: BLOCKED -> HIGH, CLEAR -> LOW
      raw = hasObstacle ? "HIGH" : "LOW";
    }

    return {
      raw,
      state,
      timestamp: Date.now(),
      stale: false,
      error: false,
    };
  }

  /**
   * Generates readings for all three digital IR sensors.
   */
  public readAll(
    maze: Maze,
    pos: CellPosition,
    facing: Direction
  ): RobotSensors {
    return {
      left: this.readSensor(maze, pos, facing, "LEFT"),
      front: this.readSensor(maze, pos, facing, "FRONT"),
      right: this.readSensor(maze, pos, facing, "RIGHT"),
    };
  }
}

