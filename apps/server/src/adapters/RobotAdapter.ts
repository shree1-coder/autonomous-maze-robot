import {
  HardwareTelemetry,
  MovementAction,
  RobotSensors,
} from "@maze/shared";

export interface RobotAdapter {
  executeAction(action: MovementAction): Promise<boolean>;
  getSensors(): Promise<RobotSensors>;
  getTelemetry(): Promise<HardwareTelemetry>;
  stop(): Promise<void>;
  isConnected(): boolean;
  getMode(): "SIMULATION" | "PHYSICAL";
  disconnect(): void;
}

