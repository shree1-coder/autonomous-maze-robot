import { z } from "zod";

export const DirectionSchema = z.enum(["NORTH", "EAST", "SOUTH", "WEST"]);

export const CellPositionSchema = z.object({
  row: z.number().int().min(0),
  col: z.number().int().min(0),
});

export const BaseMazeConfigSchema = z.object({
  rows: z.number().int().min(3).max(30),
  cols: z.number().int().min(3).max(30),
  start: CellPositionSchema,
  goal: CellPositionSchema,
  initialDirection: DirectionSchema,
  name: z.string().optional(),
});

export const MazeConfigSchema = BaseMazeConfigSchema.refine(
  (data) => data.start.row < data.rows && data.start.col < data.cols,
  { message: "Start position must be within grid dimensions", path: ["start"] }
).refine(
  (data) => data.goal.row < data.rows && data.goal.col < data.cols,
  { message: "Goal position must be within grid dimensions", path: ["goal"] }
);

export const UpdateMazeConfigSchema = BaseMazeConfigSchema.partial();

export const MazeExportSchema = z.object({
  version: z.literal(1),
  config: MazeConfigSchema,
  horizontalWalls: z.array(z.array(z.boolean())),
  verticalWalls: z.array(z.array(z.boolean())),
  createdAt: z.string().optional(),
  description: z.string().optional(),
}).refine((data) => {
  const { rows, cols } = data.config;
  const h = data.horizontalWalls;
  const v = data.verticalWalls;
  if (h.length !== rows + 1) return false;
  for (const row of h) {
    if (row.length !== cols) return false;
  }
  if (v.length !== rows) return false;
  for (const row of v) {
    if (row.length !== cols + 1) return false;
  }
  return true;
}, { message: "Wall matrices dimensions do not match maze config rows and cols" });

export const ToggleWallSchema = z.object({
  type: z.enum(["horizontal", "vertical"]),
  row: z.number().int().min(0),
  col: z.number().int().min(0),
});
