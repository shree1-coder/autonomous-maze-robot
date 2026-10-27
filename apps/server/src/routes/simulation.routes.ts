import { Router, Request, Response } from "express";
import { simulationService } from "../services/SimulationService.js";
import { UpdateSimulationConfigSchema } from "@maze/shared";

export const simulationRouter = Router();

simulationRouter.get("/state", (_req: Request, res: Response) => {
  res.json(simulationService.getState());
});

simulationRouter.post("/start", (_req: Request, res: Response) => {
  simulationService.start();
  res.json({ success: true, state: simulationService.getState() });
});

simulationRouter.post("/pause", (_req: Request, res: Response) => {
  simulationService.pause();
  res.json({ success: true, state: simulationService.getState() });
});

simulationRouter.post("/resume", (_req: Request, res: Response) => {
  simulationService.resume();
  res.json({ success: true, state: simulationService.getState() });
});

simulationRouter.post("/step", (_req: Request, res: Response) => {
  const result = simulationService.step();
  res.json({ success: result, state: simulationService.getState() });
});

simulationRouter.post("/stop", (_req: Request, res: Response) => {
  simulationService.stop();
  res.json({ success: true, state: simulationService.getState() });
});

simulationRouter.post("/reset", (_req: Request, res: Response) => {
  simulationService.reset();
  res.json({ success: true, state: simulationService.getState() });
});

simulationRouter.post("/config", (req: Request, res: Response) => {
  const parsed = UpdateSimulationConfigSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.format() });
  }
  const { speed, stepDelayMs, strategy } = parsed.data;
  if (speed) {
    simulationService.setSpeed(speed, stepDelayMs);
  }
  if (strategy) {
    simulationService.setStrategy(strategy);
  }
  res.json({ success: true, state: simulationService.getState() });
});

