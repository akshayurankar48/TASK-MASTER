"use client";

import { useState, useCallback } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
} from "@dnd-kit/core";
import { BoardColumn } from "./board-column";
import { TaskCard } from "./task-card";
import { CreateTaskDialog } from "./create-task-dialog";
import { TaskDetailPanel } from "./task-detail-panel";
import { useBoardStore, BOARD_COLUMNS } from "@/stores/board-store";
import { useAuthStore } from "@/stores/auth-store";
import { api } from "@/lib/api-client";
import { ITask, TaskStatus } from "@/types";
import { toast } from "sonner";

interface Props {
  projectId: string;
}

export function KanbanBoard({ projectId }: Props) {
  const token = useAuthStore((s) => s.token);
  const { tasks, updateTask, moveTask } = useBoardStore();
  const [activeTask, setActiveTask] = useState<ITask | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createStatus, setCreateStatus] = useState<TaskStatus>("todo");

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  const handleAddTask = useCallback((status: TaskStatus) => {
    setCreateStatus(status);
    setCreateDialogOpen(true);
  }, []);

  function handleDragStart(event: DragStartEvent) {
    const task = tasks.find(
      (t) => t._id.toString() === event.active.id.toString()
    );
    if (task) setActiveTask(task);
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveTask(null);
    const { active, over } = event;
    if (!over || !token) return;

    const taskId = active.id.toString();
    const overId = over.id.toString();

    // Check if dropped on a column
    const isColumn = BOARD_COLUMNS.some((col) => col.id === overId);
    const newStatus = isColumn
      ? (overId as TaskStatus)
      : tasks.find((t) => t._id.toString() === overId)?.status;

    if (!newStatus) return;

    const task = tasks.find((t) => t._id.toString() === taskId);
    if (!task || task.status === newStatus) return;

    // Optimistic update
    moveTask(taskId, newStatus);

    try {
      const res = (await api.updateTask(token, projectId, taskId, {
        status: newStatus,
      })) as { data: ITask };
      updateTask(res.data);
    } catch {
      // Revert on failure
      moveTask(taskId, task.status);
      toast.error("Failed to move task");
    }
  }

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 p-6 overflow-x-auto h-full">
          {BOARD_COLUMNS.map((column) => (
            <BoardColumn
              key={column.id}
              id={column.id}
              label={column.label}
              tasks={tasks.filter((t) => t.status === column.id)}
              onAddTask={handleAddTask}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask && <TaskCard task={activeTask} />}
        </DragOverlay>
      </DndContext>

      <CreateTaskDialog
        projectId={projectId}
        defaultStatus={createStatus}
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />

      <TaskDetailPanel projectId={projectId} />
    </>
  );
}
