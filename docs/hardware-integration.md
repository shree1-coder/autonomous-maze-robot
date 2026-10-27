# ESP32 Hardware Integration Guide

This document specifies the hardware interface, GPIO wiring, communication protocol, and sample firmware for connecting the Autonomous Maze Solving Robot web platform to an actual physical robot.

---

## 1. Physical Hardware Overview

The physical robot consists of:
- **Microcontroller**: ESP32 DevKit V1 (30-pin or 38-pin version).
- **Motor Driver**: L298N Dual H-Bridge Motor Driver module.
- **Motors**: Two yellow TT DC geared motors (3V–6V, open-loop, no wheel encoders).
- **Sensors**: Three digital IR obstacle avoidance sensors (LM393 comparator with potentiometer sensitivity adjustment).
- **Power Supply**: 2-cell 18650 Li-ion battery pack (7.4V nominal) powering the L298N motor driver, with regulated 5V powering the ESP32 DevKit through VIN.

---

## 2. GPIO Pinout Mapping

> [!IMPORTANT]
> Do not alter the following GPIO mappings. These match the existing hardware wiring. Note that ESP32 GPIO pins 34, 35, and 36 are input-only and must never be configured as outputs.

| Module | Pin Function | ESP32 GPIO | Mode | Description |
| :--- | :--- | :--- | :--- | :--- |
| **Left IR Sensor** | OUT | **GPIO 34** | Input | Digital obstacle detect (Left) |
| **Front IR Sensor** | OUT | **GPIO 35** | Input | Digital obstacle detect (Front) |
| **Right IR Sensor** | OUT | **GPIO 36 (VP)**| Input | Digital obstacle detect (Right) |
| **L298N Motor Driver** | ENA (PWM) | **GPIO 25** | Output | Left motor speed control |
| **L298N Motor Driver** | IN1 | **GPIO 26** | Output | Left motor direction pin 1 |
| **L298N Motor Driver** | IN2 | **GPIO 27** | Output | Left motor direction pin 2 |
| **L298N Motor Driver** | IN3 | **GPIO 18** | Output | Right motor direction pin 1 |
| **L298N Motor Driver** | IN4 | **GPIO 19** | Output | Right motor direction pin 2 |
| **L298N Motor Driver** | ENB (PWM) | **GPIO 14** | Output | Right motor speed control |

---

## 3. Motor Direction Truth Table

Based on the verified physical motor wiring:

### Forward Motion
```cpp
// Left motor forward
digitalWrite(IN1, LOW);
digitalWrite(IN2, HIGH);

// Right motor forward
digitalWrite(IN3, HIGH);
digitalWrite(IN4, LOW);
```

### Turning & Reverse
- **Turn Left (Spot turn)**: Left motor Reverse (`IN1 HIGH, IN2 LOW`), Right motor Forward (`IN3 HIGH, IN4 LOW`).
- **Turn Right (Spot turn)**: Left motor Forward (`IN1 LOW, IN2 HIGH`), Right motor Reverse (`IN3 LOW, IN4 HIGH`).
- **Reverse**: Left motor Reverse (`IN1 HIGH, IN2 LOW`), Right motor Reverse (`IN3 LOW, IN4 HIGH`).
- **Stop**: All IN pins `LOW`, PWM duty cycle `0`.

---

## 4. Communication Protocol

The ESP32 communicates with the Node.js backend over local Wi-Fi (HTTP REST / WebSocket JSON packets).

### Command Packet (Backend $\rightarrow$ ESP32)
`POST /api/command`
```json
{
  "action": "FORWARD",
  "speedPwm": 200,
  "durationMs": 450,
  "timestamp": 1729000000000
}
```

### Telemetry Packet (ESP32 $\rightarrow$ Backend)
`GET /api/telemetry`
```json
{
  "leftSensor": 1,
  "frontSensor": 0,
  "rightSensor": 1,
  "lastAction": "FORWARD",
  "uptimeMs": 35210
}
```
*Note: In ACTIVE_LOW polarity, 0 indicates an obstacle (BLOCKED), while 1 indicates CLEAR.*

### Safety Watchdog
The sample firmware includes a 600 ms communication watchdog. Confirm this timeout is appropriate for your command cadence before operating the robot; it stops motors when commands stop arriving. This sample is an HTTP control example, separate from the generated precomputed-path sketch.

---

## 5. Sample ESP32 Arduino C++ Firmware

