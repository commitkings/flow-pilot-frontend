"use client";

import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sun, Moon, Monitor } from "lucide-react";

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/runs": "Runs",
  "/dashboard/approvals": "Approvals",
  "/dashboard/audit": "Audit",
  "/dashboard/settings": "Settings",
  "/dashboard/team": "Team",
};

function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const nextTheme =
    theme === "light" ? "dark" : theme === "dark" ? "system" : "light";

  const icon =
    theme === "light" ? (
      <Sun className="h-4 w-4" />
    ) : theme === "dark" ? (
      <Moon className="h-4 w-4" />
    ) : (
      <Monitor className="h-4 w-4" />
    );

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(nextTheme)}
      className="h-8 w-8 text-muted-foreground hover:text-foreground"
      aria-label="Toggle theme"
    >
      {icon}
    </Button>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const { logout } = useAuth();
  const router = useRouter();

  const title = pageTitles[pathname] ?? "Dashboard";

  return (
    <header className="fixed top-0 left-60 right-0 h-14 border-b border-border bg-background/95 backdrop-blur z-10 flex items-center justify-between px-6">
      <h1 className="text-sm font-semibold text-foreground">{title}</h1>

      <div className="flex items-center gap-2">
        <ThemeToggle />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 rounded-full p-0">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs bg-muted text-muted-foreground">
                  FP
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() => router.push("/dashboard/settings")}
            >
              Profile
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer text-destructive focus:text-destructive"
              onClick={logout}
            >
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
