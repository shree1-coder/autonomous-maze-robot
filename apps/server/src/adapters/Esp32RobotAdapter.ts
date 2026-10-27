import {
  HardwareTelemetry,
  MotorCommand,
  MovementAction,
  RobotSensors,
} from "@maze/shared";
import { RobotAdapter } from "./RobotAdapter.js";

export const ESP32_GPIO_CONFIG = {
  sensors: {
    leftIr: 34,
    frontIr: 35,
    rightIr: 36, // VP
  },
  motors: {
    ena: 25,
    in1: 26,
    in2: 27,
    in3: 18,
    in4: 19,
    enb: 14,
  },
  logic: {
    leftForward: { in1: 0, in2: 1 },
    rightForward: { in3: 1, in4: 0 },
  },
};

export class Esp32RobotAdapter implements RobotAdapter {
  private enabled: boolean = false;
  private connected: boolean = false;
  private esp32Host: string | null = null;
  private lastCommTime: number | null = null;
  private lastError: string | null = null;
  private currentCommand: MotorCommand;
  private lastSensors: RobotSensors;

  constructor() {
    this.currentCommand = {
      leftDirection: "STOP",
      rightDirection: "STOP",
      leftPwm: 0,
      rightPwm: 0,
      action: "STOP",
    };
    // Default sensor states when disconnected
    this.lastSensors = {
      left: { raw: "HIGH", state: "CLEAR", timestamp: 0, stale: true, error: true },
      front: { raw: "HIGH", state: "CLEAR", timestamp: 0, stale: true, error: true },
      right: { raw: "HIGH", state: "CLEAR", timestamp: 0, stale: true, error: true },
    };
  }

  public setHost(host: string): void {
    this.esp32Host = host;
  }

  public enable(): void {
    this.enabled = true;
  }

  public disable(): void {
    this.enabled = false;
    this.connected = false;
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  public isConnected(): boolean {
    return this.enabled && this.connected;
  }

  public getMode(): "SIMULATION" | "PHYSICAL" {
    return "PHYSICAL";
  }

  public async executeAction(action: MovementAction): Promise<boolean> {
    if (!this.enabled || !this.connected) {
      this.lastError = "Physical ESP32 robot is not connected";
      return false;
    }

    try {
      if (this.esp32Host) {
        // Send command to ESP32 over HTTP/REST endpoint
        const response = await fetch(`http://${this.esp32Host}/api/command`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action,
            timestamp: Date.now(),
          }),
        });
        if (!response.ok) {
          throw new Error(`ESP32 responded with status ${response.status}`);
        }
      }
      return true;
    } catch (err: any) {
      this.lastError = err.message || "Failed to transmit command to ESP32";
      this.connected = false;
      return false;
    }
  }

  public async getSensors(): Promise<RobotSensors> {
    return this.lastSensors;
  }

  public async getTelemetry(): Promise<HardwareTelemetry> {
    return {
      connected: this.isConnected(),
      mode: "PHYSICAL",
      lastCommTime: this.lastCommTime,
      batteryVoltage: null, // Only return when genuine reading is received from ESP32
      sensors: this.lastSensors,
      motorCommand: this.currentCommand,
      error: this.lastError,
    };
  }

  public async stop(): Promise<void> {
    if (this.enabled && this.connected && this.esp32Host) {
      try {
        await fetch(`http://${this.esp32Host}/api/command`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "STOP", timestamp: Date.now() }),
        });
      } catch {
        // Stop failsafe
      }
    }
    this.currentCommand = {
      leftDirection: "STOP",
      rightDirection: "STOP",
      leftPwm: 0,
      rightPwm: 0,
      action: "STOP",
    };
  }

  public disconnect(): void {
    this.connected = false;
  }
}

