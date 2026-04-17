"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Home,
  ShieldCheck,
  ShieldBan,
  BadgeCheck,
  Settings,
  Bell,
  ChevronsLeft,
  Users,
  LogOut,
  ScrollText,
  ClipboardCheck,
  Radio,
  Code2,
  BarChart2,
  MessageSquare,
  Wallet,
  CalendarClock,
  Bookmark,
  Store,
} from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useDashboardShell } from "@/components/dashboard-shell-context";
import { useAuth } from "@/context/auth-context";
import { useNotifications } from "@/hooks/use-notification-queries";
import { getUserRole } from "@/lib/api-types";
import { useOrgProfile } from "@/hooks/use-settings-queries";

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
  /** Roles that can see this item. Undefined = all roles. */
  roles?: string[];
  /** Renders a small sub-section label above this item inside the group. */
  subSectionLabel?: string;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

const navGroups: NavGroup[] = [
  {
    label: "Operations",
    items: [
      { label: "Overview", href: "/dashboard", icon: Home },
      { label: "All Payouts", href: "/dashboard/runs", icon: LayoutDashboard, subSectionLabel: "Payouts" },
      { label: "Scheduled", href: "/dashboard/runs/scheduled", icon: CalendarClock },
      { label: "Templates", href: "/dashboard/runs/templates", icon: Bookmark },
      { label: "Recipients", href: "/dashboard/recipients", icon: Store },
      { label: "Conversations", href: "/dashboard/conversations", icon: MessageSquare },
      { label: "Approvals", href: "/dashboard/approvals", icon: ClipboardCheck, roles: ["approver", "owner"] },
      { label: "Transactions", href: "/dashboard/transactions", icon: ArrowLeftRight },
      { label: "Analytics", href: "/dashboard/stats", icon: BarChart2 },
    ],
  },
  {
    label: "Compliance & Risk",
    items: [
      { label: "Audit Log", href: "/dashboard/audit", icon: ScrollText, roles: ["owner"] },
      { label: "Blocklist", href: "/dashboard/blocklist", icon: ShieldBan, roles: ["owner"] },
      { label: "Institutions", href: "/dashboard/institutions", icon: ShieldCheck },
      { label: "Verification (KYC)", href: "/dashboard/kyc", icon: BadgeCheck, roles: ["owner"] },
    ],
  },
  {
    label: "Administration",
    items: [
      { label: "Wallet", href: "/dashboard/wallet", icon: Wallet, roles: ["owner", "approver"] },
      { label: "Team Members", href: "/dashboard/team", icon: Users, roles: ["owner"] },
      { label: "Sessions", href: "/dashboard/sessions", icon: Radio, roles: ["owner"] },
      { label: "Developer", href: "/dashboard/developer", icon: Code2, roles: ["owner"] },
    ],
  },
  {
    label: "Account",
    items: [
      { label: "Notifications", href: "/dashboard/notifications", icon: Bell },
      { label: "Settings", href: "/dashboard/settings", icon: Settings },
    ],
  },
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
  // Exact match for overview, prefix match for all others
  const isActive =
    item.href === "/dashboard"
      ? pathname === "/dashboard"
      : pathname.startsWith(item.href);
  const Icon = item.icon;

  // Derive a data-tour id from the href for the tour guide
  const tourId =
    item.href === "/dashboard"
      ? "overview"
      : item.href.split("/").pop() ?? undefined;

  return (
    <Link
      href={item.href}
      onClick={onClick}
      data-tour={tourId}
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

function LogoutModal({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-2xl">
        <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
          <LogOut className="h-5 w-5 text-red-600" />
        </div>
        <h2 className="mt-3 text-base font-black text-foreground">Log out?</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          You will be signed out of your account and redirected to the login page.
        </p>
        <div className="mt-5 flex gap-3">
          <Button variant="outline" className="flex-1 rounded-full" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            className="flex-1 rounded-full bg-red-600 text-white hover:bg-red-700"
            onClick={onConfirm}
          >
            Log out
          </Button>
        </div>
      </div>
    </div>
  );
}

export function Sidebar() {
  const { collapsed, mobileMenuOpen, toggleMobileMenu } = useDashboardShell();
  const { user, logout } = useAuth();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const displayName = user?.display_name?.trim() || user?.email || "Account";
  const roleLabel = formatWorkspaceRole(user?.memberships?.[0]?.role);
  const userRole = getUserRole(user);

  const { data: orgProfile } = useOrgProfile();
  const isIndividual = orgProfile?.account_type === "individual";

  const { data: notifData } = useNotifications({ limit: 1 });
  const unreadCount = notifData?.unread_count ?? 0;

  // Filter nav items by role, and hide Team Members for individual accounts
  const visibleGroups = navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        if (!item.roles && userRole || item.roles?.includes(userRole ?? "")) {
          // Hide Team Members, Sessions, and Developer for individual accounts
          if (isIndividual && item.href === "/dashboard/team") return false;
          if (isIndividual && item.href === "/dashboard/sessions") return false;
          if (isIndividual && item.href === "/dashboard/developer") return false;
          return true;
        }
        return !item.roles;
      }),
    }))
    .filter((group) => group.items.length > 0);

  const renderNav = (isCollapsed?: boolean, onClose?: () => void) => (
    <>
      {visibleGroups.map((group, gi) => (
        <div key={group.label} className={gi > 0 ? "mt-4" : ""}>
          {!isCollapsed && (
            <p className="mb-1 px-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
              {group.label}
            </p>
          )}
          {isCollapsed && gi > 0 && (
            <div className="my-2 mx-3 border-t border-border/40" />
          )}
          {group.items.map((item) => {
            const badge = item.href === "/dashboard/notifications" && unreadCount > 0
              ? String(unreadCount)
              : item.badge;
            return (
              <React.Fragment key={item.href}>
                {!isCollapsed && item.subSectionLabel && (
                  <p className="mt-3 mb-0.5 px-3 text-[9px] font-bold uppercase tracking-widest text-muted-foreground/40">
                    {item.subSectionLabel}
                  </p>
                )}
                <NavLink item={{ ...item, badge }} collapsed={isCollapsed} onClick={() => { onClose?.(); }} />
              </React.Fragment>
            );
          })}
        </div>
      ))}
    </>
  );

  const userSection = (isCollapsed?: boolean) => (
    <div className={cn("flex items-center gap-2.5", isCollapsed && "flex-col")}>
      <Avatar className="h-8 w-8 shrink-0 border-2 border-background shadow-sm">
        {user?.avatar_url ? (
          <AvatarImage src={user.avatar_url} alt="" className="object-cover" />
        ) : null}
        <AvatarFallback className="bg-brand text-white font-bold text-xs">
          {getInitials(displayName)}
        </AvatarFallback>
      </Avatar>

      {!isCollapsed && (
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-foreground">{displayName}</p>
          <p className="truncate text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            {roleLabel}
          </p>
        </div>
      )}

      <button
        type="button"
        title="Log out"
        onClick={() => setShowLogoutModal(true)}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
      >
        <LogOut className="h-3.5 w-3.5" />
      </button>
    </div>
  );

  return (
    <>
      {showLogoutModal && (
        <LogoutModal
          onConfirm={() => { setShowLogoutModal(false); logout(); }}
          onCancel={() => setShowLogoutModal(false)}
        />
      )}

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

        <div className="px-4 py-3 border-t border-border/50 bg-muted/30">
          {userSection(collapsed)}
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
            <div className="p-4 border-t border-border/50">
              {userSection(false)}
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
