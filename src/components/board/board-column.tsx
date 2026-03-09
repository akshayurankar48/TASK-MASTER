"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TaskCard } from "./task-card";
import { ITask, TaskStatus } from "@/types";
import { cn } from "@/lib/utils";

interface BoardColumnProps {
  id: TaskStatus;
  label: string;
  tasks: ITask[];
  onAddTask: (status: TaskStatus) => void;
}

export function BoardColumn({ id, label, tasks, onAddTask }: BoardColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div className="flex flex-col w-72 shrink-0">
      {/* Column header */}
      <div className="flex items-center justify-between px-2 pb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium">{label}</h3>
          <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
            {tasks.length}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={() => onAddTask(id)}
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Card list */}
      <div
        ref={setNodeRef}
        className={cn(
          "flex-1 space-y-2 p-1 rounded-lg min-h-[200px] transition-colors",
          isOver && "bg-primary/5 ring-1 ring-primary/20"
        )}
      >
        <SortableContext
          items={tasks.map((t) => t._id.toString())}
          strategy={verticalListSortingStrategy}
        >
          <AnimatePresence mode="popLayout">
            {tasks.map((task) => (
              <TaskCard key={task._id.toString()} task={task} />
            ))}
          </AnimatePresence>
        </SortableContext>
      </div>
    </div>
  );
}
