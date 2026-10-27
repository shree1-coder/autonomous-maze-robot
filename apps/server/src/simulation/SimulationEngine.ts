import {
  CellPosition,
  Direction,
  ExplorationStrategy,
  GroundTruthMaze,
  MazeConfig,
  MovementAction,
  RelativeDirection,
  RobotMode,
  RobotSensors,
  RobotState,
  SimulationConfig,
  SimulationState,
  SimulationStats,
  WallState,
} from "@maze/shared";
import { Maze } from "../domain/maze/Maze.js";
import { KnowledgeMap } from "../domain/mapping/KnowledgeMap.js";
import { Orientation } from "../domain/robot/Orientation.js";
import { SensorSimulator } from "./SensorSimulator.js";
import {
  IExplorationStrategy,
  SystematicExplorationStrategy,
  WallFollowerStrategy,
} from "../domain/exploration/ExplorationStrategy.js";
import { BfsPathfinder } from "../domain/pathfinding/BfsPathfinder.js";
import { SimulatedRobotAdapter } from "../adapters/SimulatedRobotAdapter.js";

export type SimulationCallback = (state: SimulationState) => void;
export type CompletionCallback = (payload: { success: boolean; reason: string; stats: SimulationStats }) => void;

export class SimulationEngine {
  private groundTruthMaze: Maze;
  private knowledgeMap: KnowledgeMap;
  private sensorSimulator: SensorSimulator;
  private robotAdapter: SimulatedRobotAdapter;

  private robotState: RobotState;
  private config: SimulationConfig;
  private stats: SimulationStats;

  private isRunning: boolean = false;
  private isPaused: boolean = false;
  private timer: NodeJS.Timeout | null = null;

  private stateHistory: Set<string> = new Set();
  private positionHistory: CellPosition[] = [];
  private logs: Array<{ id: string; timestamp: number; message: string; type: "info" | "warn" | "error" | "success" }> = [];

  private currentPath: CellPosition[] | null = null;
  private plannedActions: MovementAction[] | null = null;
  private pathActionIndex: number = 0;

  private strategyInstance: IExplorationStrategy;
  private onStateChange?: SimulationCallback;
  private onCompletion?: CompletionCallback;

  constructor(
    mazeConfig?: MazeConfig,
    groundTruth?: GroundTruthMaze,
    initialConfig?: Partial<SimulationConfig>
  ) {
    this.groundTruthMaze = groundTruth
      ? Maze.fromJson(groundTruth as any)
      : mazeConfig
      ? new Maze(mazeConfig)
      : Maze.createDefault(10, 10);

    const cfg = this.groundTruthMaze.getConfig();

    this.knowledgeMap = new KnowledgeMap(cfg.rows, cfg.cols);
    this.sensorSimulator = new SensorSimulator("ACTIVE_LOW");
    this.robotAdapter = new SimulatedRobotAdapter();

    this.config = {
      speed: "NORMAL",
      stepDelayMs: 250,
      maxSteps: 1000,
      strategy: "SYSTEMATIC",
      ...initialConfig,
    };

    this.robotState = {
      position: { ...cfg.start },
      orientation: cfg.initialDirection,
      mode: "IDLE",
      statusMessage: "Ready to explore",
    };

    this.stats = {
      steps: 0,
      movements: 0,
      turns: 0,
      exploredCellsCount: 0,
      totalCells: cfg.rows * cfg.cols,
      explorationPercentage: 0,
      knownWallsCount: 0,
      unknownWallsCount: 0,
      deadEndsCount: 0,
      elapsedTimeMs: 0,
      goalReached: false,
    };

    this.strategyInstance = this.createStrategy(this.config.strategy);
    this.addLog("Simulation engine initialized", "info");
    this.initializeStartCell();
  }

  public setCallbacks(onState: SimulationCallback, onComplete: CompletionCallback): void {
    this.onStateChange = onState;
    this.onCompletion = onComplete;
  }

  private createStrategy(strat: ExplorationStrategy): IExplorationStrategy {
    switch (strat) {
      case "WALL_FOLLOWER_LEFT":
        return new WallFollowerStrategy("LEFT");
      case "WALL_FOLLOWER_RIGHT":
        return new WallFollowerStrategy("RIGHT");
      case "SYSTEMATIC":
      default:
        return new SystematicExplorationStrategy();
    }
  }

