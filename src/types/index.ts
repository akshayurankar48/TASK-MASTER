import { Types } from "mongoose";

// ─── Enums ───────────────────────────────────────────────
export const TASK_STATUS = {
  TODO: "todo",
  IN_PROGRESS: "in_progress",
  IN_REVIEW: "in_review",
  DONE: "done",
} as const;

export type TaskStatus = (typeof TASK_STATUS)[keyof typeof TASK_STATUS];

export const TASK_PRIORITY = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  URGENT: "urgent",
} as const;

export type TaskPriority = (typeof TASK_PRIORITY)[keyof typeof TASK_PRIORITY];

// ─── Document Types ──────────────────────────────────────
export interface IUser {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IProject {
  _id: Types.ObjectId;
  name: string;
  description?: string;
  owner: Types.ObjectId;
  members: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ITask {
  _id: Types.ObjectId;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  project: Types.ObjectId;
  assignees: Types.ObjectId[];
  createdBy: Types.ObjectId;
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IComment {
  _id: Types.ObjectId;
  content: string;
  task: Types.ObjectId;
  author: Types.ObjectId;
  createdAt: Date;
}

// ─── API Response Types ──────────────────────────────────
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code: string;
    details?: unknown[];
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    nextCursor: string | null;
    hasMore: boolean;
  };
}

// ─── Auth Types ──────────────────────────────────────────
export interface JwtPayload {
  userId: string;
  email: string;
}

export interface AuthUser {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
}

// ─── Socket Event Types ──────────────────────────────────
export interface PresenceUser {
  _id: string;
  name: string;
  avatar?: string;
}

export interface SocketEvents {
  "task:created": ITask;
  "task:updated": ITask;
  "task:deleted": { taskId: string };
  "comment:added": IComment;
  "presence:update": { users: PresenceUser[] };
  "project:join": { projectId: string };
  "project:leave": { projectId: string };
}
