"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  LayoutDashboard,
  ArrowLeftRight,
  ShieldCheck,
  Settings,
  Building2,
  Bell,
  ChevronsLeft,
  ChevronsDown,
  User,
  Code2,
  Users,
  CreditCard,
  FileClock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useDashboardShell } from "@/components/dashboard-shell-context";

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
  { label: "Business", href: "/dashboard/business", icon: Building2 },
  { label: "Notifications", href: "/dashboard/notifications", icon: Bell, badge: "3" },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

const settingsSubItems = [
  { label: "Profile", section: "profile", icon: User },
  { label: "Security", section: "security", icon: ShieldCheck },
  { label: "API Configuration", section: "api", icon: Code2, pill: "Connected" },
  { label: "Team Members", section: "team", icon: Users, badge: "4" },
  { label: "Billing", section: "billing", icon: CreditCard },
  { label: "Audit Logs", section: "audit", icon: FileClock },
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

function SettingsSubNav({ onClick }: { onClick?: () => void }) {
  const searchParams = useSearchParams();
  const activeSection = searchParams.get("section") ?? "profile";
  const activeIndex = settingsSubItems.findIndex((i) => i.section === activeSection);

  // Each item: py-2 (8+8=16px) + text-xs line-height (16px) = 32px, space-y-0.5 gap = 2px
  const ITEM_H = 32;
  const GAP = 2;
  const INDICATOR_H = 20;
  const indicatorY = activeIndex * (ITEM_H + GAP) + (ITEM_H - INDICATOR_H) / 2;

  return (
    <div className="relative ml-3 mt-2 pb-1 border-l-2 border-muted-foreground/25">
      {/* Sliding active indicator — sits exactly over the border-l */}
      {activeIndex >= 0 && (
        <div
          className="absolute -left-0.5 w-0.5 rounded-full bg-brand transition-transform duration-300 ease-in-out"
          style={{ height: INDICATOR_H, transform: `translateY(${indicatorY}px)` }}
        />
      )}
      <div className="space-y-0.5 pl-5">
        {settingsSubItems.map((subItem) => {
          const Icon = subItem.icon;
          const isActive = activeSection === subItem.section;
          return (
            <Link
              key={subItem.section}
              href={`/dashboard/settings?section=${subItem.section}`}
              onClick={onClick}
              className={cn(
                "flex items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold transition-all",
                isActive
                  ? "bg-brand/10 text-brand"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <span className="flex items-center gap-2">
                <Icon className="h-3.5 w-3.5 shrink-0" />
                {subItem.label}
              </span>
              <span className="flex items-center gap-1">
                {"badge" in subItem && subItem.badge && (
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-foreground">
                    {subItem.badge}
                  </span>
                )}
                {"pill" in subItem && subItem.pill && (
                  <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(34,197,94,0.6)]" />
                )}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function Sidebar() {
  const { collapsed, mobileMenuOpen, toggleMobileMenu } = useDashboardShell();
  const pathname = usePathname();
  const isOnSettings = pathname.startsWith("/dashboard/settings");
  const [settingsOpen, setSettingsOpen] = useState(isOnSettings);

  const showSubNav = settingsOpen;

  const renderNav = (isCollapsed?: boolean, onClose?: () => void) => (
    <>
      {navItems.map((item) => {
        if (item.href === "/dashboard/settings") {
          return (
            <div key={item.href}>
              <div
                className={cn(
                  "flex items-center rounded-xl transition-all",
                  isOnSettings
                    ? "bg-brand/10 text-brand"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Link
                  href="/dashboard/settings"
                  onClick={() => { setSettingsOpen(true); onClose?.(); }}
                  className="flex flex-1 items-center gap-3 px-3 py-2.5 text-sm font-bold"
                >
                  <Settings
                    className={cn(
                      "h-5 w-5 shrink-0 transition-colors",
                      isOnSettings ? "text-brand" : "text-muted-foreground"
                    )}
                  />
                  {!isCollapsed && <span className="flex-1">Settings</span>}
                </Link>
                {!isCollapsed && (
                  <button
                    onClick={() => setSettingsOpen((prev) => !prev)}
                    className="rounded-lg py-2.5 pl-2 pr-4 text-current hover:bg-muted/60 transition-colors"
                  >
                    <ChevronsDown
                      className={cn(
                        "h-4 w-4 transition-transform duration-200",
                        showSubNav && "rotate-180"
                      )}
                    />
                  </button>
                )}
              </div>
              {showSubNav && !isCollapsed && <SettingsSubNav onClick={onClose} />}
            </div>
          );
        }
        return <NavLink key={item.href} item={item} collapsed={isCollapsed} onClick={() => { setSettingsOpen(false); onClose?.(); }} />;
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

        <nav className="flex-1 space-y-1 p-4 mt-4 overflow-y-auto">
          {renderNav(collapsed)}
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

      {/* ── Mobile drawer ─────────────────────────────────────────────── */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={toggleMobileMenu}
          />
          <aside className="absolute left-0 top-0 flex h-full w-full flex-col border-r border-border bg-card shadow-2xl">
            <div className="flex h-16 items-center justify-between px-5 border-b border-border/50">
              <span className="font-black tracking-tighter text-xl">
                FLOW<span className="text-brand">PILOT</span>
              </span>
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