  public setStrategy(strat: ExplorationStrategy): void {
    this.config.strategy = strat;
    this.strategyInstance = this.createStrategy(strat);
    this.addLog(`Exploration strategy changed to ${strat}`, "info");
  }

  public setSpeed(speed: "SLOW" | "NORMAL" | "FAST" | "MAX", stepDelayMs?: number): void {
    this.config.speed = speed;
    if (stepDelayMs !== undefined) {
      this.config.stepDelayMs = stepDelayMs;
    } else {
      switch (speed) {
        case "SLOW": this.config.stepDelayMs = 600; break;
        case "NORMAL": this.config.stepDelayMs = 250; break;
        case "FAST": this.config.stepDelayMs = 80; break;
        case "MAX": this.config.stepDelayMs = 15; break;
      }
    }
    // If currently running, reset interval
    if (this.isRunning && !this.isPaused) {
      this.scheduleLoop();
    }
  }

  public setSensorPolarity(polarity: "ACTIVE_LOW" | "ACTIVE_HIGH"): void {
    this.sensorSimulator.setPolarity(polarity);
    this.addLog(`Sensor polarity set to ${polarity}`, "info");
  }

  public resetMaze(maze: Maze): void {
    this.stop();
    this.groundTruthMaze = maze;
    const cfg = maze.getConfig();
    this.knowledgeMap = new KnowledgeMap(cfg.rows, cfg.cols);
    this.robotState = {
      position: { ...cfg.start },
      orientation: cfg.initialDirection,
      mode: "IDLE",
      statusMessage: "Maze updated",
    };
    this.stats = {
      steps: 0,
      movements: 0,
      turns: 0,
      exploredCellsCount: 0,
      totalCells: cfg.rows * cfg.cols,
      explorationPercentage: 0,
      knownWallsCount: 0,
      unknownWallsCount: 0,
      deadEndsCount: 0,
      elapsedTimeMs: 0,
      goalReached: false,
    };
    this.stateHistory.clear();
    this.positionHistory = [];
    this.currentPath = null;
    this.plannedActions = null;
    this.pathActionIndex = 0;
    this.strategyInstance = this.createStrategy(this.config.strategy);
    this.initializeStartCell();
    this.emitState();
  }

  private initializeStartCell(): void {
    this.knowledgeMap.markVisited(this.robotState.position);
    this.observeAndMap();
    this.updateStats();
  }

  /**
   * Reads sensors and updates knowledge map.
   */
  public observeAndMap(): RobotSensors {
    const sensors = this.sensorSimulator.readAll(
      this.groundTruthMaze,
      this.robotState.position,
      this.robotState.orientation
    );
    this.robotAdapter.setSensors(sensors);

    // Update KnowledgeMap from relative sensor readings
    const relativePairs: { rel: RelativeDirection; sensorState: WallState }[] = [
      { rel: "FRONT", sensorState: sensors.front.state === "BLOCKED" ? "WALL" : "OPEN" },
      { rel: "LEFT", sensorState: sensors.left.state === "BLOCKED" ? "WALL" : "OPEN" },
      { rel: "RIGHT", sensorState: sensors.right.state === "BLOCKED" ? "WALL" : "OPEN" },
    ];

    for (const pair of relativePairs) {
      const absDir = Orientation.relativeToAbsolute(this.robotState.orientation, pair.rel);
      this.knowledgeMap.setWall(this.robotState.position, absDir, pair.sensorState);
    }

    return sensors;
  }

