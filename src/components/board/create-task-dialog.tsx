"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuthStore } from "@/stores/auth-store";
import { useBoardStore } from "@/stores/board-store";
import { api } from "@/lib/api-client";
import { TaskStatus, TASK_PRIORITY } from "@/types";
import { toast } from "sonner";

interface Props {
  projectId: string;
  defaultStatus: TaskStatus;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateTaskDialog({
  projectId,
  defaultStatus,
  open,
  onOpenChange,
}: Props) {
  const token = useAuthStore((s) => s.token);
  const addTask = useBoardStore((s) => s.addTask);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !title.trim()) return;

    setLoading(true);
    try {
      const res = (await api.createTask(token, projectId, {
        title: title.trim(),
        description: description.trim() || undefined,
        status: defaultStatus,
        priority,
      })) as { data: any };

      addTask(res.data);
      toast.success("Task created");
      onOpenChange(false);
      setTitle("");
      setDescription("");
      setPriority("medium");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create task");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="task-title">Title</Label>
              <Input
                id="task-title"
                placeholder="What needs to be done?"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="task-desc">Description (optional)</Label>
              <Textarea
                id="task-desc"
                placeholder="Add more details..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={(v) => v && setPriority(v)}>
                <SelectTrigger>
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
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !title.trim()}>
              {loading ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
