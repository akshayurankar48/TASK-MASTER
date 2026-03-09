"use client";

import { create } from "zustand";
import { api } from "@/lib/api-client";

interface Project {
  _id: string;
  name: string;
}

interface ProjectState {
  projects: Project[];
  loading: boolean;
  error: string | null;
  fetchProjects: (token: string) => Promise<void>;
  reset: () => void;
}

export const useProjectStore = create<ProjectState>()((set, get) => ({
  projects: [],
  loading: false,
  error: null,

  fetchProjects: async (token: string) => {
    if (get().loading) return;
    set({ loading: true, error: null });
    try {
      const res = (await api.getProjects(token)) as { data: Project[] };
      set({ projects: res.data || [], loading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Failed to load projects",
        loading: false,
      });
    }
  },

  reset: () => set({ projects: [], loading: false, error: null }),
}));
