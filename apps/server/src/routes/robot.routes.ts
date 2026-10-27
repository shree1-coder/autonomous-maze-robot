import { Router, Request, Response } from "express";
import { robotService } from "../services/RobotService.js";
import { simulationService } from "../services/SimulationService.js";
import { RobotCommandSchema, UpdateSettingsSchema, generateEsp32Firmware, solveGroundTruthBfs } from "@maze/shared";

export const robotRouter = Router();

robotRouter.get("/telemetry", async (_req: Request, res: Response) => {
  const telemetry = await robotService.getTelemetry();
  res.json(telemetry);
});

robotRouter.post("/command", async (req: Request, res: Response) => {
  const parsed = RobotCommandSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.format() });
  }
  const success = await robotService.executeCommand(parsed.data.action);
  const telemetry = await robotService.getTelemetry();
  res.json({ success, telemetry });
});

robotRouter.post("/mode", (req: Request, res: Response) => {
  const parsed = UpdateSettingsSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.format() });
  }
  if (parsed.data.mode) {
    robotService.setMode(parsed.data.mode);
  }
  res.json({ success: true, mode: robotService.getMode() });
});

robotRouter.post("/stop", async (_req: Request, res: Response) => {
  await robotService.stop();
  const telemetry = await robotService.getTelemetry();
  res.json({ success: true, telemetry });
});

robotRouter.post("/generate-firmware", (req: Request, res: Response) => {
  const state = simulationService.getState();
  const options = req.body || {};

  // If there's already a solved path in state, use it; otherwise solve on ground truth
  let path = state.currentPath;
  let actions = state.plannedActions;

  if (!path || !actions || actions.length === 0) {
    const solveRes = solveGroundTruthBfs(state.groundTruth);
    if (solveRes.found) {
      path = solveRes.path;
      actions = solveRes.actions;
    }
  }

  if (!path || !actions || actions.length === 0) {
    return res.status(400).json({
      error: "No valid path found to generate firmware. Please ensure the maze has a traversable path from Start to Goal.",
    });
  }

  const firmwareCode = generateEsp32Firmware(path, actions, state.mazeConfig, options);

  res.json({
    success: true,
    code: firmwareCode,
    pathLength: path.length - 1,
    actionCount: actions.length,
    actions,
    config: state.mazeConfig,
  });
});