  /**
   * Performs a single simulation cycle.
   */
  public step(): boolean {
    if (this.robotState.mode === "GOAL_REACHED" || this.robotState.mode === "FAULT") {
      this.stop();
      return false;
    }

    const startTime = Date.now();
    this.stats.steps++;

    // Step 1 & 2: Observe
    const sensors = this.observeAndMap();

    // Check goal arrival
    const cfg = this.groundTruthMaze.getConfig();
    if (
      this.robotState.position.row === cfg.goal.row &&
      this.robotState.position.col === cfg.goal.col
    ) {
      this.robotState.mode = "GOAL_REACHED";
      this.robotState.statusMessage = "Goal cell reached successfully!";
      this.stats.goalReached = true;
      this.addLog("Goal cell reached!", "success");
      this.stop();
      this.emitState();
      this.onCompletion?.({ success: true, reason: "Goal reached", stats: this.stats });
      return false;
    }

    // Step limit check
    if (this.stats.steps >= this.config.maxSteps) {
      this.robotState.mode = "FAULT";
      this.robotState.statusMessage = "Step limit reached without arriving at goal";
      this.addLog(`Simulation aborted: exceeded maximum ${this.config.maxSteps} steps`, "error");
      this.stop();
      this.emitState();
      this.onCompletion?.({ success: false, reason: "Max steps exceeded", stats: this.stats });
      return false;
    }

    // Check path execution mode
    if (this.robotState.mode === "FOLLOWING_PATH" || this.robotState.mode === "SOLVING") {
      return this.stepPathExecution();
    }

    // Loop / Repeated State Detection for exploration
    const stateKey = `${this.robotState.position.row},${this.robotState.position.col},${this.robotState.orientation}`;
    if (this.config.strategy !== "SYSTEMATIC") {
      // For simple wall followers, detect cycling loops
      if (this.stateHistory.has(stateKey) && this.stats.steps > 15) {
        // If visited multiple times in exact same state
        const visitCount = this.positionHistory.filter(
          (p) => p.row === this.robotState.position.row && p.col === this.robotState.position.col
        ).length;
        if (visitCount > 8) {
          this.robotState.mode = "FAULT";
          this.robotState.statusMessage = "Wall follower loop detected; switching to systematic mode recommended";
          this.addLog("Loop detected in wall follower; stopping exploration", "warn");
          this.stop();
          this.emitState();
          this.onCompletion?.({ success: false, reason: "Loop detected", stats: this.stats });
          return false;
        }
      }
    }
    this.stateHistory.add(stateKey);
    this.positionHistory.push({ ...this.robotState.position });

    // Step 5: Choose next action using purely knowledge map + sensor readings
    const decision = this.strategyInstance.chooseNextAction(
      this.robotState.position,
      this.robotState.orientation,
      sensors,
      this.knowledgeMap,
      cfg.goal,
      this.positionHistory
    );

    // Step 6 & 7 & 8: Execute movement
    const success = this.applyAction(decision.action);
    if (!success) {
      this.robotState.mode = "FAULT";
      this.robotState.statusMessage = `Invalid movement: blocked by wall (${decision.action})`;
      this.addLog(`Collision error: cannot execute ${decision.action}`, "error");
      this.stop();
      this.emitState();
      this.onCompletion?.({ success: false, reason: "Collision", stats: this.stats });
      return false;
    }

    this.robotState.statusMessage = decision.reason;
    this.updateStats();
    this.emitState();
    return true;
  }

  private stepPathExecution(): boolean {
    if (!this.plannedActions || this.pathActionIndex >= this.plannedActions.length) {
      const cfg = this.groundTruthMaze.getConfig();
      if (
        this.robotState.position.row === cfg.goal.row &&
        this.robotState.position.col === cfg.goal.col
      ) {
        this.robotState.mode = "GOAL_REACHED";
        this.robotState.statusMessage = "Path execution complete! Goal reached.";
        this.stats.goalReached = true;
        this.addLog("Path execution finished at goal cell!", "success");
        this.stop();
        this.emitState();
        this.onCompletion?.({ success: true, reason: "Path completed", stats: this.stats });
        return false;
      }
      this.robotState.mode = "IDLE";
      this.robotState.statusMessage = "Path execution finished";
      this.stop();
      this.emitState();
      return false;
    }

    const action = this.plannedActions[this.pathActionIndex++];
    this.robotState.pathIndex = this.pathActionIndex;

    const success = this.applyAction(action);
    if (!success) {
      this.robotState.mode = "FAULT";
      this.robotState.statusMessage = `Collision on path action: ${action}`;
      this.addLog(`Path execution failed: wall detected on move`, "error");
      this.stop();
      this.emitState();
      return false;
    }

    // Observe newly discovered walls on the way
    this.observeAndMap();
    this.updateStats();
    this.emitState();
    return true;
  }

