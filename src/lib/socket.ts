import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { PresenceUser } from "@/types";

let io: Server | null = null;

// Track online users per project room
const projectPresence = new Map<string, Map<string, PresenceUser>>();

export function initSocketServer(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
    },
  });

  // Auth middleware — validate JWT on connection
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error("Authentication required"));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
        userId: string;
        email: string;
      };
      socket.data.userId = decoded.userId;
      socket.data.email = decoded.email;
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket: Socket) => {
    console.log(`User connected: ${socket.data.userId}`);

    // Join a project room
    socket.on("project:join", async ({ projectId, user }: { projectId: string; user: PresenceUser }) => {
      const room = `project:${projectId}`;
      socket.join(room);
      socket.data.currentProject = projectId;
      socket.data.userInfo = user;

      // Track presence
      if (!projectPresence.has(projectId)) {
        projectPresence.set(projectId, new Map());
      }
      projectPresence.get(projectId)!.set(socket.data.userId, user);

      // Broadcast updated presence to all in room
      const users = Array.from(projectPresence.get(projectId)!.values());
      io!.to(room).emit("presence:update", { users });
    });

    // Leave a project room
    socket.on("project:leave", ({ projectId }: { projectId: string }) => {
      const room = `project:${projectId}`;
      socket.leave(room);
      removePresence(socket, projectId);
    });

    // Handle disconnect
    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.data.userId}`);
      if (socket.data.currentProject) {
        removePresence(socket, socket.data.currentProject);
      }
    });
  });

  return io;
}

function removePresence(socket: Socket, projectId: string) {
  const room = `project:${projectId}`;
  const presence = projectPresence.get(projectId);
  if (presence) {
    presence.delete(socket.data.userId);
    if (presence.size === 0) {
      projectPresence.delete(projectId);
    } else {
      const users = Array.from(presence.values());
      io?.to(room).emit("presence:update", { users });
    }
  }
}

export function getIO(): Server {
  if (!io) {
    throw new Error("Socket.io not initialized");
  }
  return io;
}

// Broadcast helpers for use in API routes
export function broadcastToProject(projectId: string, event: string, data: unknown) {
  if (io) {
    io.to(`project:${projectId}`).emit(event, data);
  }
}
