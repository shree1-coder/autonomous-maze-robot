import {
  MazeConfig,
  MazeExportFormat,
  ToggleWallSchema,
} from "@maze/shared";
import { Maze } from "../domain/maze/Maze.js";
import { simulationService } from "./SimulationService.js";
import { PRESETS } from "../domain/maze/presets.js";

export class MazeService {
  public getCurrentMaze(): Maze {
    return simulationService.getEngine().getGroundTruthMaze();
  }

  public updateConfig(config: Partial<MazeConfig>): Maze {
    const current = this.getCurrentMaze();
    current.setConfig(config);
    simulationService.loadMaze(current);
    return current;
  }

  public toggleWall(type: "horizontal" | "vertical", row: number, col: number): boolean {
    const current = this.getCurrentMaze();
    const changed = current.toggleWall(type, row, col);
    if (changed) {
      simulationService.loadMaze(current);
    }
    return changed;
  }

  public clearWalls(): void {
    const current = this.getCurrentMaze();
    current.clearInteriorWalls();
    simulationService.loadMaze(current);
  }

  public exportJson(): MazeExportFormat {
    return this.getCurrentMaze().exportJson();
  }

  public importJson(data: MazeExportFormat): Maze {
    const maze = Maze.fromJson(data);
    simulationService.loadMaze(maze);
    return maze;
  }

  public getPresets(): string[] {
    return Object.keys(PRESETS);
  }

  public loadPreset(name: string): boolean {
    return simulationService.loadPreset(name);
  }
}

export const mazeService = new MazeService();

