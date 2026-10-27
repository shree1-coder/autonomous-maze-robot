import {
  CellKnowledge,
  CellPosition,
  Direction,
  WallState,
} from "@maze/shared";

export class KnowledgeMap {
  private rows: number;
  private cols: number;
  // Canonical knowledge edges:
  // horizontalWalls: (rows + 1) x cols
  // verticalWalls: rows x (cols + 1)
  private horizontalWalls: WallState[][];
  private verticalWalls: WallState[][];
  private visitedMatrix: boolean[][];

  constructor(rows: number, cols: number) {
    this.rows = rows;
    this.cols = cols;

    // Initialize horizontal walls: outer boundary is WALL, interior is UNKNOWN
    this.horizontalWalls = Array.from({ length: rows + 1 }, (_, r) =>
      Array.from({ length: cols }, () => (r === 0 || r === rows ? "WALL" : "UNKNOWN"))
    );

    // Initialize vertical walls: outer boundary is WALL, interior is UNKNOWN
    this.verticalWalls = Array.from({ length: rows }, () =>
      Array.from({ length: cols + 1 }, (_, c) => (c === 0 || c === cols ? "WALL" : "UNKNOWN"))
    );

    this.visitedMatrix = Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => false)
    );
  }

  public getRows(): number {
    return this.rows;
  }

  public getCols(): number {
    return this.cols;
  }

  public isWithinBounds(pos: CellPosition): boolean {
    return pos.row >= 0 && pos.row < this.rows && pos.col >= 0 && pos.col < this.cols;
  }

  public getWall(pos: CellPosition, direction: Direction): WallState {
    if (!this.isWithinBounds(pos)) return "WALL";
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

  public setWall(pos: CellPosition, direction: Direction, state: WallState): void {
    if (!this.isWithinBounds(pos)) return;
    switch (direction) {
      case "NORTH":
        // Perimeter wall remains WALL
        if (pos.row > 0) this.horizontalWalls[pos.row][pos.col] = state;
        break;
      case "SOUTH":
        if (pos.row < this.rows - 1) this.horizontalWalls[pos.row + 1][pos.col] = state;
        break;
      case "WEST":
        if (pos.col > 0) this.verticalWalls[pos.row][pos.col] = state;
        break;
      case "EAST":
        if (pos.col < this.cols - 1) this.verticalWalls[pos.row][pos.col + 1] = state;
        break;
    }
  }

  public markVisited(pos: CellPosition): void {
    if (this.isWithinBounds(pos)) {
      this.visitedMatrix[pos.row][pos.col] = true;
    }
  }

  public isVisited(pos: CellPosition): boolean {
    if (!this.isWithinBounds(pos)) return false;
    return this.visitedMatrix[pos.row][pos.col];
  }

  public isFullyExplored(pos: CellPosition): boolean {
    if (!this.isWithinBounds(pos)) return false;
    const n = this.getWall(pos, "NORTH");
    const e = this.getWall(pos, "EAST");
    const s = this.getWall(pos, "SOUTH");
    const w = this.getWall(pos, "WEST");
    return n !== "UNKNOWN" && e !== "UNKNOWN" && s !== "UNKNOWN" && w !== "UNKNOWN";
  }

  public isDeadEnd(pos: CellPosition): boolean {
    if (!this.isWithinBounds(pos)) return false;
    const walls = [
      this.getWall(pos, "NORTH"),
      this.getWall(pos, "EAST"),
      this.getWall(pos, "SOUTH"),
      this.getWall(pos, "WEST"),
    ];
    // If exactly 3 walls are WALL and the 4th is OPEN or UNKNOWN
    const wallCount = walls.filter((w) => w === "WALL").length;
    return wallCount >= 3;
  }

  public getCellKnowledge(pos: CellPosition): CellKnowledge {
    return {
      north: this.getWall(pos, "NORTH"),
      east: this.getWall(pos, "EAST"),
      south: this.getWall(pos, "SOUTH"),
      west: this.getWall(pos, "WEST"),
      visited: this.isVisited(pos),
      fullyExplored: this.isFullyExplored(pos),
      deadEnd: this.isDeadEnd(pos),
    };
  }

  public to2DArray(): CellKnowledge[][] {
    const result: CellKnowledge[][] = [];
    for (let r = 0; r < this.rows; r++) {
      const row: CellKnowledge[] = [];
      for (let c = 0; c < this.cols; c++) {
        row.push(this.getCellKnowledge({ row: r, col: c }));
      }
      result.push(row);
    }
    return result;
  }

  public getStats(): {
    totalCells: number;
    visitedCount: number;
    fullyExploredCount: number;
    knownWallsCount: number;
    unknownWallsCount: number;
    deadEndsCount: number;
    explorationPercentage: number;
  } {
    let visitedCount = 0;
    let fullyExploredCount = 0;
    let deadEndsCount = 0;

    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const pos = { row: r, col: c };
        if (this.isVisited(pos)) visitedCount++;
        if (this.isFullyExplored(pos)) fullyExploredCount++;
        if (this.isDeadEnd(pos)) deadEndsCount++;
      }
    }

    let knownWallsCount = 0;
    let unknownWallsCount = 0;

    // Count horizontal interior walls
    for (let r = 1; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (this.horizontalWalls[r][c] === "WALL") knownWallsCount++;
        else if (this.horizontalWalls[r][c] === "UNKNOWN") unknownWallsCount++;
      }
    }

    // Count vertical interior walls
    for (let r = 0; r < this.rows; r++) {
      for (let c = 1; c < this.cols; c++) {
        if (this.verticalWalls[r][c] === "WALL") knownWallsCount++;
        else if (this.verticalWalls[r][c] === "UNKNOWN") unknownWallsCount++;
      }
    }

    const totalCells = this.rows * this.cols;
    const explorationPercentage = totalCells > 0
      ? Math.round((visitedCount / totalCells) * 100)
      : 0;

    return {
      totalCells,
      visitedCount,
      fullyExploredCount,
      knownWallsCount,
      unknownWallsCount,
      deadEndsCount,
      explorationPercentage,
    };
  }
}

