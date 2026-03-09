"use client";

import { Moon, Sun, LogOut } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuthStore } from "@/stores/auth-store";
import { useLogout } from "@/hooks/use-logout";
import { getInitials } from "@/lib/utils";

export default function SettingsPage() {
  const { resolvedTheme, setTheme } = useTheme();
  const user = useAuthStore((s) => s.user);
  const handleLogout = useLogout();

  const initials = getInitials(user?.name);

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">
      <h1 className="text-2xl font-semibold">Settings</h1>

      {/* Profile */}
      <section className="space-y-4">
        <h2 className="text-lg font-medium">Profile</h2>
        <div className="flex items-center gap-4 p-4 rounded-lg border border-border bg-card">
          <Avatar className="h-16 w-16">
            <AvatarFallback className="text-lg">{initials}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-lg font-medium">{user?.name}</p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
        </div>
      </section>

      {/* Appearance */}
      <section className="space-y-4">
        <h2 className="text-lg font-medium">Appearance</h2>
        <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-card">
          <div>
            <p className="text-sm font-medium">Theme</p>
            <p className="text-sm text-muted-foreground">
              Switch between light and dark mode
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          >
            {resolvedTheme === "dark" ? (
              <>
                <Sun className="h-4 w-4" />
                Light
              </>
            ) : (
              <>
                <Moon className="h-4 w-4" />
                Dark
              </>
            )}
          </Button>
        </div>
      </section>

      {/* Account */}
      <section className="space-y-4">
        <h2 className="text-lg font-medium">Account</h2>
        <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-card">
          <div>
            <p className="text-sm font-medium">Sign out</p>
            <p className="text-sm text-muted-foreground">
              Log out of your account
            </p>
          </div>
          <Button variant="destructive" size="sm" className="gap-2" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </div>
      </section>
    </div>
  );
}
