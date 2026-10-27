import {
  CellPosition,
  Direction,
  GroundTruthMaze,
  MazeConfig,
  MazeExportFormat,
  WallState,
} from "@maze/shared";

export class Maze {
  private config: MazeConfig;
  private horizontalWalls: boolean[][]; // (rows + 1) x cols
  private verticalWalls: boolean[][];   // rows x (cols + 1)

  constructor(
    config: MazeConfig,
    horizontalWalls?: boolean[][],
    verticalWalls?: boolean[][]
  ) {
    this.config = { ...config };
    const { rows, cols } = config;

    if (horizontalWalls) {
      this.horizontalWalls = horizontalWalls.map((r) => [...r]);
    } else {
      this.horizontalWalls = Array.from({ length: rows + 1 }, (_, r) =>
        Array.from({ length: cols }, () => r === 0 || r === rows)
      );
    }

    if (verticalWalls) {
      this.verticalWalls = verticalWalls.map((r) => [...r]);
    } else {
      this.verticalWalls = Array.from({ length: rows }, () =>
        Array.from({ length: cols + 1 }, (_, c) => c === 0 || c === cols)
      );
    }

    this.ensurePerimeterWalls();
  }

  public static createDefault(rows = 10, cols = 10): Maze {
    const config: MazeConfig = {
      rows,
      cols,
      start: { row: rows - 1, col: 0 },
      goal: { row: 0, col: cols - 1 },
      initialDirection: "NORTH",
      name: "Default Maze",
    };
    return new Maze(config);
  }

  public getConfig(): MazeConfig {
    return { ...this.config };
  }

  public setConfig(config: Partial<MazeConfig>): void {
    if (config.rows !== undefined || config.cols !== undefined) {
      const newRows = config.rows ?? this.config.rows;
      const newCols = config.cols ?? this.config.cols;
      this.resize(newRows, newCols);
    }
    if (config.start) this.config.start = { ...config.start };
    if (config.goal) this.config.goal = { ...config.goal };
    if (config.initialDirection) this.config.initialDirection = config.initialDirection;
    if (config.name !== undefined) this.config.name = config.name;
  }

  private resize(newRows: number, newCols: number): void {
    const newHorizontal: boolean[][] = Array.from({ length: newRows + 1 }, (_, r) =>
      Array.from({ length: newCols }, (_, c) => {
        if (r === 0 || r === newRows) return true;
        if (r < this.horizontalWalls.length && c < (this.horizontalWalls[r]?.length ?? 0)) {
          return this.horizontalWalls[r][c];
        }
        return false;
      })
    );

    const newVertical: boolean[][] = Array.from({ length: newRows }, (_, r) =>
      Array.from({ length: newCols + 1 }, (_, c) => {
        if (c === 0 || c === newCols) return true;
        if (r < this.verticalWalls.length && c < (this.verticalWalls[r]?.length ?? 0)) {
          return this.verticalWalls[r][c];
        }
        return false;
      })
    );

    this.horizontalWalls = newHorizontal;
    this.verticalWalls = newVertical;
    this.config.rows = newRows;
    this.config.cols = newCols;

    // Adjust start & goal if outside bounds
    if (this.config.start.row >= newRows) this.config.start.row = newRows - 1;
    if (this.config.start.col >= newCols) this.config.start.col = newCols - 1;
    if (this.config.goal.row >= newRows) this.config.goal.row = 0;
    if (this.config.goal.col >= newCols) this.config.goal.col = newCols - 1;

    this.ensurePerimeterWalls();
  }

  private ensurePerimeterWalls(): void {
    const { rows, cols } = this.config;
    for (let c = 0; c < cols; c++) {
      this.horizontalWalls[0][c] = true;
      this.horizontalWalls[rows][c] = true;
    }
    for (let r = 0; r < rows; r++) {
      this.verticalWalls[r][0] = true;
      this.verticalWalls[r][cols] = true;
    }
  }

