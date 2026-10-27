import { io, Socket } from "socket.io-client";
import { ClientToServerEvents, ServerToClientEvents } from "@maze/shared";

// Connect to socket server
export const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io({
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
});

