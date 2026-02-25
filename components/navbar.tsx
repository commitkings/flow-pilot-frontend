"use client";

import { Bell, Menu, Plus, Search } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/context/auth-context";
import { useDashboardShell } from "@/components/dashboard-shell-context";
import { cn } from "@/lib/utils";

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();
  const { collapsed, toggleSidebar, openNewRun } = useDashboardShell();

  return (
    <header
      className={cn(
        "fixed right-0 top-0 z-30 flex h-16 items-center border-b border-slate-200 bg-white px-4 md:px-6",
        collapsed ? "left-16" : "left-60"
      )}
    >
      <div className="flex w-full items-center gap-3">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={toggleSidebar}>
            <Menu className="h-5 w-5" />
          </Button>
          <button type="button" className="hidden items-center gap-2 sm:flex" onClick={() => router.push("/dashboard/runs")}> 
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-slate-900 text-[10px] font-bold text-white">FP</span>
            <span className="text-sm font-semibold text-slate-900">FlowPilot</span>
          </button>
        </div>

        <div className="mx-auto hidden w-full max-w-xl items-center gap-2 rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 md:flex">
          <Search className="h-4 w-4 text-slate-500" />
          <input
            className="w-full bg-transparent text-sm text-slate-700 outline-none"
            placeholder="Search runs, transactions..."
          />
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button type="button" className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100">
            <Bell className="h-4 w-4" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
          </button>

          <Button className="h-9 rounded-xl bg-blue-600 text-white hover:bg-blue-700" onClick={openNewRun}>
            <Plus className="h-4 w-4" />
            New Run
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-slate-200 text-xs font-semibold text-slate-700">OA</AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={() => router.push("/dashboard/settings")}>Profile</DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/dashboard/settings")}>Settings</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={logout}>
                Log Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <span className="sr-only">{pathname}</span>
    </header>
  );
}
