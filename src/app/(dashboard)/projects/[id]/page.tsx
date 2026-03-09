"use client";

import { useEffect, useState, use } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Settings } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { KanbanBoard } from "@/components/board/kanban-board";
import { useAuthStore } from "@/stores/auth-store";
import { useBoardStore } from "@/stores/board-store";
import { useSocket, useProjectRoom, useSocketEvent } from "@/hooks/use-socket";
import { api } from "@/lib/api-client";
import { ITask, PresenceUser, IComment } from "@/types";
import { toast } from "sonner";

interface Project {
  _id: string;
  name: string;
  description?: string;
  members: Array<{ _id: string; name: string; email: string }>;
}

export default function ProjectBoardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: projectId } = use(params);
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const { setTasks, addTask, updateTask, removeTask, setPresenceUsers } =
    useBoardStore();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  // Socket connection
  const socket = useSocket(token);
  useProjectRoom(
    socket,
    projectId,
    user ? { _id: user._id, name: user.name, avatar: user.avatar } : null
  );

  // Real-time event handlers
  useSocketEvent<ITask>(socket, "task:created", (task) => {
    addTask(task);
    toast.info("New task created", { description: task.title });
  });

  useSocketEvent<ITask>(socket, "task:updated", (task) => {
    updateTask(task);
  });

  useSocketEvent<{ taskId: string }>(socket, "task:deleted", ({ taskId }) => {
    removeTask(taskId);
  });

  useSocketEvent<{ users: PresenceUser[] }>(
    socket,
    "presence:update",
    ({ users }) => {
      setPresenceUsers(users);
    }
  );

  useSocketEvent<IComment>(socket, "comment:added", () => {
    // Comment added — could update comment count on task card
  });

  // Fetch project and tasks
  useEffect(() => {
    if (!token) return;

    async function load() {
      try {
        const [projectRes, tasksRes] = await Promise.all([
          api.getProject(token!, projectId) as Promise<{ data: Project }>,
          api.getTasks(token!, projectId, { limit: "100" }) as Promise<{
            data: ITask[];
          }>,
        ]);

        setProject(projectRes.data);
        setTasks(tasksRes.data || []);
      } catch {
        // Error handled
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [token, projectId, setTasks]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="h-8 w-48 bg-muted animate-pulse rounded mb-4" />
        <div className="flex gap-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="w-72 h-96 bg-muted animate-pulse rounded-lg"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Project header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between px-6 pt-4 pb-2"
      >
        <div className="flex items-center gap-3">
          <Link href="/projects">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-lg font-semibold">{project?.name}</h1>
            {project?.description && (
              <p className="text-xs text-muted-foreground">
                {project.description}
              </p>
            )}
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Settings className="h-4 w-4" />
        </Button>
      </motion.div>

      {/* Board */}
      <div className="flex-1 overflow-hidden">
        <KanbanBoard projectId={projectId} />
      </div>
    </div>
  );
}
