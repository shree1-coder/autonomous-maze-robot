import { z } from "zod";
import { DirectionSchema } from "./maze.schema.js";

export const SimulationSpeedSchema = z.enum(["SLOW", "NORMAL", "FAST", "MAX"]);

export const ExplorationStrategySchema = z.enum([
  "WALL_FOLLOWER_LEFT",
  "WALL_FOLLOWER_RIGHT",
  "SYSTEMATIC",
]);

export const UpdateSimulationConfigSchema = z.object({
  speed: SimulationSpeedSchema.optional(),
  stepDelayMs: z.number().int().min(10).max(2000).optional(),
  maxSteps: z.number().int().min(10).max(10000).optional(),
  strategy: ExplorationStrategySchema.optional(),
});

export const RobotCommandSchema = z.object({
  action: z.enum(["FORWARD", "TURN_LEFT", "TURN_RIGHT", "REVERSE", "STOP"]),
  speedPwm: z.number().int().min(0).max(255).optional(),
  durationMs: z.number().int().min(50).max(5000).optional(),
});

export const UpdateSettingsSchema = z.object({
  mode: z.enum(["SIMULATION", "PHYSICAL"]).optional(),
  sensorPolarity: z.enum(["ACTIVE_LOW", "ACTIVE_HIGH"]).optional(),
  debugMode: z.boolean().optional(),
  stepDelayMs: z.number().optional(),
  strategy: ExplorationStrategySchema.optional(),
});

