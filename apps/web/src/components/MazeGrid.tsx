import React, { useState } from "react";
import {
  CellKnowledge,
  CellPosition,
  Direction,
  GroundTruthMaze,
  MazeConfig,
  MovementAction,
  WallState,
} from "@maze/shared";

interface MazeGridProps {
  config: MazeConfig;
  groundTruth?: GroundTruthMaze;
  knowledgeMap?: CellKnowledge[][];
  robotPos?: CellPosition;
  robotFacing?: Direction;
  plannedPath?: CellPosition[] | null;
  displayMode?: "KNOWLEDGE" | "GROUND_TRUTH" | "HYBRID";
  editable?: boolean;
  onToggleWall?: (type: "horizontal" | "vertical", row: number, col: number) => void;
  onSelectCell?: (pos: CellPosition) => void;
  selectedCell?: CellPosition | null;
}

export const MazeGrid: React.FC<MazeGridProps> = ({
  config,
  groundTruth,
  knowledgeMap,
  robotPos,
  robotFacing = "NORTH",
  plannedPath = null,
  displayMode = "KNOWLEDGE",
  editable = false,
  onToggleWall,
  onSelectCell,
  selectedCell,
}) => {
  const { rows, cols, start, goal } = config;

  // Determine wall state between cells
  const getHorizontalWall = (r: number, c: number): { isWall: boolean; isUnknown: boolean } => {
    // Outer boundary
    if (r === 0 || r === rows) {
      return { isWall: true, isUnknown: false };
    }

    if (displayMode === "GROUND_TRUTH" && groundTruth) {
      return {
        isWall: !!groundTruth.horizontalWalls[r]?.[c],
        isUnknown: false,
      };
    }

    if (knowledgeMap) {
      // Cell below wall is (r, c), wall above it is NORTH
      // Cell above wall is (r-1, c), wall below it is SOUTH
      const cellBelow = knowledgeMap[r]?.[c];
      const state: WallState = cellBelow?.north ?? "UNKNOWN";
      if (state === "WALL") return { isWall: true, isUnknown: false };
      if (state === "OPEN") return { isWall: false, isUnknown: false };
      return { isWall: false, isUnknown: true };
    }

    if (groundTruth) {
      return {
        isWall: !!groundTruth.horizontalWalls[r]?.[c],
        isUnknown: false,
      };
    }

    return { isWall: false, isUnknown: true };
  };

  const getVerticalWall = (r: number, c: number): { isWall: boolean; isUnknown: boolean } => {
    // Outer boundary
    if (c === 0 || c === cols) {
      return { isWall: true, isUnknown: false };
    }

    if (displayMode === "GROUND_TRUTH" && groundTruth) {
      return {
        isWall: !!groundTruth.verticalWalls[r]?.[c],
        isUnknown: false,
      };
    }

    if (knowledgeMap) {
      // Cell to right is (r, c), wall to its west is WEST
      const cellRight = knowledgeMap[r]?.[c];
      const state: WallState = cellRight?.west ?? "UNKNOWN";
      if (state === "WALL") return { isWall: true, isUnknown: false };
      if (state === "OPEN") return { isWall: false, isUnknown: false };
      return { isWall: false, isUnknown: true };
    }

    if (groundTruth) {
      return {
        isWall: !!groundTruth.verticalWalls[r]?.[c],
        isUnknown: false,
      };
    }

    return { isWall: false, isUnknown: true };
  };

  // Orientation arrow rotation in degrees
  const getFacingAngle = (dir: Direction): number => {
    switch (dir) {
      case "NORTH": return 0;
      case "EAST": return 90;
      case "SOUTH": return 180;
      case "WEST": return 270;
    }
  };

  // Check if cell is in planned path
  const isPathCell = (r: number, c: number): boolean => {
    if (!plannedPath) return false;
    return plannedPath.some((p) => p.row === r && p.col === c);
  };

  const getPathStepIndex = (r: number, c: number): number | null => {
    if (!plannedPath) return null;
    const idx = plannedPath.findIndex((p) => p.row === r && p.col === c);
    return idx >= 0 ? idx : null;
  };

  // Sizing calculation
  const cellSize = Math.min(52, Math.max(26, Math.floor(520 / Math.max(rows, cols))));
  const svgWidth = cols * cellSize;
  const svgHeight = rows * cellSize;

  return (
    <div className="flex flex-col items-center justify-center p-3 select-none">
      <div
        className="relative bg-slate-900 rounded-xl p-4 shadow-2xl border border-slate-800 overflow-auto max-w-full max-h-[75vh]"
        style={{ touchAction: "manipulation" }}
      >
        <svg
          width={svgWidth}
          height={svgHeight}
          className="overflow-visible"
          style={{ minWidth: svgWidth, minHeight: svgHeight }}
        >
          {/* Defs for gradients & markers */}
          <defs>
            <filter id="glow-cyan" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            <linearGradient id="pathGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#6366f1" />
            </linearGradient>
          </defs>

          {/* Render Cells */}
          {Array.from({ length: rows }).map((_, r) =>
            Array.from({ length: cols }).map((_, c) => {
              const isStart = start.row === r && start.col === c;
              const isGoal = goal.row === r && goal.col === c;
              const isRobot = robotPos?.row === r && robotPos?.col === c;
              const isSelected = selectedCell?.row === r && selectedCell?.col === c;
              const pathIndex = getPathStepIndex(r, c);

              const cellInfo = knowledgeMap?.[r]?.[c];
              const isVisited = cellInfo?.visited ?? false;
              const isExplored = cellInfo?.fullyExplored ?? false;
              const isDeadEnd = cellInfo?.deadEnd ?? false;

              let cellBg = "#0f172a"; // Unvisited slate-900

              if (displayMode === "GROUND_TRUTH") {
                cellBg = "#131c2e";
              } else if (isVisited) {
                cellBg = isExplored ? "#1e293b" : "#172554"; // Visited or partially visited
              }

              if (pathIndex !== null) {
                cellBg = "rgba(6, 182, 212, 0.18)"; // Path overlay glow
              }

              return (
                <g
                  key={`cell-${r}-${c}`}
                  onClick={() => onSelectCell?.({ row: r, col: c })}
                  className={editable ? "cursor-pointer transition-colors" : ""}
                >
                  <rect
                    x={c * cellSize}
                    y={r * cellSize}
                    width={cellSize}
                    height={cellSize}
                    fill={cellBg}
                    stroke={isSelected ? "#38bdf8" : "#1e293b"}
                    strokeWidth={isSelected ? 2 : 0.5}
                    className="transition-colors duration-150"
                  />

                  {/* Dead end badge */}
                  {isDeadEnd && !isStart && !isGoal && !isRobot && (
                    <text
                      x={c * cellSize + cellSize / 2}
                      y={r * cellSize + cellSize / 2 + 4}
                      fill="#ef4444"
                      fontSize={Math.max(9, cellSize * 0.28)}
                      fontWeight="bold"
                      textAnchor="middle"
                      opacity={0.6}
                    >
                      ×
                    </text>
                  )}

                  {/* Start Marker */}
                  {isStart && !isRobot && (
                    <g transform={`translate(${c * cellSize + cellSize / 2}, ${r * cellSize + cellSize / 2})`}>
                      <circle r={cellSize * 0.35} fill="#059669" opacity={0.3} />
                      <circle r={cellSize * 0.25} fill="#10b981" />
                      <text
                        y={3}
                        fill="#ffffff"
                        fontSize={Math.max(10, cellSize * 0.32)}
                        fontWeight="bold"
                        textAnchor="middle"
                      >
                        S
                      </text>
                    </g>
                  )}

                  {/* Goal Marker */}
                  {isGoal && !isRobot && (
                    <g transform={`translate(${c * cellSize + cellSize / 2}, ${r * cellSize + cellSize / 2})`}>
                      <circle r={cellSize * 0.38} fill="#d97706" opacity={0.3} className="animate-pulse" />
                      <circle r={cellSize * 0.26} fill="#f59e0b" />
                      <text
                        y={3}
                        fill="#111827"
                        fontSize={Math.max(10, cellSize * 0.32)}
                        fontWeight="bold"
                        textAnchor="middle"
                      >
                        G
                      </text>
                    </g>
                  )}

                  {/* Path Sequence Number */}
                  {pathIndex !== null && !isRobot && !isStart && !isGoal && cellSize >= 32 && (
                    <text
                      x={c * cellSize + cellSize / 2}
                      y={r * cellSize + cellSize / 2 + 3}
                      fill="#38bdf8"
                      fontSize={Math.max(8, cellSize * 0.26)}
                      fontFamily="monospace"
                      fontWeight="bold"
                      textAnchor="middle"
                      opacity={0.8}
                    >
                      {pathIndex}
                    </text>
                  )}
                </g>
              );
            })
          )}

          {/* Render Path Polyline */}
          {plannedPath && plannedPath.length > 1 && (
            <polyline
              points={plannedPath
                .map((p) => `${p.col * cellSize + cellSize / 2},${p.row * cellSize + cellSize / 2}`)
                .join(" ")}
              fill="none"
              stroke="#06b6d4"
              strokeWidth={Math.max(2, cellSize * 0.08)}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="4 2"
              opacity={0.85}
            />
          )}

          {/* Render Horizontal Walls */}
          {Array.from({ length: rows + 1 }).map((_, r) =>
            Array.from({ length: cols }).map((_, c) => {
              const { isWall, isUnknown } = getHorizontalWall(r, c);
              const x1 = c * cellSize;
              const x2 = (c + 1) * cellSize;
              const y = r * cellSize;

              const isPerimeter = r === 0 || r === rows;

              let strokeColor = "transparent";
              let strokeWidth = 2;
              let strokeDash: string | undefined = undefined;

              if (isWall) {
                strokeColor = isPerimeter ? "#f43f5e" : "#ef4444"; // Vivid rose/red for walls
                strokeWidth = isPerimeter ? 4 : 3;
              } else if (isUnknown && displayMode === "KNOWLEDGE") {
                strokeColor = "#334155"; // Muted dashed line for unobserved internal boundaries
                strokeWidth = 1;
                strokeDash = "2 3";
              } else if (!isWall && displayMode === "GROUND_TRUTH") {
                strokeColor = "rgba(16, 185, 129, 0.2)"; // Confirmed open passage
                strokeWidth = 1;
              }

              return (
                <g key={`hwall-${r}-${c}`}>
                  {/* Visual wall line */}
                  <line
                    x1={x1}
                    y1={y}
                    x2={x2}
                    y2={y}
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                    strokeDasharray={strokeDash}
                    strokeLinecap="square"
                  />
                  {/* Invisible interactive click target for editor */}
                  {editable && !isPerimeter && (
                    <line
                      x1={x1}
                      y1={y}
                      x2={x2}
                      y2={y}
                      stroke="transparent"
                      strokeWidth={14}
                      className="cursor-pointer hover:stroke-cyan-400 hover:opacity-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleWall?.("horizontal", r, c);
                      }}
                    />
                  )}
                </g>
              );
            })
          )}

          {/* Render Vertical Walls */}
          {Array.from({ length: rows }).map((_, r) =>
            Array.from({ length: cols + 1 }).map((_, c) => {
              const { isWall, isUnknown } = getVerticalWall(r, c);
              const x = c * cellSize;
              const y1 = r * cellSize;
              const y2 = (r + 1) * cellSize;

              const isPerimeter = c === 0 || c === cols;

              let strokeColor = "transparent";
              let strokeWidth = 2;
              let strokeDash: string | undefined = undefined;

              if (isWall) {
                strokeColor = isPerimeter ? "#f43f5e" : "#ef4444";
                strokeWidth = isPerimeter ? 4 : 3;
              } else if (isUnknown && displayMode === "KNOWLEDGE") {
                strokeColor = "#334155";
                strokeWidth = 1;
                strokeDash = "2 3";
              } else if (!isWall && displayMode === "GROUND_TRUTH") {
                strokeColor = "rgba(16, 185, 129, 0.2)";
                strokeWidth = 1;
              }

              return (
                <g key={`vwall-${r}-${c}`}>
                  <line
                    x1={x}
                    y1={y1}
                    x2={x}
                    y2={y2}
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                    strokeDasharray={strokeDash}
                    strokeLinecap="square"
                  />
                  {editable && !isPerimeter && (
                    <line
                      x1={x}
                      y1={y1}
                      x2={x}
                      y2={y2}
                      stroke="transparent"
                      strokeWidth={14}
                      className="cursor-pointer hover:stroke-cyan-400 hover:opacity-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleWall?.("vertical", r, c);
                      }}
                    />
                  )}
                </g>
              );
            })
          )}

          {/* Render Robot */}
          {robotPos && (
            <g
              transform={`translate(${robotPos.col * cellSize + cellSize / 2}, ${
                robotPos.row * cellSize + cellSize / 2
              })`}
              className="transition-transform duration-200"
            >
              {/* Outer sensor halo */}
              <circle r={cellSize * 0.42} fill="#06b6d4" opacity={0.15} />

              {/* Robot body group rotated to facing direction */}
              <g transform={`rotate(${getFacingAngle(robotFacing)})`}>
                {/* Robot body chassis */}
                <rect
                  x={-cellSize * 0.28}
                  y={-cellSize * 0.28}
                  width={cellSize * 0.56}
                  height={cellSize * 0.56}
                  rx={cellSize * 0.1}
                  fill="#0284c7"
                  stroke="#38bdf8"
                  strokeWidth={1.5}
                />
                {/* Robot wheels */}
                <rect
                  x={-cellSize * 0.34}
                  y={-cellSize * 0.22}
                  width={cellSize * 0.08}
                  height={cellSize * 0.44}
                  rx={2}
                  fill="#0f172a"
                  stroke="#38bdf8"
                  strokeWidth={1}
                />
                <rect
                  x={cellSize * 0.26}
                  y={-cellSize * 0.22}
                  width={cellSize * 0.08}
                  height={cellSize * 0.44}
                  rx={2}
                  fill="#0f172a"
                  stroke="#38bdf8"
                  strokeWidth={1}
                />
                {/* Forward directional pointer / arrow */}
                <polygon
                  points={`0,${-cellSize * 0.25} ${cellSize * 0.14},${-cellSize * 0.02} ${-cellSize * 0.14},${-cellSize * 0.02}`}
                  fill="#ffffff"
                />
                {/* Front IR sensor lens */}
                <circle cx={0} cy={-cellSize * 0.28} r={cellSize * 0.06} fill="#ef4444" />
                {/* Left IR sensor lens */}
                <circle cx={-cellSize * 0.24} cy={-cellSize * 0.26} r={cellSize * 0.05} fill="#ef4444" />
                {/* Right IR sensor lens */}
                <circle cx={cellSize * 0.24} cy={-cellSize * 0.26} r={cellSize * 0.05} fill="#ef4444" />
              </g>
            </g>
          )}
        </svg>
      </div>
    </div>
  );
};

