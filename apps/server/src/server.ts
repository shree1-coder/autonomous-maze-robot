import http from "http";
import { Server } from "socket.io";
import { createApp } from "./app.js";
import { registerSocketHandlers } from "./sockets/socketHandlers.js";
import { ClientToServerEvents, ServerToClientEvents } from "@maze/shared";

const PORT = parseInt(process.env.PORT || "3001", 10);

const app = createApp();
const server = http.createServer(app);

const io = new Server<ClientToServerEvents, ServerToClientEvents>(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

registerSocketHandlers(io);

server.listen(PORT, () => {
  console.log(`Autonomous Maze Robot Backend listening on http://localhost:${PORT}`);
});

export { app, server, io };