  private applyAction(action: MovementAction): boolean {
    switch (action) {
      case "TURN_LEFT":
        this.robotState.orientation = Orientation.turnLeft(this.robotState.orientation);
        this.stats.turns++;
        this.robotAdapter.executeAction("TURN_LEFT");
        return true;

      case "TURN_RIGHT":
        this.robotState.orientation = Orientation.turnRight(this.robotState.orientation);
        this.stats.turns++;
        this.robotAdapter.executeAction("TURN_RIGHT");
        return true;

      case "FORWARD": {
        // Check for wall in ground-truth maze
        if (this.groundTruthMaze.hasWall(this.robotState.position, this.robotState.orientation)) {
          return false; // Physical collision!
        }
        const vec = Orientation.getStepVector(this.robotState.orientation);
        const nextPos: CellPosition = {
          row: this.robotState.position.row + vec.dRow,
          col: this.robotState.position.col + vec.dCol,
        };
        if (!this.groundTruthMaze.isWithinBounds(nextPos)) {
          return false;
        }

        this.robotState.position = nextPos;
        this.knowledgeMap.markVisited(nextPos);
        this.stats.movements++;
        this.robotAdapter.executeAction("FORWARD");
        return true;
      }

      case "REVERSE": {
        const backDir = Orientation.turnAround(this.robotState.orientation);
        if (this.groundTruthMaze.hasWall(this.robotState.position, backDir)) {
          return false;
        }
        const vec = Orientation.getStepVector(backDir);
        const nextPos: CellPosition = {
          row: this.robotState.position.row + vec.dRow,
          col: this.robotState.position.col + vec.dCol,
        };
        if (!this.groundTruthMaze.isWithinBounds(nextPos)) return false;

        this.robotState.position = nextPos;
        this.knowledgeMap.markVisited(nextPos);
        this.stats.movements++;
        this.robotAdapter.executeAction("REVERSE");
        return true;
      }

      case "STOP":
        this.robotAdapter.executeAction("STOP");
        return true;
    }
  }

  public start(): void {
    if (this.isRunning && !this.isPaused) return;

    this.isRunning = true;
    this.isPaused = false;
    this.robotState.mode = "EXPLORING";
    this.robotState.statusMessage = "Exploring maze...";
    this.addLog("Simulation started", "info");
    this.scheduleLoop();
    this.emitState();
  }

  public pause(): void {
    if (!this.isRunning || this.isPaused) return;
    this.isPaused = true;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.robotState.mode = "PAUSED";
    this.robotState.statusMessage = "Simulation paused";
    this.addLog("Simulation paused", "info");
    this.emitState();
  }

  public resume(): void {
    if (!this.isRunning || !this.isPaused) return;
    this.isPaused = false;
    this.robotState.mode = "EXPLORING";
    this.robotState.statusMessage = "Simulation resumed";
    this.addLog("Simulation resumed", "info");
    this.scheduleLoop();
    this.emitState();
  }

  public stop(): void {
    this.isRunning = false;
    this.isPaused = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.robotAdapter.stop();
    if (this.robotState.mode !== "GOAL_REACHED" && this.robotState.mode !== "FAULT") {
      this.robotState.mode = "IDLE";
      this.robotState.statusMessage = "Simulation stopped";
    }
    this.emitState();
  }

  public reset(): void {
    this.stop();
    const cfg = this.groundTruthMaze.getConfig();
    this.knowledgeMap = new KnowledgeMap(cfg.rows, cfg.cols);
    this.robotState = {
      position: { ...cfg.start },
      orientation: cfg.initialDirection,
      mode: "IDLE",
      statusMessage: "Reset to initial state",
    };
    this.stats = {
      steps: 0,
      movements: 0,
      turns: 0,
      exploredCellsCount: 0,
      totalCells: cfg.rows * cfg.cols,
      explorationPercentage: 0,
      knownWallsCount: 0,
      unknownWallsCount: 0,
      deadEndsCount: 0,
      elapsedTimeMs: 0,
      goalReached: false,
    };
    this.stateHistory.clear();
    this.positionHistory = [];
    this.currentPath = null;
    this.plannedActions = null;
    this.pathActionIndex = 0;
    this.strategyInstance = this.createStrategy(this.config.strategy);
    this.addLog("Simulation reset", "info");
    this.initializeStartCell();
    this.emitState();
  }

