import {
  HardwareTelemetry,
  MovementAction,
  RobotSensors,
} from "@maze/shared";
import { RobotAdapter } from "../adapters/RobotAdapter.js";
import { Esp32RobotAdapter } from "../adapters/Esp32RobotAdapter.js";
import { simulationService } from "./SimulationService.js";

export class RobotService {
  private esp32Adapter: Esp32RobotAdapter;
  private mode: "SIMULATION" | "PHYSICAL" = "SIMULATION";

  constructor() {
    this.esp32Adapter = new Esp32RobotAdapter();
  }

  public getActiveAdapter(): RobotAdapter {
    if (this.mode === "PHYSICAL") {
      return this.esp32Adapter;
    }
    return simulationService.getEngine().getRobotAdapter();
  }

  public setMode(mode: "SIMULATION" | "PHYSICAL", esp32Host?: string): void {
    this.mode = mode;
    if (mode === "PHYSICAL") {
      if (esp32Host) {
        this.esp32Adapter.setHost(esp32Host);
      }
      this.esp32Adapter.enable();
    } else {
      this.esp32Adapter.disable();
    }
  }

  public getMode(): "SIMULATION" | "PHYSICAL" {
    return this.mode;
  }

  public async getTelemetry(): Promise<HardwareTelemetry> {
    return this.getActiveAdapter().getTelemetry();
  }

  public async executeCommand(action: MovementAction): Promise<boolean> {
    return this.getActiveAdapter().executeAction(action);
  }

  public async stop(): Promise<void> {
    return this.getActiveAdapter().stop();
  }
}

export const robotService = new RobotService();