```cpp
#include <WiFi.h>
#include <WebServer.h>
#include <ArduinoJson.h>

// Wi-Fi credentials
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// Pin Definitions
const int PIN_LEFT_IR   = 34;
const int PIN_FRONT_IR  = 35;
const int PIN_RIGHT_IR  = 36;

const int PIN_ENA = 25;
const int PIN_IN1 = 26;
const int PIN_IN2 = 27;
const int PIN_IN3 = 18;
const int PIN_IN4 = 19;
const int PIN_ENB = 14;

// ESP32 Arduino Core 3.x LEDC PWM configuration
const int PWM_FREQ = 1000;
const int PWM_RES = 8; // 8-bit (0-255)
const bool IR_OBSTACLE_ACTIVE_LOW = true; // Confirm against the actual modules

WebServer server(80);
unsigned long lastCommandTime = 0;
const unsigned long WATCHDOG_TIMEOUT_MS = 600;

void setMotorSpeeds(int leftPwm, int rightPwm) {
  // Core 3.x ledcWrite() takes the GPIO pin, not a channel number.
  ledcWrite(PIN_ENA, constrain(leftPwm, 0, 255));
  ledcWrite(PIN_ENB, constrain(rightPwm, 0, 255));
}

void executeMotorAction(String action, int speed) {
  if (action == "FORWARD") {
    digitalWrite(PIN_IN1, LOW);  digitalWrite(PIN_IN2, HIGH);
    digitalWrite(PIN_IN3, HIGH); digitalWrite(PIN_IN4, LOW);
    setMotorSpeeds(speed, speed);
  } else if (action == "TURN_LEFT") {
    digitalWrite(PIN_IN1, HIGH); digitalWrite(PIN_IN2, LOW);
    digitalWrite(PIN_IN3, HIGH); digitalWrite(PIN_IN4, LOW);
    setMotorSpeeds(speed, speed);
  } else if (action == "TURN_RIGHT") {
    digitalWrite(PIN_IN1, LOW);  digitalWrite(PIN_IN2, HIGH);
    digitalWrite(PIN_IN3, LOW);  digitalWrite(PIN_IN4, HIGH);
    setMotorSpeeds(speed, speed);
  } else if (action == "REVERSE") {
    digitalWrite(PIN_IN1, HIGH); digitalWrite(PIN_IN2, LOW);
    digitalWrite(PIN_IN3, LOW);  digitalWrite(PIN_IN4, HIGH);
    setMotorSpeeds(speed, speed);
  } else { // STOP
    digitalWrite(PIN_IN1, LOW); digitalWrite(PIN_IN2, LOW);
    digitalWrite(PIN_IN3, LOW); digitalWrite(PIN_IN4, LOW);
    setMotorSpeeds(0, 0);
  }
}

void handleCommand() {
  if (server.hasArg("plain") == false) {
    server.send(400, "application/json", "{\"error\":\"Missing body\"}");
    return;
  }
  StaticJsonDocument<256> doc;
  DeserializationError error = deserializeJson(doc, server.arg("plain"));
  if (error) {
    server.send(400, "application/json", "{\"error\":\"Invalid JSON\"}");
    return;
  }

  String action = doc["action"] | "STOP";
  int speed = doc["speedPwm"] | 190;
  
  executeMotorAction(action, speed);
  lastCommandTime = millis();

  server.send(200, "application/json", "{\"status\":\"ok\"}");
}

void handleTelemetry() {
  StaticJsonDocument<256> doc;
  doc["leftSensor"] = digitalRead(PIN_LEFT_IR);
  doc["frontSensor"] = digitalRead(PIN_FRONT_IR);
  doc["rightSensor"] = digitalRead(PIN_RIGHT_IR);
  doc["uptimeMs"] = millis();

  String response;
  serializeJson(doc, response);
  server.send(200, "application/json", response);
}

void setup() {
  Serial.begin(115200);

  // Setup Sensors (input-only GPIOs)
  pinMode(PIN_LEFT_IR, INPUT);
  pinMode(PIN_FRONT_IR, INPUT);
  pinMode(PIN_RIGHT_IR, INPUT);

  // Setup Motor Control Pins
  pinMode(PIN_IN1, OUTPUT);
  pinMode(PIN_IN2, OUTPUT);
  pinMode(PIN_IN3, OUTPUT);
  pinMode(PIN_IN4, OUTPUT);
  pinMode(PIN_ENA, OUTPUT);
  pinMode(PIN_ENB, OUTPUT);

  // Default to stopped before attaching PWM.
  digitalWrite(PIN_IN1, LOW); digitalWrite(PIN_IN2, LOW);
  digitalWrite(PIN_IN3, LOW); digitalWrite(PIN_IN4, LOW);
  digitalWrite(PIN_ENA, LOW); digitalWrite(PIN_ENB, LOW);

  // ESP32 Arduino Core 3.x API: attach PWM directly to each GPIO.
  const bool leftPwmAttached = ledcAttach(PIN_ENA, PWM_FREQ, PWM_RES);
  const bool rightPwmAttached = ledcAttach(PIN_ENB, PWM_FREQ, PWM_RES);
  if (!leftPwmAttached || !rightPwmAttached) {
    digitalWrite(PIN_ENA, LOW);
    digitalWrite(PIN_ENB, LOW);
    Serial.println("ERROR: Motor PWM initialization failed; motors remain stopped.");
    while (true) {
      delay(1000);
    }
  }

  executeMotorAction("STOP", 0);

  // Connect to Wi-Fi
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected. IP: " + WiFi.localIP().toString());

  server.on("/api/command", HTTP_POST, handleCommand);
  server.on("/api/telemetry", HTTP_GET, handleTelemetry);
  server.begin();
}

void loop() {
  server.handleClient();

  // Watchdog failsafe: automatically stop if communication stalls
  if (millis() - lastCommandTime > WATCHDOG_TIMEOUT_MS) {
    executeMotorAction("STOP", 0);
  }
}
```