  public calculateBfsPath(): { found: boolean; path: CellPosition[]; actions: MovementAction[]; message: string } {
    const cfg = this.groundTruthMaze.getConfig();
    const result = BfsPathfinder.findPath(
      this.knowledgeMap,
      this.robotState.position,
      cfg.goal,
      this.robotState.orientation
    );

    if (result.found) {
      this.currentPath = result.path;
      this.plannedActions = result.actions;
      this.pathActionIndex = 0;
      this.addLog(
        `Shortest path found: ${result.cellMoves} moves, ${result.turns} turns`,
        "success"
      );
      this.emitState();
      return {
        found: true,
        path: result.path,
        actions: result.actions,
        message: `Shortest path: ${result.cellMoves} moves, ${result.turns} turns`,
      };
    } else {
      this.currentPath = null;
      this.plannedActions = null;
      this.addLog(result.unreachableReason || "Goal unreachable in known map", "warn");
      this.emitState();
      return {
        found: false,
        path: [],
        actions: [],
        message: result.unreachableReason || "Goal unreachable in currently known map",
      };
    }
  }

  public executePlannedPath(): boolean {
    if (!this.currentPath || !this.plannedActions || this.plannedActions.length === 0) {
      const calc = this.calculateBfsPath();
      if (!calc.found) return false;
    }

    this.stop();
    this.isRunning = true;
    this.isPaused = false;
    this.robotState.mode = "FOLLOWING_PATH";
    this.robotState.statusMessage = "Executing calculated shortest path";
    this.addLog("Executing shortest path...", "info");
    this.scheduleLoop();
    this.emitState();
    return true;
  }

  private scheduleLoop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(() => {
      const shouldContinue = this.step();
      if (!shouldContinue && this.timer) {
        clearInterval(this.timer);
        this.timer = null;
      }
    }, this.config.stepDelayMs);
  }

  private updateStats(): void {
    const kStats = this.knowledgeMap.getStats();
    this.stats.exploredCellsCount = kStats.fullyExploredCount;
    this.stats.explorationPercentage = kStats.explorationPercentage;
    this.stats.knownWallsCount = kStats.knownWallsCount;
    this.stats.unknownWallsCount = kStats.unknownWallsCount;
    this.stats.deadEndsCount = kStats.deadEndsCount;
  }

  private addLog(message: string, type: "info" | "warn" | "error" | "success" = "info"): void {
    this.logs.unshift({
      id: Math.random().toString(36).substring(2, 9),
      timestamp: Date.now(),
      message,
      type,
    });
    if (this.logs.length > 50) this.logs.pop();
  }

  public getState(): SimulationState {
    const sensors = this.sensorSimulator.readAll(
      this.groundTruthMaze,
      this.robotState.position,
      this.robotState.orientation
    );

    return {
      robot: { ...this.robotState },
      mazeConfig: this.groundTruthMaze.getConfig(),
      groundTruth: this.groundTruthMaze.toGroundTruth(),
      knowledgeMap: this.knowledgeMap.to2DArray(),
      sensors,
      stats: { ...this.stats },
      currentPath: this.currentPath,
      plannedActions: this.plannedActions,
      isRunning: this.isRunning,
      isPaused: this.isPaused,
      activeStrategy: this.config.strategy,
      recentLogs: [...this.logs],
    };
  }

  public emitState(): void {
    const state = this.getState();
    this.onStateChange?.(state);
  }

  public getGroundTruthMaze(): Maze {
    return this.groundTruthMaze;
  }

  public getKnowledgeMap(): KnowledgeMap {
    return this.knowledgeMap;
  }

  public getRobotAdapter(): SimulatedRobotAdapter {
    return this.robotAdapter;
  }
}

