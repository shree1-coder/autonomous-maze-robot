import {
  ExplorationStrategy,
  GroundTruthMaze,
  MazeConfig,
  MazeExportFormat,
  SimulationState,
} from "@maze/shared";
import { Maze } from "../domain/maze/Maze.js";
import { SimulationEngine } from "../simulation/SimulationEngine.js";
import { PRESETS } from "../domain/maze/presets.js";

export class SimulationService {
  private engine: SimulationEngine;
  private subscribers: Array<(state: SimulationState) => void> = [];

  constructor() {
    const defaultMaze = Maze.createDefault(10, 10);
    this.engine = new SimulationEngine(defaultMaze.getConfig(), defaultMaze.toGroundTruth());
    this.engine.setCallbacks(
      (state) => this.notifySubscribers(state),
      () => {}
    );
  }

  public subscribe(cb: (state: SimulationState) => void): () => void {
    this.subscribers.push(cb);
    return () => {
      this.subscribers = this.subscribers.filter((s) => s !== cb);
    };
  }

  private notifySubscribers(state: SimulationState): void {
    for (const sub of this.subscribers) {
      try {
        sub(state);
      } catch (err) {
        console.error("Subscriber notification error", err);
      }
    }
  }

  public getEngine(): SimulationEngine {
    return this.engine;
  }

  public getState(): SimulationState {
    return this.engine.getState();
  }

  public start(): void {
    this.engine.start();
  }

  public pause(): void {
    this.engine.pause();
  }

  public resume(): void {
    this.engine.resume();
  }

  public step(): boolean {
    return this.engine.step();
  }

  public stop(): void {
    this.engine.stop();
  }

  public reset(): void {
    this.engine.reset();
  }

  public setSpeed(speed: "SLOW" | "NORMAL" | "FAST" | "MAX", stepDelayMs?: number): void {
    this.engine.setSpeed(speed, stepDelayMs);
  }

  public setStrategy(strategy: ExplorationStrategy): void {
    this.engine.setStrategy(strategy);
  }

  public setSensorPolarity(polarity: "ACTIVE_LOW" | "ACTIVE_HIGH"): void {
    this.engine.setSensorPolarity(polarity);
  }

  public loadMaze(maze: Maze): void {
    this.engine.resetMaze(maze);
  }

  public loadPreset(name: string): boolean {
    const presetFn = PRESETS[name];
    if (!presetFn) return false;
    const json = presetFn();
    const maze = Maze.fromJson(json);
    this.loadMaze(maze);
    return true;
  }

  public calculatePath(): { found: boolean; path: any[]; actions: any[]; message: string } {
    return this.engine.calculateBfsPath();
  }

  public followPath(): boolean {
    return this.engine.executePlannedPath();
  }
}

export const simulationService = new SimulationService();

