"use client";

import { Bell, Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/form-fields";
import { useDashboardShell } from "@/components/dashboard-shell-context";

export function Navbar() {
  const { openNewRun } = useDashboardShell();
  const [query, setQuery] = useState("");

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-border bg-background/80 px-6 backdrop-blur-md">
      <div className="flex items-center gap-4">
        {/* <Button variant="ghost" size="icon" onClick={toggleSidebar} className="text-muted-foreground">
          <Menu className="h-5 w-5" />
        </Button> */}
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder="Search transactions..."
          className="hidden md:flex w-64 rounded-full"
        />
      </div>

      <div className="flex items-center gap-3">
        <button className="relative flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:text-foreground transition-colors">
          <Bell className="h-4.5 w-4.5" />
          <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full border-2 border-background bg-brand" />
        </button>

        <Button 
          onClick={openNewRun}
          className="h-10 rounded-full bg-brand px-6 font-bold text-white transition-all"
        >
          <Plus className="mr-1 h-4 w-4 stroke-3" />
          New Run
        </Button>
      </div>
    </header>
  );
}