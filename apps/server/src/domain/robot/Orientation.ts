import { Direction, RelativeDirection } from "@maze/shared";

export class Orientation {
  public static readonly DIRECTIONS: Direction[] = ["NORTH", "EAST", "SOUTH", "WEST"];

  public static turnLeft(dir: Direction): Direction {
    switch (dir) {
      case "NORTH": return "WEST";
      case "WEST": return "SOUTH";
      case "SOUTH": return "EAST";
      case "EAST": return "NORTH";
    }
  }

  public static turnRight(dir: Direction): Direction {
    switch (dir) {
      case "NORTH": return "EAST";
      case "EAST": return "SOUTH";
      case "SOUTH": return "WEST";
      case "WEST": return "NORTH";
    }
  }

  public static turnAround(dir: Direction): Direction {
    switch (dir) {
      case "NORTH": return "SOUTH";
      case "SOUTH": return "NORTH";
      case "EAST": return "WEST";
      case "WEST": return "EAST";
    }
  }

  /**
   * Maps a relative sensor position (LEFT, FRONT, RIGHT) to an absolute maze direction
   * based on the robot's current facing direction.
   */
  public static relativeToAbsolute(
    facing: Direction,
    relative: RelativeDirection
  ): Direction {
    switch (relative) {
      case "FRONT":
        return facing;
      case "LEFT":
        return this.turnLeft(facing);
      case "RIGHT":
        return this.turnRight(facing);
    }
  }

  /**
   * Determine relative orientation of target absolute direction from current facing direction.
   */
  public static absoluteToRelative(
    facing: Direction,
    target: Direction
  ): RelativeDirection | "BEHIND" {
    if (target === facing) return "FRONT";
    if (target === this.turnLeft(facing)) return "LEFT";
    if (target === this.turnRight(facing)) return "RIGHT";
    return "BEHIND";
  }

  public static getStepVector(dir: Direction): { dRow: number; dCol: number } {
    switch (dir) {
      case "NORTH": return { dRow: -1, dCol: 0 };
      case "SOUTH": return { dRow: 1, dCol: 0 };
      case "EAST": return { dRow: 0, dCol: 1 };
      case "WEST": return { dRow: 0, dCol: -1 };
    }
  }
}

