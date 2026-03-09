"use client";

import { create } from "zustand";
import { ITask, PresenceUser, TASK_STATUS, TaskStatus } from "@/types";

interface BoardState {
  tasks: ITask[];
  presenceUsers: PresenceUser[];
  selectedTaskId: string | null;
  isDetailOpen: boolean;

  // Actions
  setTasks: (tasks: ITask[]) => void;
  addTask: (task: ITask) => void;
  updateTask: (task: ITask) => void;
  removeTask: (taskId: string) => void;
  moveTask: (taskId: string, newStatus: TaskStatus) => void;
  setPresenceUsers: (users: PresenceUser[]) => void;
  openTaskDetail: (taskId: string) => void;
  closeTaskDetail: () => void;

  // Derived
  getTasksByStatus: (status: TaskStatus) => ITask[];
}

export const useBoardStore = create<BoardState>()((set, get) => ({
  tasks: [],
  presenceUsers: [],
  selectedTaskId: null,
  isDetailOpen: false,

  setTasks: (tasks) => set({ tasks }),

  addTask: (task) =>
    set((state) => ({
      tasks: [task, ...state.tasks],
    })),

  updateTask: (updatedTask) =>
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t._id.toString() === updatedTask._id.toString() ? updatedTask : t
      ),
    })),

  removeTask: (taskId) =>
    set((state) => ({
      tasks: state.tasks.filter((t) => t._id.toString() !== taskId),
    })),

  moveTask: (taskId, newStatus) =>
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t._id.toString() === taskId ? { ...t, status: newStatus } : t
      ),
    })),

  setPresenceUsers: (users) => set({ presenceUsers: users }),

  openTaskDetail: (taskId) =>
    set({ selectedTaskId: taskId, isDetailOpen: true }),

  closeTaskDetail: () =>
    set({ selectedTaskId: null, isDetailOpen: false }),

  getTasksByStatus: (status) =>
    get().tasks.filter((t) => t.status === status),
}));

// Column order for the Kanban board
export const BOARD_COLUMNS: { id: TaskStatus; label: string }[] = [
  { id: TASK_STATUS.TODO, label: "Todo" },
  { id: TASK_STATUS.IN_PROGRESS, label: "In Progress" },
  { id: TASK_STATUS.IN_REVIEW, label: "In Review" },
  { id: TASK_STATUS.DONE, label: "Done" },
];
