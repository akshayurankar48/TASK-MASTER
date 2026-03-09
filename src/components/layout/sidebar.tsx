"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  FolderKanban,
  Plus,
  ChevronLeft,
  LayoutDashboard,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUIStore } from "@/stores/ui-store";
import { useProjectStore } from "@/stores/project-store";
import { cn } from "@/lib/utils";

function NavItem({
  href,
  icon: Icon,
  label,
  active,
  showLabel,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  active: boolean;
  showLabel: boolean;
}) {
  return (
    <Link href={href}>
      <div
        className={cn(
          "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors hover:bg-accent",
          active && "bg-accent text-accent-foreground"
        )}
      >
        <Icon className="h-4 w-4 shrink-0" />
        {showLabel && <span className="truncate">{label}</span>}
      </div>
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar } = useUIStore();
  const projects = useProjectStore((s) => s.projects);

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
          <NavItem
            href="/projects"
            icon={LayoutDashboard}
            label="All Projects"
            active={pathname === "/projects"}
            showLabel={sidebarOpen}
          />

          {sidebarOpen && (
            <div className="pt-4 pb-2 px-3">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Projects
              </span>
            </div>
          )}

          {projects.map((project) => (
            <NavItem
              key={project._id}
              href={`/projects/${project._id}`}
              icon={FolderKanban}
              label={project.name}
              active={pathname === `/projects/${project._id}`}
              showLabel={sidebarOpen}
            />
          ))}
        </nav>

        {/* Footer */}
        <div className="p-2 border-t border-border space-y-1">
          <NavItem
            href="/settings"
            icon={Settings}
            label="Settings"
            active={pathname === "/settings"}
            showLabel={sidebarOpen}
          />
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
