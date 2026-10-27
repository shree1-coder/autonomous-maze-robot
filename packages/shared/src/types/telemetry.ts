import { MovementAction } from "./robot.js";

export type DigitalReading = "HIGH" | "LOW";

export type ObstacleState = "BLOCKED" | "CLEAR";

export type SensorPolarity = "ACTIVE_LOW" | "ACTIVE_HIGH";

export type SensorReading = {
  raw: DigitalReading;
  state: ObstacleState;
  timestamp: number;
  stale: boolean;
  error?: boolean;
};

export type RobotSensors = {
  left: SensorReading;
  front: SensorReading;
  right: SensorReading;
};

export type MotorCommand = {
  leftDirection: "FORWARD" | "REVERSE" | "STOP";
  rightDirection: "FORWARD" | "REVERSE" | "STOP";
  leftPwm: number;
  rightPwm: number;
  action: MovementAction;
};

export type HardwareTelemetry = {
  connected: boolean;
  mode: "SIMULATION" | "PHYSICAL";
  lastCommTime: number | null;
  batteryVoltage: number | null; // null if not supported or disconnected
  sensors: RobotSensors;
  motorCommand: MotorCommand;
  error: string | null;
};

