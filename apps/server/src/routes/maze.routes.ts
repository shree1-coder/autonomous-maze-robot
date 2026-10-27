import { Router, Request, Response } from "express";
import { mazeService } from "../services/MazeService.js";
import { simulationService } from "../services/SimulationService.js";
import { MazeConfigSchema, MazeExportSchema, ToggleWallSchema, UpdateMazeConfigSchema } from "@maze/shared";

export const mazeRouter = Router();

mazeRouter.get("/", (_req: Request, res: Response) => {
  res.json({
    config: mazeService.getCurrentMaze().getConfig(),
    groundTruth: mazeService.getCurrentMaze().toGroundTruth(),
  });
});

mazeRouter.post("/config", (req: Request, res: Response) => {
  const parsed = UpdateMazeConfigSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.format() });
  }
  const updated = mazeService.updateConfig(parsed.data);
  res.json({
    config: updated.getConfig(),
    groundTruth: updated.toGroundTruth(),
  });
});

mazeRouter.post("/toggle-wall", (req: Request, res: Response) => {
  const parsed = ToggleWallSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.format() });
  }
  const { type, row, col } = parsed.data;
  const toggled = mazeService.toggleWall(type, row, col);
  res.json({
    success: toggled,
    groundTruth: mazeService.getCurrentMaze().toGroundTruth(),
  });
});

mazeRouter.post("/clear", (_req: Request, res: Response) => {
  mazeService.clearWalls();
  res.json({
    success: true,
    groundTruth: mazeService.getCurrentMaze().toGroundTruth(),
  });
});

mazeRouter.get("/export", (_req: Request, res: Response) => {
  res.json(mazeService.exportJson());
});

mazeRouter.post("/import", (req: Request, res: Response) => {
  const parsed = MazeExportSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.format() });
  }
  const imported = mazeService.importJson(parsed.data);
  res.json({
    success: true,
    config: imported.getConfig(),
    groundTruth: imported.toGroundTruth(),
  });
});

mazeRouter.get("/presets", (_req: Request, res: Response) => {
  res.json({ presets: mazeService.getPresets() });
});

mazeRouter.post("/presets/:name", (req: Request, res: Response) => {
  const { name } = req.params;
  const loaded = mazeService.loadPreset(name);
  if (!loaded) {
    return res.status(404).json({ error: `Preset '${name}' not found` });
  }
  res.json({
    success: true,
    config: mazeService.getCurrentMaze().getConfig(),
    groundTruth: mazeService.getCurrentMaze().toGroundTruth(),
  });
});

mazeRouter.get("/knowledge", (_req: Request, res: Response) => {
  const map = simulationService.getEngine().getKnowledgeMap();
  res.json({
    knowledgeMap: map.to2DArray(),
    stats: map.getStats(),
  });
});
