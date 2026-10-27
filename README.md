# Autonomous Maze Solving and Mapping Robot

A production-grade, full-stack robotics simulation and control web application built with **React**, **TypeScript**, **Tailwind CSS**, **Node.js**, **Express**, and **Socket.IO**. 

Simulates, visualizes, and maps autonomous grid maze exploration with strict ground-truth information isolation, Breadth-First Search (BFS) pathfinding, and an extensible hardware bridge for a physical ESP32 robot.

---

## Features

- **Interactive Maze Editor (`/maze-editor`)**:
  - Configure grid dimensions ($3 \times 3$ to $30 \times 30$).
  - Click walls to add/remove barriers with canonical shared-edge consistency.
  - Set starting cell, goal cell, and initial robot orientation.
  - Built-in test presets (Corridor, Dead-End Challenge, Multiple Intersections, Backtracking, Known Shortest Path, Unreachable Goal).
  - JSON import and export with strict schema validation.
- **Simulation Engine (`/simulation`)**:
  - Emulates 3 directional digital IR obstacle sensors (Left, Front, Right).
  - **Ground Truth vs. Knowledge Map Isolation**: The exploration algorithm navigates solely using its accumulated map and active sensor observations; it never queries the hidden ground truth.
  - Autonomous exploration strategies: Systematic with BFS backtracking, Left-Hand Wall Follower, Right-Hand Wall Follower.
  - Loop detection and step-limit protection.
- **Mapping & BFS Shortest Path (`/mapping`)**:
  - Builds traversable graph of confirmed open passages cell by cell.
  - Computes optimal shortest route from robot to goal using Breadth-First Search.
  - Translates path into discrete physical actuation sequences (`FORWARD`, `TURN_LEFT`, `TURN_RIGHT`).
  - Animate and execute the planned path.
- **Real-Time Telemetry & Hardware Bridge (`/telemetry`)**:
  - Displays Left, Front, and Right IR digital sensor states (`HIGH`/`LOW`, `BLOCKED`/`CLEAR`, polarity, freshness).
  - L298N dual DC motor driver open-loop PWM duty cycle commands.
  - Safe physical mode toggle (disabled by default, no fake battery or encoder numbers).
  - Prominent Emergency STOP control.
- **Dashboard (`/`) & Analytics (`/history`, `/settings`)**:
  - Live central visualization, exploration metrics, and scrolling event log.
  - Audit trail of previous runs during the current session.

---

## Technology Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide React, React Router 6, Socket.IO Client.
- **Backend**: Node.js, Express, Socket.IO, TypeScript, Zod.
- **Testing**: Vitest, React Testing Library, Supertest.
- **Target OS**: macOS (Apple Silicon compatible, no Docker required).

---

## Monorepo Structure

```text
autonomous-maze-robot/
├── apps/
│   ├── web/                     # React + Vite frontend application
│   │   ├── src/
│   │   │   ├── components/      # MazeGrid, SensorPanel, MotorPanel, ControlBar, etc.
│   │   │   ├── pages/           # Dashboard, Editor, Simulation, Mapping, Telemetry, etc.
│   │   │   ├── hooks/           # useSimulation hook & Socket.IO sync
│   │   │   └── services/        # REST API & Socket client
│   └── server/                  # Node.js + Express + Socket.IO authoritative engine
│       ├── src/
│       │   ├── domain/          # Maze, KnowledgeMap, Orientation, BFS, Strategies
│       │   ├── simulation/      # SimulationEngine, SensorSimulator
│       │   ├── adapters/        # RobotAdapter, SimulatedAdapter, Esp32Adapter
│       │   ├── services/        # SimulationService, MazeService, RobotService
│       │   ├── routes/          # Express REST API routes
│       │   └── sockets/         # Socket.IO event handlers
│       └── tests/               # Domain, BFS, Exploration, Sensor & API tests
├── packages/
│   └── shared/                  # Shared TypeScript types, schemas, and event definitions
├── docs/                        # Architecture, API specification, and hardware integration guide
├── package.json
└── README.md
```

---

## Quick Start (macOS / Local Development)

### 1. Prerequisites
- **Node.js**: v20 or higher (v25 recommended).
- **npm**: v10 or higher.

### 2. Installation
From the root directory:
```bash
npm install
npm run build --workspace=@maze/shared
```

### 3. Run Automated Tests
Execute the entire test suite across both frontend and backend:
```bash
npm test
```
Or run individual test suites:
```bash
npm run test:server   # Unit, BFS, exploration, and API tests (26 tests)
npm run test:web      # Frontend React component tests (4 tests)
```

### 4. Launch Application in Development Mode
Run both backend and frontend concurrently with hot-reloading:
```bash
npm run dev
```
Alternatively, launch them in separate terminal windows:
```bash
# Terminal 1: Backend Server (runs on http://localhost:3001)
npm run dev:server

# Terminal 2: Web Client (runs on http://localhost:5173)
npm run dev:web
```

Open your browser at **`http://localhost:5173`**.

---

## Hardware Integration (ESP32 + L298N)

The web platform includes an `Esp32RobotAdapter` ready for hardware tethering.

### Hardware Pinout
- **Left IR Sensor**: GPIO 34 (Input-only)
- **Front IR Sensor**: GPIO 35 (Input-only)
- **Right IR Sensor**: GPIO 36 / VP (Input-only)
- **Left Motor (L298N)**: ENA: GPIO 25, IN1: GPIO 26, IN2: GPIO 27
- **Right Motor (L298N)**: ENB: GPIO 14, IN3: GPIO 18, IN4: GPIO 19
- **Forward Motor Logic**:
  - Left Motor Forward: `IN1 LOW`, `IN2 HIGH`
  - Right Motor Forward: `IN3 HIGH`, `IN4 LOW`

See [`docs/hardware-integration.md`](docs/hardware-integration.md) for full wiring schematics and a complete, flashable Arduino C++ firmware sketch with watchdog protection.

---

## Documentation Links

- [System Architecture](docs/architecture.md)
- [REST API & Socket.IO Specification](docs/api.md)
- [ESP32 Hardware Integration & Firmware](docs/hardware-integration.md)

---

## License
MIT

