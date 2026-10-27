import { Router, Request, Response } from "express";
import { simulationService } from "../services/SimulationService.js";

export const pathfindingRouter = Router();

pathfindingRouter.post("/solve", (_req: Request, res: Response) => {
  const result = simulationService.calculatePath();
  res.json(result);
});

pathfindingRouter.post("/execute", (_req: Request, res: Response) => {
  const started = simulationService.followPath();
  res.json({ success: started, state: simulationService.getState() });
});

