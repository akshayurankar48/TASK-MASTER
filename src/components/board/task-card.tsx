"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "framer-motion";
import { MessageSquare, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ITask, TaskPriority } from "@/types";
import { useBoardStore } from "@/stores/board-store";
import { cn } from "@/lib/utils";

const PRIORITY_CONFIG: Record<
  TaskPriority,
  { label: string; color: string; border: string }
> = {
  urgent: { label: "Urgent", color: "bg-red-500/10 text-red-500", border: "border-l-red-500" },
  high: { label: "High", color: "bg-orange-500/10 text-orange-500", border: "border-l-orange-500" },
  medium: { label: "Medium", color: "bg-yellow-500/10 text-yellow-500", border: "border-l-yellow-500" },
  low: { label: "Low", color: "bg-green-500/10 text-green-500", border: "border-l-green-500" },
};

interface TaskCardProps {
  task: ITask;
  commentCount?: number;
}

export function TaskCard({ task, commentCount = 0 }: TaskCardProps) {
  const openTaskDetail = useBoardStore((s) => s.openTaskDetail);
  const priority = PRIORITY_CONFIG[task.priority];

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task._id.toString(),
    data: { task },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ scale: 1.01 }}
      onClick={() => openTaskDetail(task._id.toString())}
      className={cn(
        "bg-card border border-border rounded-lg p-3 cursor-grab active:cursor-grabbing",
        "hover:border-primary/30 hover:shadow-sm transition-colors",
        "border-l-[3px]",
        priority.border,
        isDragging && "opacity-50 shadow-lg scale-105 z-50"
      )}
    >
      {/* Title */}
      <p className="text-sm font-medium leading-tight mb-2 line-clamp-2">
        {task.title}
      </p>

      {/* Priority & Due Date */}
      <div className="flex items-center gap-2 mb-2">
        <Badge variant="secondary" className={cn("text-[10px] px-1.5 py-0", priority.color)}>
          {priority.label}
        </Badge>
        {task.dueDate && (
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Calendar className="h-3 w-3" />
            {new Date(task.dueDate).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}
          </span>
        )}
      </div>

      {/* Assignees & Comments */}
      <div className="flex items-center justify-between">
        <div className="flex -space-x-1.5">
          {((task.assignees as unknown as Array<{ _id: string; name: string }>) || [])
            .slice(0, 3)
            .map((assignee) => (
              <Avatar key={assignee._id} className="h-5 w-5 border border-background">
                <AvatarFallback className="text-[8px]">
                  {assignee.name?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            ))}
        </div>
        {commentCount > 0 && (
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <MessageSquare className="h-3 w-3" />
            {commentCount}
          </span>
        )}
      </div>
    </motion.div>
  );
}
