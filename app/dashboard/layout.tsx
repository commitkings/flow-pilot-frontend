"use client";

import { Sidebar } from "@/components/dashboard/sidebar";
import { Navbar } from "@/components/dashboard/navbar";
import { DashboardShellProvider } from "@/components/dashboard-shell-context";
import { NewRunModal } from "@/components/dashboard/run-modal/new-run-modal";
import { cn } from "@/lib/utils";
import { useState } from "react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [newRunOpen, setNewRunOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <DashboardShellProvider
      value={{
        collapsed,
        toggleSidebar: () => setCollapsed((prev) => !prev),
        openNewRun: () => setNewRunOpen(true),
        mobileMenuOpen,
        toggleMobileMenu: () => setMobileMenuOpen((prev) => !prev),
      }}
    >
      <div className="min-h-screen bg-background text-foreground">
        <Sidebar />
        <div className={cn(
          "flex flex-col min-h-screen transition-all duration-300 ease-in-out",
          "ml-0",
          collapsed ? "md:ml-20" : "md:ml-64"
        )}>
          <Navbar />
          <main className="flex-1 p-4 md:p-8 lg:p-10 pb-20 md:pb-8">
            <div className="mx-auto max-w-7xl">
              {children}
            </div>
          </main>
        </div>
      </div>
      <NewRunModal open={newRunOpen} onClose={() => setNewRunOpen(false)} />
    </DashboardShellProvider>
  );
}