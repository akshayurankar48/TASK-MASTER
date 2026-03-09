"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { FolderKanban, CheckSquare, MessageSquare } from "lucide-react";
import { useUIStore } from "@/stores/ui-store";
import { useAuthStore } from "@/stores/auth-store";
import { api } from "@/lib/api-client";

interface SearchResult {
  tasks: Array<{ _id: string; title: string; status: string; project: string }>;
  comments: Array<{
    _id: string;
    content: string;
    task: { _id: string; title: string };
  }>;
}

export function CommandPalette() {
  const router = useRouter();
  const { commandPaletteOpen, setCommandPaletteOpen } = useUIStore();
  const token = useAuthStore((s) => s.token);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult | null>(null);
  const [projects, setProjects] = useState<
    Array<{ _id: string; name: string }>
  >([]);

  // Load projects for navigation
  useEffect(() => {
    if (!token || !commandPaletteOpen) return;
    api
      .getProjects(token)
      .then((res: unknown) => {
        const data = res as { data: Array<{ _id: string; name: string }> };
        setProjects(data.data || []);
      })
      .catch(() => {});
  }, [token, commandPaletteOpen]);

  // Search debounce
  useEffect(() => {
    if (!query || query.length < 2 || !token) {
      setResults(null);
      return;
    }

    const timer = setTimeout(async () => {
      // Search across all projects
      for (const project of projects) {
        try {
          const res = (await api.search(token, project._id, query)) as {
            data: SearchResult;
          };
          setResults(res.data);
          break; // Show first project's results for now
        } catch {
          // Skip projects that fail
        }
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, token, projects]);

  function handleClose() {
    setCommandPaletteOpen(false);
    setQuery("");
    setResults(null);
  }

  return (
    <CommandDialog open={commandPaletteOpen} onOpenChange={handleClose}>
      <CommandInput
        placeholder="Search tasks, projects..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {/* Projects */}
        {!query && projects.length > 0 && (
          <CommandGroup heading="Projects">
            {projects.map((p) => (
              <CommandItem
                key={p._id}
                onSelect={() => {
                  router.push(`/projects/${p._id}`);
                  handleClose();
                }}
              >
                <FolderKanban className="mr-2 h-4 w-4" />
                {p.name}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {/* Search Results — Tasks */}
        {results?.tasks && results.tasks.length > 0 && (
          <CommandGroup heading="Tasks">
            {results.tasks.map((task) => (
              <CommandItem
                key={task._id}
                onSelect={() => {
                  router.push(`/projects/${task.project}`);
                  handleClose();
                }}
              >
                <CheckSquare className="mr-2 h-4 w-4" />
                <span>{task.title}</span>
                <span className="ml-auto text-xs text-muted-foreground">
                  #{task.status}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {/* Search Results — Comments */}
        {results?.comments && results.comments.length > 0 && (
          <CommandGroup heading="Comments">
            {results.comments.map((comment) => (
              <CommandItem key={comment._id}>
                <MessageSquare className="mr-2 h-4 w-4" />
                <span className="truncate">{comment.content}</span>
                <span className="ml-auto text-xs text-muted-foreground">
                  in {comment.task?.title}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
