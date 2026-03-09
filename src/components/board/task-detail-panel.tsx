"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useBoardStore, BOARD_COLUMNS } from "@/stores/board-store";
import { useAuthStore } from "@/stores/auth-store";
import { api } from "@/lib/api-client";
import { ITask, TASK_PRIORITY, TaskStatus, TaskPriority } from "@/types";
import { toast } from "sonner";

interface Comment {
  _id: string;
  content: string;
  author: { _id: string; name: string; email: string };
  createdAt: string;
}

interface Props {
  projectId: string;
}

export function TaskDetailPanel({ projectId }: Props) {
  const token = useAuthStore((s) => s.token);
  const { selectedTaskId, isDetailOpen, closeTaskDetail, tasks, updateTask } =
    useBoardStore();
  const task = tasks.find((t) => t._id.toString() === selectedTaskId);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [sendingComment, setSendingComment] = useState(false);

  // Fetch comments
  useEffect(() => {
    if (!task || !token) return;
    api
      .getComments(token, task._id.toString())
      .then((res: unknown) => {
        const data = res as { data: Comment[] };
        setComments(data.data || []);
      })
      .catch(() => {});
  }, [task, token]);

  async function handleStatusChange(newStatus: string) {
    if (!task || !token) return;
    try {
      const res = (await api.updateTask(token, projectId, task._id.toString(), {
        status: newStatus,
      })) as { data: ITask };
      updateTask(res.data);
    } catch {
      toast.error("Failed to update status");
    }
  }

  async function handlePriorityChange(newPriority: string) {
    if (!task || !token) return;
    try {
      const res = (await api.updateTask(token, projectId, task._id.toString(), {
        priority: newPriority,
      })) as { data: ITask };
      updateTask(res.data);
    } catch {
      toast.error("Failed to update priority");
    }
  }

  async function handleAddComment(e: React.FormEvent) {
    e.preventDefault();
    if (!task || !token || !newComment.trim()) return;

    setSendingComment(true);
    try {
      const res = (await api.addComment(
        token,
        task._id.toString(),
        newComment.trim()
      )) as { data: Comment };
      setComments((prev) => [...prev, res.data]);
      setNewComment("");
    } catch {
      toast.error("Failed to add comment");
    } finally {
      setSendingComment(false);
    }
  }

  return (
    <AnimatePresence>
      {isDetailOpen && task && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeTaskDetail}
            className="fixed inset-0 bg-black/20 z-40"
          />

          {/* Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-card border-l border-border shadow-xl z-50 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="font-semibold text-sm truncate pr-4">
                {task.title}
              </h2>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={closeTaskDetail}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <ScrollArea className="flex-1 p-4">
              <div className="space-y-6">
                {/* Status */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Status
                  </label>
                  <Select
                    value={task.status}
                    onValueChange={(v) => v && handleStatusChange(v)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {BOARD_COLUMNS.map((col) => (
                        <SelectItem key={col.id} value={col.id}>
                          {col.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Priority */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Priority
                  </label>
                  <Select
                    value={task.priority}
                    onValueChange={(v) => v && handlePriorityChange(v)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(TASK_PRIORITY).map((p) => (
                        <SelectItem key={p} value={p}>
                          {p.charAt(0).toUpperCase() + p.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Assignees */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Assignees
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {((task.assignees as unknown as Array<{ _id: string; name: string; email: string }>) || []).map(
                      (assignee) => (
                        <Badge
                          key={assignee._id}
                          variant="secondary"
                          className="gap-1.5"
                        >
                          <Avatar className="h-4 w-4">
                            <AvatarFallback className="text-[8px]">
                              {assignee.name?.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          {assignee.name}
                        </Badge>
                      )
                    )}
                    {(!task.assignees || (task.assignees as unknown[]).length === 0) && (
                      <span className="text-sm text-muted-foreground">
                        No assignees
                      </span>
                    )}
                  </div>
                </div>

                {/* Description */}
                {task.description && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Description
                    </label>
                    <p className="text-sm text-foreground/80 whitespace-pre-wrap">
                      {task.description}
                    </p>
                  </div>
                )}

                <Separator />

                {/* Comments */}
                <div className="space-y-3">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Comments ({comments.length})
                  </label>

                  <div className="space-y-3">
                    {comments.map((comment) => (
                      <motion.div
                        key={comment._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex gap-2"
                      >
                        <Avatar className="h-6 w-6 shrink-0 mt-0.5">
                          <AvatarFallback className="text-[9px]">
                            {comment.author?.name?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium">
                              {comment.author?.name}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {new Date(comment.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm text-foreground/80 mt-0.5">
                            {comment.content}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </ScrollArea>

            {/* Comment input */}
            <form
              onSubmit={handleAddComment}
              className="p-4 border-t border-border flex gap-2"
            >
              <Input
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="flex-1"
              />
              <Button
                type="submit"
                size="icon"
                disabled={sendingComment || !newComment.trim()}
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
