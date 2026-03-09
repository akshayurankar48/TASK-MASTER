"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { ProjectCard } from "@/components/projects/project-card";
import { CreateProjectDialog } from "@/components/projects/create-project-dialog";
import { useAuthStore } from "@/stores/auth-store";
import { api } from "@/lib/api-client";

interface Project {
  _id: string;
  name: string;
  description?: string;
  members: Array<{ _id: string; name: string; email: string }>;
}

export default function ProjectsPage() {
  const token = useAuthStore((s) => s.token);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProjects = useCallback(async () => {
    if (!token) return;
    try {
      const res = (await api.getProjects(token)) as { data: Project[] };
      setProjects(res.data || []);
    } catch {
      // Error handled silently
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-8"
      >
        <div>
          <h1 className="text-2xl font-bold">Projects</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage and collaborate on your projects
          </p>
        </div>
        <CreateProjectDialog onCreated={fetchProjects} />
      </motion.div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-40 rounded-lg bg-muted animate-pulse"
            />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-20"
        >
          <p className="text-muted-foreground">No projects yet.</p>
          <p className="text-sm text-muted-foreground mt-1">
            Create your first project to get started.
          </p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project, index) => (
            <ProjectCard
              key={project._id}
              project={project}
              index={index}
            />
          ))}
        </div>
      )}
    </div>
  );
}