  public isWithinBounds(pos: CellPosition): boolean {
    return (
      pos.row >= 0 &&
      pos.row < this.config.rows &&
      pos.col >= 0 &&
      pos.col < this.config.cols
    );
  }

  public hasWall(pos: CellPosition, direction: Direction): boolean {
    if (!this.isWithinBounds(pos)) return true;
    switch (direction) {
      case "NORTH":
        return this.horizontalWalls[pos.row][pos.col];
      case "SOUTH":
        return this.horizontalWalls[pos.row + 1][pos.col];
      case "WEST":
        return this.verticalWalls[pos.row][pos.col];
      case "EAST":
        return this.verticalWalls[pos.row][pos.col + 1];
    }
  }

  public setWall(pos: CellPosition, direction: Direction, exists: boolean): void {
    if (!this.isWithinBounds(pos)) return;
    const { rows, cols } = this.config;

    switch (direction) {
      case "NORTH":
        if (pos.row > 0) this.horizontalWalls[pos.row][pos.col] = exists;
        break;
      case "SOUTH":
        if (pos.row < rows - 1) this.horizontalWalls[pos.row + 1][pos.col] = exists;
        break;
      case "WEST":
        if (pos.col > 0) this.verticalWalls[pos.row][pos.col] = exists;
        break;
      case "EAST":
        if (pos.col < cols - 1) this.verticalWalls[pos.row][pos.col + 1] = exists;
        break;
    }
  }

  public toggleWall(type: "horizontal" | "vertical", row: number, col: number): boolean {
    const { rows, cols } = this.config;
    if (type === "horizontal") {
      // Cannot toggle outer boundary
      if (row <= 0 || row >= rows || col < 0 || col >= cols) return false;
      this.horizontalWalls[row][col] = !this.horizontalWalls[row][col];
      return true;
    } else {
      // Cannot toggle outer boundary
      if (col <= 0 || col >= cols || row < 0 || row >= rows) return false;
      this.verticalWalls[row][col] = !this.verticalWalls[row][col];
      return true;
    }
  }

  public clearInteriorWalls(): void {
    const { rows, cols } = this.config;
    for (let r = 1; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        this.horizontalWalls[r][c] = false;
      }
    }
    for (let r = 0; r < rows; r++) {
      for (let c = 1; c < cols; c++) {
        this.verticalWalls[r][c] = false;
      }
    }
  }

  public getNeighbor(pos: CellPosition, direction: Direction): CellPosition | null {
    if (this.hasWall(pos, direction)) return null;
    let next: CellPosition;
    switch (direction) {
      case "NORTH":
        next = { row: pos.row - 1, col: pos.col };
        break;
      case "SOUTH":
        next = { row: pos.row + 1, col: pos.col };
        break;
      case "WEST":
        next = { row: pos.row, col: pos.col - 1 };
        break;
      case "EAST":
        next = { row: pos.row, col: pos.col + 1 };
        break;
    }
    return this.isWithinBounds(next) ? next : null;
  }

  public static getOppositeDirection(dir: Direction): Direction {
    switch (dir) {
      case "NORTH": return "SOUTH";
      case "SOUTH": return "NORTH";
      case "EAST": return "WEST";
      case "WEST": return "EAST";
    }
  }

  public toGroundTruth(): GroundTruthMaze {
    return {
      config: { ...this.config },
      horizontalWalls: this.horizontalWalls.map((r) => [...r]),
      verticalWalls: this.verticalWalls.map((r) => [...r]),
    };
  }

  public exportJson(): MazeExportFormat {
    return {
      version: 1,
      config: { ...this.config },
      horizontalWalls: this.horizontalWalls.map((r) => [...r]),
      verticalWalls: this.verticalWalls.map((r) => [...r]),
      createdAt: new Date().toISOString(),
      description: `Autonomous Maze ${this.config.rows}x${this.config.cols}`,
    };
  }

  public static fromJson(data: MazeExportFormat): Maze {
    return new Maze(data.config, data.horizontalWalls, data.verticalWalls);
  }
}

