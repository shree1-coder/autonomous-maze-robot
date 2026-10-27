import { Server, Socket } from "socket.io";
import {
  ClientToServerEvents,
  ServerToClientEvents,
  SimulationState,
} from "@maze/shared";
import { simulationService } from "../services/SimulationService.js";
import { robotService } from "../services/RobotService.js";

export function registerSocketHandlers(
  io: Server<ClientToServerEvents, ServerToClientEvents>
): void {
  // Subscribe to simulation state changes and broadcast to all connected clients
  simulationService.subscribe((state: SimulationState) => {
    io.emit("simulation:state", state);
  });

  // Setup completion listener
  simulationService.getEngine().setCallbacks(
    (state) => io.emit("simulation:state", state),
    (payload) => io.emit("simulation:completed", payload)
  );

  io.on("connection", async (socket: Socket<ClientToServerEvents, ServerToClientEvents>) => {
    // Send initial state on connection
    socket.emit("simulation:state", simulationService.getState());
    const telemetry = await robotService.getTelemetry();
    socket.emit("robot:telemetry", telemetry);

    socket.on("simulation:start", () => {
      simulationService.start();
      io.emit("simulation:started", { timestamp: Date.now() });
    });

    socket.on("simulation:pause", () => {
      simulationService.pause();
      io.emit("simulation:paused", { timestamp: Date.now() });
    });

    socket.on("simulation:resume", () => {
      simulationService.resume();
      io.emit("simulation:resumed", { timestamp: Date.now() });
    });

    socket.on("simulation:step", () => {
      simulationService.step();
    });

    socket.on("simulation:stop", () => {
      simulationService.stop();
    });

    socket.on("simulation:reset", () => {
      simulationService.reset();
      io.emit("simulation:reset", { timestamp: Date.now() });
    });

    socket.on("simulation:solve", () => {
      const result = simulationService.calculatePath();
      io.emit("path:updated", {
        path: result.found ? result.path : null,
        actions: result.found ? result.actions : null,
      });
    });

    socket.on("simulation:followPath", () => {
      simulationService.followPath();
    });
  });
}

