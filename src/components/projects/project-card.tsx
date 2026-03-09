"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { FolderKanban, Users } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface ProjectCardProps {
  project: {
    _id: string;
    name: string;
    description?: string;
    members: Array<{ _id: string; name: string; email: string }>;
  };
  index: number;
}

export function ProjectCard({ project, index }: ProjectCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      whileHover={{ y: -2, transition: { duration: 0.15 } }}
    >
      <Link href={`/projects/${project._id}`}>
        <Card className="cursor-pointer hover:border-primary/50 hover:shadow-md transition-all duration-200 h-full">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-md bg-primary/10">
                  <FolderKanban className="h-4 w-4 text-primary" />
                </div>
                <CardTitle className="text-base">{project.name}</CardTitle>
              </div>
            </div>
            {project.description && (
              <CardDescription className="mt-2 line-clamp-2">
                {project.description}
              </CardDescription>
            )}
            <div className="flex items-center gap-2 mt-4">
              <Users className="h-3.5 w-3.5 text-muted-foreground" />
              <div className="flex -space-x-1.5">
                {project.members.slice(0, 4).map((member) => (
                  <Avatar key={member._id} className="h-6 w-6 border-2 border-background">
                    <AvatarFallback className="text-[9px]">
                      {member.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                ))}
              </div>
              <span className="text-xs text-muted-foreground">
                {project.members.length} member{project.members.length !== 1 ? "s" : ""}
              </span>
            </div>
          </CardHeader>
        </Card>
      </Link>
    </motion.div>
  );
}
