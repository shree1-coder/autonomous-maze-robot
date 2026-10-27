import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";

describe("Server REST API Endpoints", () => {
  const app = createApp();

  it("GET /api/health returns ok", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(res.body.service).toBeDefined();
  });

  it("GET /api/maze returns config and ground truth", async () => {
    const res = await request(app).get("/api/maze");
    expect(res.status).toBe(200);
    expect(res.body.config).toBeDefined();
    expect(res.body.groundTruth).toBeDefined();
  });

  it("POST /api/maze/config validates input dimensions", async () => {
    // Valid update
    const validRes = await request(app)
      .post("/api/maze/config")
      .send({ rows: 8, cols: 8 });
    expect(validRes.status).toBe(200);
    expect(validRes.body.config.rows).toBe(8);

    // Invalid update (rows < 3)
    const invalidRes = await request(app)
      .post("/api/maze/config")
      .send({ rows: 1 });
    expect(invalidRes.status).toBe(400);
  });

  it("POST /api/maze/toggle-wall updates wall state", async () => {
    const res = await request(app)
      .post("/api/maze/toggle-wall")
      .send({ type: "horizontal", row: 2, col: 2 });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("POST /api/simulation controls: start, pause, step, reset", async () => {
    const startRes = await request(app).post("/api/simulation/start");
    expect(startRes.status).toBe(200);
    expect(startRes.body.state.isRunning).toBe(true);

    const pauseRes = await request(app).post("/api/simulation/pause");
    expect(pauseRes.status).toBe(200);
    expect(pauseRes.body.state.isPaused).toBe(true);

    const stepRes = await request(app).post("/api/simulation/step");
    expect(stepRes.status).toBe(200);

    const resetRes = await request(app).post("/api/simulation/reset");
    expect(resetRes.status).toBe(200);
    expect(resetRes.body.state.robot.mode).toBe("IDLE");
  });

  it("POST /api/pathfinding/solve returns calculation result", async () => {
    const res = await request(app).post("/api/pathfinding/solve");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("found");
    expect(res.body).toHaveProperty("path");
  });

  it("GET /api/robot/telemetry returns realistic telemetry without faking hardware", async () => {
    const res = await request(app).get("/api/robot/telemetry");
    expect(res.status).toBe(200);
    expect(res.body.mode).toBe("SIMULATION");
    expect(res.body.batteryVoltage).toBeNull();
    expect(res.body.sensors).toBeDefined();
  });
});

