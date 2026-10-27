import {
  HardwareTelemetry,
  MotorCommand,
  MovementAction,
  RobotSensors,
} from "@maze/shared";
import { RobotAdapter } from "./RobotAdapter.js";

export class SimulatedRobotAdapter implements RobotAdapter {
  private sensors: RobotSensors;
  private currentCommand: MotorCommand;

  constructor() {
    this.sensors = {
      left: { raw: "HIGH", state: "CLEAR", timestamp: Date.now(), stale: false },
      front: { raw: "HIGH", state: "CLEAR", timestamp: Date.now(), stale: false },
      right: { raw: "HIGH", state: "CLEAR", timestamp: Date.now(), stale: false },
    };
    this.currentCommand = {
      leftDirection: "STOP",
      rightDirection: "STOP",
      leftPwm: 0,
      rightPwm: 0,
      action: "STOP",
    };
  }

  public setSensors(sensors: RobotSensors): void {
    this.sensors = sensors;
  }

  public async executeAction(action: MovementAction): Promise<boolean> {
    switch (action) {
      case "FORWARD":
        this.currentCommand = {
          leftDirection: "FORWARD",
          rightDirection: "FORWARD",
          leftPwm: 200,
          rightPwm: 200,
          action: "FORWARD",
        };
        break;
      case "TURN_LEFT":
        this.currentCommand = {
          leftDirection: "REVERSE",
          rightDirection: "FORWARD",
          leftPwm: 180,
          rightPwm: 180,
          action: "TURN_LEFT",
        };
        break;
      case "TURN_RIGHT":
        this.currentCommand = {
          leftDirection: "FORWARD",
          rightDirection: "REVERSE",
          leftPwm: 180,
          rightPwm: 180,
          action: "TURN_RIGHT",
        };
        break;
      case "REVERSE":
        this.currentCommand = {
          leftDirection: "REVERSE",
          rightDirection: "REVERSE",
          leftPwm: 180,
          rightPwm: 180,
          action: "REVERSE",
        };
        break;
      case "STOP":
      default:
        this.currentCommand = {
          leftDirection: "STOP",
          rightDirection: "STOP",
          leftPwm: 0,
          rightPwm: 0,
          action: "STOP",
        };
        break;
    }
    return true;
  }

  public async getSensors(): Promise<RobotSensors> {
    return this.sensors;
  }

  public async getTelemetry(): Promise<HardwareTelemetry> {
    return {
      connected: true,
      mode: "SIMULATION",
      lastCommTime: Date.now(),
      batteryVoltage: null, // Simulation does not fake battery
      sensors: this.sensors,
      motorCommand: this.currentCommand,
      error: null,
    };
  }

  public async stop(): Promise<void> {
    await this.executeAction("STOP");
  }

  public isConnected(): boolean {
    return true;
  }

  public getMode(): "SIMULATION" | "PHYSICAL" {
    return "SIMULATION";
  }

  public disconnect(): void {
    // No-op for simulation
  }
}

