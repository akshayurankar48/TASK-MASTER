import { z } from "zod";
import { TASK_STATUS, TASK_PRIORITY } from "@/types";

export const createTaskSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(500, "Title cannot exceed 500 characters")
    .trim(),
  description: z
    .string()
    .max(5000, "Description cannot exceed 5000 characters")
    .trim()
    .optional(),
  status: z.enum(
    Object.values(TASK_STATUS) as [string, ...string[]]
  ).optional(),
  priority: z.enum(
    Object.values(TASK_PRIORITY) as [string, ...string[]]
  ).optional(),
  assignees: z.array(z.string()).optional(),
  dueDate: z.string().datetime().optional().nullable(),
});

export const updateTaskSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(500, "Title cannot exceed 500 characters")
    .trim()
    .optional(),
  description: z
    .string()
    .max(5000, "Description cannot exceed 5000 characters")
    .trim()
    .optional()
    .nullable(),
  status: z.enum(
    Object.values(TASK_STATUS) as [string, ...string[]]
  ).optional(),
  priority: z.enum(
    Object.values(TASK_PRIORITY) as [string, ...string[]]
  ).optional(),
  dueDate: z.string().datetime().optional().nullable(),
});

export const assignTaskSchema = z.object({
  userIds: z.array(z.string()).min(1, "At least one user ID is required"),
});

export const taskQuerySchema = z.object({
  status: z
    .enum(Object.values(TASK_STATUS) as [string, ...string[]])
    .optional(),
  assignee: z.string().optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type AssignTaskInput = z.infer<typeof assignTaskSchema>;
export type TaskQueryInput = z.infer<typeof taskQuerySchema>;
