"use client";

import { createContext, useContext } from "react";

type DashboardShellContextType = {
  collapsed: boolean;
  toggleSidebar: () => void;
  openNewRun: () => void;
  mobileMenuOpen: boolean;
  toggleMobileMenu: () => void;
  inviteOpen: boolean;
  setInviteOpen: (open: boolean) => void;
};

const DashboardShellContext = createContext<DashboardShellContextType | null>(null);

export function DashboardShellProvider({
  value,
  children,
}: {
  value: DashboardShellContextType;
  children: React.ReactNode;
}) {
  return <DashboardShellContext.Provider value={value}>{children}</DashboardShellContext.Provider>;
}

export function useDashboardShell() {
  const context = useContext(DashboardShellContext);
  if (!context) {
    throw new Error("useDashboardShell must be used inside DashboardShellProvider");
  }
  return context;
}
