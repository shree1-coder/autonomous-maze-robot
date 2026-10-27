import express from "express";
import cors from "cors";
import { healthRouter } from "./routes/health.routes.js";
import { mazeRouter } from "./routes/maze.routes.js";
import { simulationRouter } from "./routes/simulation.routes.js";
import { pathfindingRouter } from "./routes/pathfinding.routes.js";
import { robotRouter } from "./routes/robot.routes.js";

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: "5mb" }));

  // API Routes
  app.use("/api/health", healthRouter);
  app.use("/api/maze", mazeRouter);
  app.use("/api/simulation", simulationRouter);
  app.use("/api/pathfinding", pathfindingRouter);
  app.use("/api/robot", robotRouter);

  // Error handling middleware
  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error("Server Error:", err);
    res.status(500).json({ error: err.message || "Internal server error" });
  });

  return app;
}

