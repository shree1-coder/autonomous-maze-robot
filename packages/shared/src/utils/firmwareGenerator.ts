import { CellPosition, Direction, MazeConfig } from "../types/maze.js";
import { MovementAction } from "../types/robot.js";

export interface FirmwareOptions {
  forwardMs?: number;
  turnMs?: number;
  settleMs?: number;
  speedPwm?: number;
  useIrSafety?: boolean;
  robotName?: string;
}

export function generateEsp32Firmware(
  path: CellPosition[],
  actions: MovementAction[],
  config: MazeConfig,
  options: FirmwareOptions = {}
): string {
  const {
    forwardMs = 600,
    turnMs = 380,
    settleMs = 200,
    speedPwm = 200,
    useIrSafety = true,
    robotName = "Autonomous Maze Runner",
  } = options;

  // Build the C++ step array
  const stepsCode = actions
    .map((act, index) => {
      let enumName = "ACTION_STOP";
      let desc = `Step ${index + 1}: Stop`;
      if (act === "FORWARD") {
        enumName = "ACTION_FORWARD";
        desc = `Step ${index + 1}: Move Forward 1 Cell`;
      } else if (act === "TURN_LEFT") {
        enumName = "ACTION_TURN_LEFT";
        desc = `Step ${index + 1}: Rotate Left 90 Deg`;
      } else if (act === "TURN_RIGHT") {
        enumName = "ACTION_TURN_RIGHT";
        desc = `Step ${index + 1}: Rotate Right 90 Deg`;
      }
      return `  { ${enumName}, "${desc}" },`;
    })
    .join("\n");

  const startCoord = `(${config.start.row}, ${config.start.col})`;
  const goalCoord = `(${config.goal.row}, ${config.goal.col})`;
  const generatedDate = new Date().toISOString();

  return `/*
 * =====================================================================
 * ESP32 Autonomous Maze Navigator - Generated Physical Firmware
 * =====================================================================
 * Robot: ${robotName}
 * Generated: ${generatedDate}
 * Maze Size: ${config.rows} x ${config.cols}
 * Start Position: ${startCoord} | Facing: ${config.initialDirection}
 * Goal Position:  ${goalCoord}
 * Total Path Moves: ${path.length > 0 ? path.length - 1 : 0} cell movements
 * Total Instructions: ${actions.length} action steps
 *
 * HARDWARE CONFIGURATION (DO NOT MODIFY PINS):
 * - Left IR Sensor:  GPIO 34 (Input-only)
 * - Front IR Sensor: GPIO 35 (Input-only)
 * - Right IR Sensor: GPIO 36 (VP / Input-only)
 * - Motor Driver: L298N Dual H-Bridge
 *   - ENA (Left PWM):   GPIO 25
 *   - IN1 (Left Dir 1): GPIO 26
 *   - IN2 (Left Dir 2): GPIO 27
 *   - IN3 (Right Dir 1):GPIO 18
 *   - IN4 (Right Dir 2):GPIO 19
 *   - ENB (Right PWM):  GPIO 14
 * =====================================================================
 */

#include <Arduino.h>

// --- PIN DEFINITIONS ---
const int PIN_LEFT_IR   = 34;
const int PIN_FRONT_IR  = 35;
const int PIN_RIGHT_IR  = 36;

const int PIN_ENA = 25;
const int PIN_IN1 = 26;
const int PIN_IN2 = 27;
const int PIN_IN3 = 18;
const int PIN_IN4 = 19;
const int PIN_ENB = 14;

// On-board LED for status
const int PIN_LED = 2;

// --- PWM SPEED & TIMING CONFIGURATION ---
// Calibrate these timings for your robot. Timed motion is an estimate, not
// a guarantee of exact cell distance or exact 90-degree rotation:
const int MOTOR_PWM_SPEED   = ${speedPwm};   // Motor duty cycle (0-255)
const int MOVE_FORWARD_MS   = ${forwardMs};   // Approximate one-cell movement time
const int TURN_90_DEG_MS    = ${turnMs};   // Approximate 90-degree turn time
const int STEP_SETTLE_MS    = ${settleMs};   // Rest delay between movements for inertia damping
const bool ENABLE_IR_SAFETY = ${useIrSafety ? "true" : "false"}; // Stop if unexpected obstacle detected

// --- ACTIONS DEFINITION ---
enum ActionType {
  ACTION_FORWARD,
  ACTION_TURN_LEFT,
  ACTION_TURN_RIGHT,
  ACTION_STOP
};

struct Step {
  ActionType action;
  const char* description;
};

// --- PRE-CALCULATED MAZE SHORTEST PATH INSTRUCTIONS ---
const Step PLANNED_PATH[] = {
${stepsCode}
};
const int TOTAL_STEPS = sizeof(PLANNED_PATH) / sizeof(PLANNED_PATH[0]);

// --- ESP32 Arduino Core 3.x LEDC PWM configuration ---
const int PWM_FREQ       = 1000;
const int PWM_RESOLUTION = 8;

// Most digital IR obstacle modules used here are active-LOW: LOW means an
// obstacle was detected. Confirm this polarity with the actual sensor modules.
const bool IR_OBSTACLE_ACTIVE_LOW = true;

bool isObstacleDetected(int sensorPin) {
  const int sensorState = digitalRead(sensorPin);
  return IR_OBSTACLE_ACTIVE_LOW ? sensorState == LOW : sensorState == HIGH;
}

void setMotorSpeeds(int leftPwm, int rightPwm) {
  ledcWrite(PIN_ENA, constrain(leftPwm, 0, 255));
  ledcWrite(PIN_ENB, constrain(rightPwm, 0, 255));
}

void stopMotors() {
  digitalWrite(PIN_IN1, LOW);
  digitalWrite(PIN_IN2, LOW);
  digitalWrite(PIN_IN3, LOW);
  digitalWrite(PIN_IN4, LOW);
  setMotorSpeeds(0, 0);
}

void moveForward() {
  // Left Motor Forward: IN1 LOW, IN2 HIGH
  digitalWrite(PIN_IN1, LOW);
  digitalWrite(PIN_IN2, HIGH);

  // Right Motor Forward: IN3 HIGH, IN4 LOW
  digitalWrite(PIN_IN3, HIGH);
  digitalWrite(PIN_IN4, LOW);

  setMotorSpeeds(MOTOR_PWM_SPEED, MOTOR_PWM_SPEED);
}

void turnLeft() {
  // Left Motor Reverse, Right Motor Forward (In-place spin)
  digitalWrite(PIN_IN1, HIGH);
  digitalWrite(PIN_IN2, LOW);
  digitalWrite(PIN_IN3, HIGH);
  digitalWrite(PIN_IN4, LOW);

  setMotorSpeeds(MOTOR_PWM_SPEED, MOTOR_PWM_SPEED);
}

void turnRight() {
  // Left Motor Forward, Right Motor Reverse (In-place spin)
  digitalWrite(PIN_IN1, LOW);
  digitalWrite(PIN_IN2, HIGH);
  digitalWrite(PIN_IN3, LOW);
  digitalWrite(PIN_IN4, HIGH);

  setMotorSpeeds(MOTOR_PWM_SPEED, MOTOR_PWM_SPEED);
}

void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println("==================================================");
  Serial.println("ESP32 Autonomous Maze Runner Initialized");
  Serial.printf("Total path steps to execute: %d\\n", TOTAL_STEPS);
  Serial.println("Place the robot at Start cell: ${startCoord}");
  Serial.println("Oriented facing: ${config.initialDirection}");
  Serial.println("==================================================");

  // IR Sensor Inputs
  pinMode(PIN_LEFT_IR, INPUT);
  pinMode(PIN_FRONT_IR, INPUT);
  pinMode(PIN_RIGHT_IR, INPUT);

  // Motor Driver Outputs
  pinMode(PIN_IN1, OUTPUT);
  pinMode(PIN_IN2, OUTPUT);
  pinMode(PIN_IN3, OUTPUT);
  pinMode(PIN_IN4, OUTPUT);
  pinMode(PIN_ENA, OUTPUT);
  pinMode(PIN_ENB, OUTPUT);
  pinMode(PIN_LED, OUTPUT);

  // Establish a stopped state before configuring PWM.
  digitalWrite(PIN_IN1, LOW);
  digitalWrite(PIN_IN2, LOW);
  digitalWrite(PIN_IN3, LOW);
  digitalWrite(PIN_IN4, LOW);
  digitalWrite(PIN_ENA, LOW);
  digitalWrite(PIN_ENB, LOW);

  // ESP32 Arduino Core 3.x attaches LEDC PWM directly to each GPIO pin.
  const bool leftPwmAttached = ledcAttach(PIN_ENA, PWM_FREQ, PWM_RESOLUTION);
  const bool rightPwmAttached = ledcAttach(PIN_ENB, PWM_FREQ, PWM_RESOLUTION);

  if (!leftPwmAttached || !rightPwmAttached) {
    // Explicitly zero whichever PWM channel attached, then hold enable pins LOW.
    if (leftPwmAttached) ledcWrite(PIN_ENA, 0);
    if (rightPwmAttached) ledcWrite(PIN_ENB, 0);
    digitalWrite(PIN_IN1, LOW);
    digitalWrite(PIN_IN2, LOW);
    digitalWrite(PIN_IN3, LOW);
    digitalWrite(PIN_IN4, LOW);
    digitalWrite(PIN_ENA, LOW);
    digitalWrite(PIN_ENB, LOW);
    Serial.println("ERROR: Failed to initialize motor PWM. Motors remain stopped.");
    while (true) {
      delay(1000);
    }
  }

  stopMotors();

  // 5-second safety countdown before movement begins
  Serial.println("Starting in 5 seconds... Stand clear!");
  for (int i = 5; i > 0; i--) {
    Serial.printf("T-minus %d...\\n", i);
    digitalWrite(PIN_LED, HIGH);
    delay(200);
    digitalWrite(PIN_LED, LOW);
    delay(800);
  }

  Serial.println(">>> RUN COMMENCED! <<<");
  digitalWrite(PIN_LED, HIGH);

  // Execute Planned Path Steps Sequentially
  for (int i = 0; i < TOTAL_STEPS; i++) {
    Step currentStep = PLANNED_PATH[i];
    Serial.printf("[%d/%d] Executing: %s\\n", i + 1, TOTAL_STEPS, currentStep.description);

    switch (currentStep.action) {
      case ACTION_FORWARD: {
        // Optional IR safety check before forward move
        if (ENABLE_IR_SAFETY && isObstacleDetected(PIN_FRONT_IR)) {
          Serial.println("SAFETY STOP: Front IR sensor detected an obstacle.");
          Serial.println("Planned route aborted. Clear the obstacle and reset the robot.");
          stopMotors();
          // Do not resume automatically: the route may no longer be safe.
          while (true) {
            digitalWrite(PIN_LED, !digitalRead(PIN_LED));
            delay(250);
            stopMotors();
          }
        }
        moveForward();
        delay(MOVE_FORWARD_MS);
        break;
      }

      case ACTION_TURN_LEFT: {
        turnLeft();
        delay(TURN_90_DEG_MS);
        break;
      }

      case ACTION_TURN_RIGHT: {
        turnRight();
        delay(TURN_90_DEG_MS);
        break;
      }

      case ACTION_STOP:
      default:
        stopMotors();
        break;
    }

    // Stop and settle inertia between discrete grid cell actions
    stopMotors();
    delay(STEP_SETTLE_MS);
  }

  // The planned sequence has finished. Without position feedback, physical
  // arrival at the goal cannot be independently verified.
  Serial.println("==================================================");
  Serial.println("PLANNED SEQUENCE COMPLETE.");
  Serial.println("Goal arrival is not verified by this timed-motion firmware.");
  Serial.println("==================================================");
  stopMotors();

  // Completion blink
  while (true) {
    digitalWrite(PIN_LED, !digitalRead(PIN_LED));
    delay(250);
  }
}

void loop() {
  // All sequence execution is managed safely in setup()
}
`;
}
