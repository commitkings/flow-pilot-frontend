"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, ChevronLeft, LogOut, Monitor, Moon, PlayCircle, Repeat, Settings, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/context/auth-context";
import { useDashboardShell } from "@/components/dashboard-shell-context";

const navItems = [
  { label: "Runs", href: "/dashboard/runs", icon: PlayCircle },
  { label: "Transactions", href: "/dashboard/transactions", icon: Repeat },
  { label: "Institutions", href: "/dashboard/institutions", icon: Building2 },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

const themeOptions = [
  { value: "light", icon: Sun, label: "Light" },
  { value: "dark", icon: Moon, label: "Dark" },
  { value: "system", icon: Monitor, label: "System" },
] as const;

export function Sidebar() {
  const pathname = usePathname();
  const { collapsed, toggleSidebar } = useDashboardShell();
  const { logout } = useAuth();
  // const { theme, setTheme } = useTheme();

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-slate-200 bg-white transition-all dark:border-slate-700 dark:bg-slate-900",
        collapsed ? "w-16" : "w-60"
      )}
    >
      {/* Theme switcher */}
      {/* <div className={cn("flex items-center border-b border-slate-200 px-3 py-2 dark:border-slate-700", collapsed ? "justify-center" : "gap-1")}>
        {collapsed ? (
          <button
            type="button"
            onClick={() => {
              const next = theme === "light" ? "dark" : theme === "dark" ? "system" : "light";
              setTheme(next);
            }}
            title={`Theme: ${theme}`}
            className="flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
          >
            {theme === "dark" ? <Moon className="h-4 w-4" /> : theme === "light" ? <Sun className="h-4 w-4" /> : <Monitor className="h-4 w-4" />}
          </button>
        ) : (
          <>
            {themeOptions.map(({ value, icon: Icon, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setTheme(value)}
                title={label}
                className={cn(
                  "flex flex-1 items-center justify-center gap-1 rounded-md py-1 text-xs font-medium transition-colors",
                  theme === value
                    ? "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100"
                    : "text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </>
        )}
      </div> */}

      <div className="flex h-14 items-center justify-between border-b border-slate-200 px-3 dark:border-slate-700">
        <div className={cn("flex items-center gap-2", collapsed && "justify-center")}>
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-xs font-bold text-white dark:bg-slate-100 dark:text-slate-900">
            FP
          </span>
          {!collapsed && <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">FlowPilot</span>}
        </div>
        {!collapsed && (
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleSidebar}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}
      </div>

      <nav className="flex-1 space-y-1 p-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                collapsed && "justify-center px-0",
                isActive
                  ? "bg-blue-50 text-blue-900 dark:bg-slate-800 dark:text-slate-100"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
              )}
              title={collapsed ? item.label : undefined}
            >
              {isActive && <span className="absolute left-0 top-0 h-full w-1 rounded-r bg-slate-900 dark:bg-slate-100" />}
              <Icon className={cn("h-4 w-4", isActive ? "text-slate-900 dark:text-slate-100" : "text-slate-500 dark:text-slate-400")} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-200 p-3 dark:border-slate-700">
        {!collapsed ? (
          <>
            <div className="mb-3 flex items-center gap-2">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-slate-200 text-xs font-semibold text-slate-700">OA</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">Oluwaseun Adeyemi</p>
                <p className="truncate text-xs text-slate-500 dark:text-slate-400">Acme Corp Ltd</p>
              </div>
            </div>
            <button
              type="button"
              onClick={logout}
              className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400"
            >
              <LogOut className="h-4 w-4" />
              Log Out
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-slate-200 text-[10px] font-semibold text-slate-700">OA</AvatarFallback>
            </Avatar>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleSidebar}>
              <ChevronLeft className="h-4 w-4 rotate-180" />
            </Button>
          </div>
        )}
      </div>
    </aside>
  );
}
