"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { Navbar } from "@/components/navbar";
import { useAuth } from "@/context/auth-context";
import { DashboardShellProvider } from "@/components/dashboard-shell-context";
import { NewRunModal } from "@/components/new-run-modal";
import { cn } from "@/lib/utils";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isReady } = useAuth();
  const router = useRouter();
  const [onboarded] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("flowpilot_onboarded") === "true";
  });
  const [collapsed, setCollapsed] = useState(false);
  const [newRunOpen, setNewRunOpen] = useState(false);

  useEffect(() => {
    if (!isReady) return;

    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }

    if (!onboarded) {
      router.replace("/onboarding");
    }
  }, [isAuthenticated, isReady, onboarded, router]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const inEditable =
        target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.isContentEditable;
      if (inEditable) return;
      if (event.key.toLowerCase() === "n") {
        event.preventDefault();
        setNewRunOpen(true);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  if (!isReady || !isAuthenticated || !onboarded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm text-slate-600">
        Loading workspace...
      </div>
    );
  }

  return (
    <DashboardShellProvider
      value={{
        collapsed,
        toggleSidebar: () => setCollapsed((prev) => !prev),
        openNewRun: () => setNewRunOpen(true),
      }}
    >
      <div className="min-h-screen bg-slate-50">
        <Sidebar />
        <Navbar />
        <main
          className={cn(
            "min-h-screen pt-16 transition-all",
            collapsed ? "ml-16" : "ml-60"
          )}
        >
          <div className="p-6 md:p-8">{children}</div>
        </main>
      </div>
      <NewRunModal open={newRunOpen} onClose={() => setNewRunOpen(false)} />
    </DashboardShellProvider>
  );
}
