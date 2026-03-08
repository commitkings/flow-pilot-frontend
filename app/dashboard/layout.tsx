"use client";

import { Sidebar } from "@/components/dashboard/sidebar";
import { Navbar } from "@/components/dashboard/navbar";
import { DashboardShellProvider } from "@/components/dashboard-shell-context";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import { fetchHealth } from "@/lib/api-client";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [payoutMode, setPayoutMode] = useState<string | null>(null);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }
    if (user && !user.has_completed_onboarding) {
      router.replace("/onboarding");
    }
  }, [isLoading, isAuthenticated, user, router]);

  // Fetch payout mode for simulated banner
  useEffect(() => {
    let cancelled = false;
    fetchHealth()
      .then((h) => { if (!cancelled) setPayoutMode(h.payout_mode); })
      .catch(() => { /* silently ignore */ });
    return () => { cancelled = true; };
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-muted-foreground animate-pulse">Loading…</p>
      </div>
    );
  }

  if (!isAuthenticated || (user && !user.has_completed_onboarding)) {
    return null;
  }

  return (
    <DashboardShellProvider
      value={{
        collapsed,
        toggleSidebar: () => setCollapsed((prev) => !prev),
        openNewRun: () => router.push("/dashboard/runs/new"),
        mobileMenuOpen,
        toggleMobileMenu: () => setMobileMenuOpen((prev) => !prev),
        inviteOpen,
        setInviteOpen,
      }}
    >
      <div className="min-h-screen bg-background text-foreground">
        <Sidebar />
        <div className={cn(
          "flex flex-col min-h-screen transition-all duration-300 ease-in-out",
          "ml-0 bg-white",
          collapsed ? "md:ml-20" : "md:ml-64"
        )}>
          {payoutMode === "simulated" && (
            <div className="flex items-center justify-center gap-2 bg-amber-50 border-b border-amber-200 px-4 py-2 text-sm font-medium text-amber-800 dark:bg-amber-950/40 dark:border-amber-900 dark:text-amber-300">
              <span className="inline-block h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
              Demo Mode — Payouts are simulated. No real funds will move.
            </div>
          )}
          <Navbar />
          <main className="flex-1 p-3 md:p-8 lg:p-10 pb-20 md:pb-8">
            <div className="mx-auto max-w-7xl">
              {children}
            </div>
          </main>
        </div>
      </div>
    </DashboardShellProvider>
  );
}
