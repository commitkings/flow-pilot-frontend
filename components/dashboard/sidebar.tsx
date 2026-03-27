"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ArrowLeftRight,
  ShieldCheck,
  Settings,
  Bell,
  ChevronsLeft,
  Users,
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useDashboardShell } from "@/components/dashboard-shell-context";
import { useAuth } from "@/context/auth-context";
import { useNotifications } from "@/hooks/use-notification-queries";

function getInitials(name: string | null | undefined): string {
  if (!name?.trim()) return "??";
  if (name.includes("@")) {
    const local = name.split("@")[0] ?? "";
    const letters = local.replace(/[^a-zA-Z]/g, "");
    if (letters.length >= 2) return letters.slice(0, 2).toUpperCase();
    return (local.slice(0, 2) || "??").toUpperCase();
  }
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatWorkspaceRole(role: string | undefined): string {
  if (!role) return "Member";
  return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
}

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
};

const navItems: NavItem[] = [
  { label: "Runs", href: "/dashboard/runs", icon: LayoutDashboard },
  { label: "Transactions", href: "/dashboard/transactions", icon: ArrowLeftRight },
  { label: "Institutions", href: "/dashboard/institutions", icon: ShieldCheck },
  { label: "Team Members", href: "/dashboard/team", icon: Users },
  { label: "Notifications", href: "/dashboard/notifications", icon: Bell },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];



function NavLink({
  item,
  collapsed,
  onClick,
}: {
  item: NavItem;
  collapsed?: boolean;
  onClick?: () => void;
}) {
  const pathname = usePathname();
  const isActive = pathname.startsWith(item.href);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition-all",
        isActive
          ? "bg-brand/10 text-brand"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      <Icon className={cn("h-5 w-5 shrink-0 transition-colors", isActive ? "text-brand" : "text-muted-foreground group-hover:text-foreground")} />
      {!collapsed && <span className="flex-1">{item.label}</span>}
      {!collapsed && item.badge && (
        <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
          {item.badge}
        </span>
      )}
      {isActive && !collapsed && !item.badge && (
        <span className="absolute right-2 h-1.5 w-1.5 rounded-full bg-brand shadow-[0_0_8px_rgba(232,103,39,0.6)]" />
      )}
    </Link>
  );
}



export function Sidebar() {
  const { collapsed, mobileMenuOpen, toggleMobileMenu } = useDashboardShell();
  const { user } = useAuth();
  const displayName = user?.display_name?.trim() || user?.email || "Account";
  const roleLabel = formatWorkspaceRole(user?.memberships?.[0]?.role);

  const { data: notifData } = useNotifications({ limit: 1 });
  const unreadCount = notifData?.unread_count ?? 0;

  const renderNav = (isCollapsed?: boolean, onClose?: () => void) => (
    <>
      {navItems.map((item) => {
        const badge = item.href === "/dashboard/notifications" && unreadCount > 0
          ? String(unreadCount)
          : item.badge;
        return (
          <NavLink key={item.href} item={{ ...item, badge }} collapsed={isCollapsed} onClick={() => { onClose?.(); }} />
        );
      })}
    </>
  );

  return (
    <>
      {/* ── Desktop sidebar ───────────────────────────────────────────── */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 hidden md:flex h-screen flex-col border-r border-border bg-card transition-all duration-300",
          collapsed ? "w-20" : "w-64"
        )}
      >
        <div className="flex h-16 items-center px-4 border-b border-border/50">
          {collapsed ? (
            <Logo variant="icon" size="sm" color="darkblue" />
          ) : (
            <Logo variant="full" size="md" color="darkblue" />
          )}
        </div>

        <nav className="flex-1 space-y-1 p-4 mt-4 overflow-y-auto">
          {renderNav(collapsed)}
        </nav>

        <div className="p-4 border-t border-border/50 bg-muted/30">
          <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
            <Avatar className="h-10 w-10 border-2 border-background shadow-sm">
              {user?.avatar_url ? (
                <AvatarImage src={user.avatar_url} alt="" className="object-cover" />
              ) : null}
              <AvatarFallback className="bg-brand text-white font-bold text-xs">
                {getInitials(displayName)}
              </AvatarFallback>
            </Avatar>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-black text-foreground">{displayName}</p>
                <p className="truncate text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  {roleLabel}
                </p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* ── Mobile drawer ─────────────────────────────────────────────── */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={toggleMobileMenu}
          />
          <aside className="absolute left-0 top-0 flex h-full w-72 max-w-[85vw] flex-col border-r border-border bg-card shadow-2xl">
            <div className="flex h-16 items-center justify-between px-5 border-b border-border/50">
              <Logo variant="full" size="md" color="darkblue" />
              <button
                onClick={toggleMobileMenu}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
              >
                <ChevronsLeft className="h-4 w-4" />
              </button>
            </div>
            <nav className="flex-1 space-y-1 p-4 mt-2 overflow-y-auto">
              {renderNav(false, toggleMobileMenu)}
            </nav>
          </aside>
        </div>
      )}
    </>
  );
}
