"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  FolderKanban,
  Plus,
  ChevronLeft,
  LayoutDashboard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUIStore } from "@/stores/ui-store";
import { useAuthStore } from "@/stores/auth-store";
import { api } from "@/lib/api-client";
import { cn } from "@/lib/utils";

interface Project {
  _id: string;
  name: string;
}

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const token = useAuthStore((s) => s.token);
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    if (!token) return;
    api
      .getProjects(token)
      .then((res: unknown) => {
        const data = res as { data: Project[] };
        setProjects(data.data || []);
      })
      .catch(() => {});
  }, [token]);

  return (
    <AnimatePresence mode="wait">
      <motion.aside
        initial={false}
        animate={{ width: sidebarOpen ? 256 : 60 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className="h-screen border-r border-border bg-card flex flex-col shrink-0 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 h-14 border-b border-border">
          <AnimatePresence>
            {sidebarOpen && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="font-semibold text-sm truncate"
              >
                Task Master
              </motion.span>
            )}
          </AnimatePresence>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="h-8 w-8 shrink-0"
          >
            <ChevronLeft
              className={cn(
                "h-4 w-4 transition-transform",
                !sidebarOpen && "rotate-180"
              )}
            />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          <Link href="/projects">
            <div
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors hover:bg-accent",
                pathname === "/projects" && "bg-accent text-accent-foreground"
              )}
            >
              <LayoutDashboard className="h-4 w-4 shrink-0" />
              {sidebarOpen && <span className="truncate">All Projects</span>}
            </div>
          </Link>

          {sidebarOpen && (
            <div className="pt-4 pb-2 px-3">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Projects
              </span>
            </div>
          )}

          {projects.map((project) => (
            <Link key={project._id} href={`/projects/${project._id}`}>
              <div
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors hover:bg-accent",
                  pathname === `/projects/${project._id}` &&
                    "bg-accent text-accent-foreground"
                )}
              >
                <FolderKanban className="h-4 w-4 shrink-0" />
                {sidebarOpen && (
                  <span className="truncate">{project.name}</span>
                )}
              </div>
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-2 border-t border-border">
          <Link href="/projects">
            <Button
              variant="ghost"
              size={sidebarOpen ? "sm" : "icon"}
              className={cn("w-full", sidebarOpen && "justify-start gap-2")}
            >
              <Plus className="h-4 w-4" />
              {sidebarOpen && "New Project"}
            </Button>
          </Link>
        </div>
      </motion.aside>
    </AnimatePresence>
  );
}
