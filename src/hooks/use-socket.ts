"use client";

import { useEffect, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { PresenceUser } from "@/types";

let globalSocket: Socket | null = null;

export function getSocket(token: string): Socket {
  if (!globalSocket) {
    globalSocket = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3000", {
      auth: { token },
      autoConnect: false,
    });
  }
  return globalSocket;
}

export function useSocket(token: string | null) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!token) return;

    const socket = getSocket(token);
    socketRef.current = socket;

    if (!socket.connected) {
      socket.connect();
    }

    return () => {
      // Don't disconnect on unmount — keep alive for the session
    };
  }, [token]);

  return socketRef.current;
}

export function useProjectRoom(
  socket: Socket | null,
  projectId: string | null,
  user: PresenceUser | null
) {
  const joinedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!socket || !projectId || !user) return;

    // Leave previous room
    if (joinedRef.current && joinedRef.current !== projectId) {
      socket.emit("project:leave", { projectId: joinedRef.current });
    }

    // Join new room
    socket.emit("project:join", { projectId, user });
    joinedRef.current = projectId;

    return () => {
      if (joinedRef.current) {
        socket.emit("project:leave", { projectId: joinedRef.current });
        joinedRef.current = null;
      }
    };
  }, [socket, projectId, user]);
}

export function useSocketEvent<T>(
  socket: Socket | null,
  event: string,
  handler: (data: T) => void
) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  const stableHandler = useCallback((data: T) => {
    handlerRef.current(data);
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.on(event, stableHandler);
    return () => {
      socket.off(event, stableHandler);
    };
  }, [socket, event, stableHandler]);
}
