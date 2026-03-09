"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useBoardStore } from "@/stores/board-store";

export function PresenceAvatars() {
  const presenceUsers = useBoardStore((s) => s.presenceUsers);

  if (presenceUsers.length === 0) return null;

  const displayed = presenceUsers.slice(0, 5);
  const remaining = presenceUsers.length - displayed.length;

  return (
    <TooltipProvider>
      <div className="flex items-center">
        <div className="flex -space-x-2">
          {displayed.map((user) => {
            const initials = user.name
              ?.split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2);

            return (
              <Tooltip key={user._id}>
                <TooltipTrigger>
                  <div className="relative">
                    <Avatar className="h-7 w-7 border-2 border-background">
                      <AvatarFallback className="text-[10px]">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    {/* Green pulse dot */}
                    <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-background">
                      <span className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-75" />
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>{user.name}</TooltipContent>
              </Tooltip>
            );
          })}
        </div>
        {remaining > 0 && (
          <span className="text-xs text-muted-foreground ml-2">
            +{remaining}
          </span>
        )}
        <span className="text-xs text-muted-foreground ml-2">
          {presenceUsers.length} online
        </span>
      </div>
    </TooltipProvider>
  );
}
