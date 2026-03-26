"use client";

import { Menu, Plus, Users } from "lucide-react";
import { Logo } from "@/components/brand/Logo";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/form-fields";
import { useDashboardShell } from "@/components/dashboard-shell-context";

export function Navbar() {
  const { openNewRun, toggleMobileMenu, setInviteOpen } = useDashboardShell();
  const [query, setQuery] = useState("");
  const pathname = usePathname();

  const isRunsPage = pathname === "/dashboard/runs" || pathname === "/dashboard";
  const isTeamPage = pathname === "/dashboard/team";

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur-md md:px-6">
      {/* Mobile: logo left */}
      <div className="flex items-center md:hidden">
        <Logo variant="full" size="md" />
      </div>

      {/* Desktop: search left */}
      <div className="hidden md:flex items-center gap-4">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Search..."
          className="w-64 rounded-full"
        />
      </div>

      <div className="flex items-center gap-3">
        {isRunsPage && (
          <Button
            onClick={openNewRun}
            className="h-10 rounded-full bg-brand px-4 md:px-6 font-bold text-white transition-all shadow-sm hover:opacity-90"
          >
            <Plus className="h-4 w-4 stroke-3 md:mr-1.5" />
            <span className="hidden md:inline">New Run</span>
          </Button>
        )}
        {isTeamPage && (
          <Button
            onClick={() => setInviteOpen(true)}
            className="h-10 rounded-full bg-brand px-4 md:px-6 font-bold text-white transition-all shadow-sm hover:opacity-90"
          >
            <Users className="h-4 w-4 md:mr-1.5" />
            <span className="hidden md:inline">Invite Member</span>
          </Button>
        )}
        {/* Mobile: menu icon right */}
        <button
          onClick={toggleMobileMenu}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground md:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}
