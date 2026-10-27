# API Documentation

## Base URL
Default local backend server runs on `http://localhost:3001` with an automated proxy in the Vite development server (`http://localhost:5173/api`).

---

## REST Endpoints

### 1. System Health
- **`GET /api/health`**
  - **Description**: Returns operational health, system uptime, and service status.
  - **Response**:
    ```json
    {
      "status": "ok",
      "timestamp": "2026-10-28T00:00:00.000Z",
      "uptime": 45.2,
      "service": "Autonomous Maze Robot Server"
    }
    ```

---

### 2. Maze Management
- **`GET /api/maze`**
  - **Description**: Retrieves current maze configuration and canonical ground-truth wall geometry.
- **`POST /api/maze/config`**
  - **Description**: Updates grid dimensions, start position, goal position, and initial orientation.
  - **Body**:
    ```json
    {
      "rows": 10,
      "cols": 10,
      "start": { "row": 9, "col": 0 },
      "goal": { "row": 0, "col": 9 },
      "initialDirection": "NORTH"
    }
    ```
- **`POST /api/maze/toggle-wall`**
  - **Description**: Toggles an internal horizontal or vertical wall segment.
  - **Body**:
    ```json
    {
      "type": "horizontal",
      "row": 3,
      "col": 2
    }
    ```
- **`POST /api/maze/clear`**
  - **Description**: Clears all internal walls while keeping perimeter boundaries intact.
- **`GET /api/maze/export`**
  - **Description**: Exports the full maze representation as JSON conforming to `MazeExportFormat`.
- **`POST /api/maze/import`**
  - **Description**: Validates and loads an external maze JSON object.
- **`GET /api/maze/presets`**
  - **Description**: Lists built-in maze preset names (`empty`, `corridor`, `dead-end`, `intersections`, `backtracking`, `known-path`, `unreachable`).
- **`POST /api/maze/presets/:name`**
  - **Description**: Loads a specified built-in preset challenge.
- **`GET /api/maze/knowledge`**
  - **Description**: Retrieves the robot's current accumulated knowledge map and exploration statistics.

---

### 3. Simulation Control
- **`GET /api/simulation/state`**
  - **Description**: Retrieves authoritative simulation state, robot coordinates, orientation, sensors, and recent logs.
- **`POST /api/simulation/start`**
  - **Description**: Begins continuous autonomous exploration.
- **`POST /api/simulation/pause`**
  - **Description**: Pauses continuous simulation.
- **`POST /api/simulation/resume`**
  - **Description**: Resumes simulation from paused state.
- **`POST /api/simulation/step`**
  - **Description**: Executes a single discrete simulation cycle.
- **`POST /api/simulation/stop`**
  - **Description**: Idempotently halts simulation and commands all motors to stop.
- **`POST /api/simulation/reset`**
  - **Description**: Resets robot to starting position and clears accumulated knowledge map.
- **`POST /api/simulation/config`**
  - **Description**: Configures simulation interval speed (`SLOW`, `NORMAL`, `FAST`, `MAX`) and strategy (`SYSTEMATIC`, `WALL_FOLLOWER_LEFT`, `WALL_FOLLOWER_RIGHT`).

---

### 4. Pathfinding
- **`POST /api/pathfinding/solve`**
  - **Description**: Runs Breadth-First Search on the currently confirmed `OPEN` traversable corridors.
  - **Response**:
    ```json
    {
      "found": true,
      "path": [{ "row": 9, "col": 0 }, { "row": 8, "col": 0 }, ...],
      "actions": ["FORWARD", "TURN_RIGHT", "FORWARD"],
      "cellMoves": 14,
      "turns": 3,
      "message": "Shortest path: 14 moves, 3 turns"
    }
    ```
- **`POST /api/pathfinding/execute`**
  - **Description**: Commands the simulated robot to execute the calculated shortest path step-by-step.

---

### 5. Robot Telemetry & Hardware Control
- **`GET /api/robot/telemetry`**
  - **Description**: Retrieves telemetry from active robot adapter (sensors, motor commands, hardware connection status).
- **`POST /api/robot/command`**
  - **Description**: Sends a direct motor actuation command (`FORWARD`, `TURN_LEFT`, `TURN_RIGHT`, `REVERSE`, `STOP`).
- **`POST /api/robot/mode`**
  - **Description**: Switches operating mode between `SIMULATION` and `PHYSICAL`.
- **`POST /api/robot/stop`**
  - **Description**: Immediate emergency stop command.

---

## Socket.IO Real-Time Events

### Server-to-Client (`ServerToClientEvents`)
- `simulation:state`: Authoritative state broadcast containing robot pose, sensors, map, and statistics.
- `simulation:started`: Notification when exploration loop begins.
- `simulation:paused`: Notification when simulation pauses.
- `simulation:completed`: Broadcast on goal arrival or termination with performance metrics.
- `robot:telemetry`: Periodic or event-driven hardware telemetry updates.
- `maze:updated`: Emitted whenever maze walls or dimensions are modified.
- `path:updated`: Emitted when a shortest path is calculated or updated.

### Client-to-Server (`ClientToServerEvents`)
- `simulation:start`: Request to start exploration.
- `simulation:pause`: Request to pause exploration.
- `simulation:resume`: Request to resume exploration.
- `simulation:step`: Request single execution step.
- `simulation:reset`: Request reset to initial cell.
- `simulation:stop`: Request immediate stop.
- `simulation:solve`: Request BFS path computation.
- `simulation:followPath`: Request execution of planned path.

