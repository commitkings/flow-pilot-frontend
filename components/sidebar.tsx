"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  LayoutDashboard,
  Play,
  CheckSquare,
  FileText,
  Settings,
  Users,
} from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Runs", href: "/dashboard/runs", icon: Play },
  { label: "Approvals", href: "/dashboard/approvals", icon: CheckSquare },
  { label: "Audit", href: "/dashboard/audit", icon: FileText },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
  { label: "Team", href: "/dashboard/team", icon: Users },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-60 flex flex-col border-r border-border bg-card z-20">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-border">
        <span className="text-lg font-semibold tracking-tight text-foreground">
          FlowPilot
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="px-4 py-4 border-t border-border">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs bg-muted text-muted-foreground">
              FP
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-xs font-medium text-foreground truncate">
              user@flowpilot.io
            </p>
            <p className="text-xs text-muted-foreground">Member</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
