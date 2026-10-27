import { describe, it, expect } from "vitest";
import { generateEsp32Firmware, MovementAction, CellPosition, MazeConfig } from "@maze/shared";

describe("ESP32 Firmware Generator", () => {
  const config: MazeConfig = {
    rows: 5,
    cols: 5,
    start: { row: 4, col: 0 },
    goal: { row: 0, col: 4 },
    initialDirection: "NORTH",
    name: "Custom Physical Test Maze",
  };

  const path: CellPosition[] = [
    { row: 4, col: 0 },
    { row: 3, col: 0 },
    { row: 3, col: 1 },
    { row: 2, col: 1 },
  ];

  const actions: MovementAction[] = ["FORWARD", "TURN_RIGHT", "FORWARD", "TURN_LEFT", "FORWARD"];

  it("generates complete flashable C++ Arduino sketch with exact actions", () => {
    const code = generateEsp32Firmware(path, actions, config, {
      forwardMs: 550,
      turnMs: 360,
      speedPwm: 190,
      useIrSafety: true,
    });

    expect(code).toContain("#include <Arduino.h>");
    expect(code).toContain("const int PIN_LEFT_IR   = 34;");
    expect(code).toContain("const int PIN_FRONT_IR  = 35;");
    expect(code).toContain("const int PIN_RIGHT_IR  = 36;");
    expect(code).toContain("const int PIN_ENA = 25;");
    expect(code).toContain("const int PIN_IN1 = 26;");
    expect(code).toContain("const int PIN_IN2 = 27;");
    expect(code).toContain("const int PIN_IN3 = 18;");
    expect(code).toContain("const int PIN_IN4 = 19;");
    expect(code).toContain("const int PIN_ENB = 14;");

    // Check motor direction logic
    expect(code).toContain("digitalWrite(PIN_IN1, LOW);");
    expect(code).toContain("digitalWrite(PIN_IN2, HIGH);");
    expect(code).toContain("digitalWrite(PIN_IN3, HIGH);");
    expect(code).toContain("digitalWrite(PIN_IN4, LOW);");

    // Check timings injected
    expect(code).toContain("const int MOVE_FORWARD_MS   = 550;");
    expect(code).toContain("const int TURN_90_DEG_MS    = 360;");
    expect(code).toContain("const int MOTOR_PWM_SPEED   = 190;");

    // Check pre-calculated actions
    expect(code).toContain("ACTION_FORWARD");
    expect(code).toContain("ACTION_TURN_RIGHT");
    expect(code).toContain("ACTION_TURN_LEFT");
  });
  it("generates ESP32 Arduino Core 3.x PWM calls using GPIO pins", () => {
    const code = generateEsp32Firmware(path, actions, config);

    expect(code).not.toContain("ledcSetup(");
    expect(code).not.toContain("ledcAttachPin(");
    expect(code).toContain("ledcAttach(PIN_ENA, PWM_FREQ, PWM_RESOLUTION)");
    expect(code).toContain("ledcAttach(PIN_ENB, PWM_FREQ, PWM_RESOLUTION)");
    expect(code).toContain("ledcWrite(PIN_ENA, constrain(leftPwm, 0, 255))");
    expect(code).toContain("ledcWrite(PIN_ENB, constrain(rightPwm, 0, 255))");
    expect(code).not.toContain("PWM_CHAN_LEFT");
    expect(code).not.toContain("PWM_CHAN_RIGHT");
  });

  it("keeps motors stopped and prevents execution when PWM initialization fails", () => {
    const code = generateEsp32Firmware(path, actions, config);
    const failedInit = code.indexOf("if (!leftPwmAttached || !rightPwmAttached)");
    const movementLoop = code.indexOf("for (int i = 0; i < TOTAL_STEPS; i++)");

    expect(failedInit).toBeGreaterThan(-1);
    expect(code).toContain('Serial.println("ERROR: Failed to initialize motor PWM. Motors remain stopped.")');
    expect(failedInit).toBeLessThan(movementLoop);
    expect(code).toContain("digitalWrite(PIN_ENA, LOW);");
    expect(code).toContain("digitalWrite(PIN_ENB, LOW);");
  });

  it("aborts the planned route on a front obstacle instead of moving forward anyway", () => {
    const code = generateEsp32Firmware(path, actions, config, { useIrSafety: true });
    const obstacleBranch = code.indexOf("if (ENABLE_IR_SAFETY && isObstacleDetected(PIN_FRONT_IR))");
    const moveForwardCall = code.indexOf("moveForward();", obstacleBranch);
    const obstacleHalt = code.indexOf("while (true)", obstacleBranch);

    expect(code).toContain("const bool IR_OBSTACLE_ACTIVE_LOW = true;");
    expect(code).toContain("return IR_OBSTACLE_ACTIVE_LOW ? sensorState == LOW : sensorState == HIGH;");
    expect(obstacleBranch).toBeGreaterThan(-1);
    expect(obstacleHalt).toBeGreaterThan(obstacleBranch);
    expect(moveForwardCall).toBeGreaterThan(obstacleHalt);
    expect(code).toContain("Planned route aborted. Clear the obstacle and reset the robot.");
  });

  it("preserves hardware pin assignments and avoids falsely claiming verified goal arrival", () => {
    const code = generateEsp32Firmware(path, actions, config);

    for (const pin of [
      "const int PIN_LEFT_IR   = 34;",
      "const int PIN_FRONT_IR  = 35;",
      "const int PIN_RIGHT_IR  = 36;",
      "const int PIN_ENA = 25;",
      "const int PIN_IN1 = 26;",
      "const int PIN_IN2 = 27;",
      "const int PIN_IN3 = 18;",
      "const int PIN_IN4 = 19;",
      "const int PIN_ENB = 14;",
      "const int PIN_LED = 2;",
    ]) {
      expect(code).toContain(pin);
    }

    expect(code).toContain("PLANNED_PATH");
    expect(code).toContain("Goal arrival is not verified by this timed-motion firmware.");
    expect(code).not.toContain("MISSION COMPLETE: GOAL CELL REACHED!");
  });

});

