"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ArrowLeftRight,
  ShieldCheck,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useDashboardShell } from "@/components/dashboard-shell-context";

const navItems = [
  { label: "Runs", href: "/dashboard/runs", icon: LayoutDashboard },
  { label: "Transactions", href: "/dashboard/transactions", icon: ArrowLeftRight },
  { label: "Institutions", href: "/dashboard/institutions", icon: ShieldCheck },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { collapsed } = useDashboardShell();

  return (
    <>
      {/* ── Desktop sidebar ───────────────────────────────────────────── */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 hidden md:flex h-screen flex-col border-r border-border bg-card transition-all duration-300",
          collapsed ? "w-20" : "w-64"
        )}
      >
        <div className="flex h-16 items-center px-6 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-white" />
            {!collapsed && (
              <span className="font-black tracking-tighter text-xl">
                FLOW<span className="text-brand">PILOT</span>
              </span>
            )}
          </div>
        </div>

        <nav className="flex-1 space-y-2 p-4 mt-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition-all",
                  isActive
                    ? "bg-brand/10 text-brand"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className={cn("h-5 w-5 shrink-0 transition-colors", isActive ? "text-brand" : "text-muted-foreground group-hover:text-foreground")} />
                {!collapsed && <span>{item.label}</span>}
                {isActive && !collapsed && (
                  <span className="absolute right-2 h-1.5 w-1.5 rounded-full bg-brand shadow-[0_0_8px_rgba(232,103,39,0.6)]" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border/50 bg-muted/30">
          <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
            <Avatar className="h-10 w-10 border-2 border-background shadow-sm">
              <AvatarFallback className="bg-brand text-white font-bold text-xs">OA</AvatarFallback>
            </Avatar>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-black text-foreground">O. Adeyemi</p>
                <p className="truncate text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Pro Plan</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* ── Mobile bottom nav ─────────────────────────────────────────── */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex md:hidden items-center justify-around border-t border-border bg-card/95 backdrop-blur-md px-2 pb-safe">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-3 text-[10px] font-bold uppercase tracking-widest transition-colors",
                isActive ? "text-brand" : "text-muted-foreground"
              )}
            >
              <Icon className={cn("h-5 w-5", isActive && "drop-shadow-[0_0_6px_rgba(232,103,39,0.5)]")} />
            </Link>
          );
        })}
      </nav>
    </>
  );
}
