"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  RefreshCw,
  Users,
  Wifi,
  WifiOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { StatusBadge } from "@/components/status-badge";
import { getActiveSessions } from "@/lib/api-client";
import type { ActiveSessionsResponse } from "@/lib/api-client";

function getInitials(name: string): string {
  if (!name?.trim()) return "??";
  if (name.includes("@")) {
    const local = name.split("@")[0] ?? "";
    const letters = local.replace(/[^a-zA-Z]/g, "");
    return (letters.slice(0, 2) || local.slice(0, 2) || "??").toUpperCase();
  }
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatRole(role: string): string {
  return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
}

function OnlineDot({ online }: { online: boolean }) {
  if (online) {
    return (
      <span className="relative flex h-3 w-3 items-center justify-center">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-60" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
      </span>
    );
  }
  return <span className="inline-flex h-2 w-2 rounded-full bg-muted-foreground/30" />;
}

type SessionMember = ActiveSessionsResponse["members"][number];

function MemberRow({ member }: { member: SessionMember }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors md:gap-4 md:px-5 md:py-4">
      {/* Avatar */}
      <div className="relative shrink-0">
        <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-muted text-sm font-bold text-muted-foreground md:h-10 md:w-10">
          {getInitials(member.display_name || member.email)}
        </span>
        <span className="absolute -bottom-0.5 -right-0.5">
          <OnlineDot online={member.is_online} />
        </span>
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">
          {member.display_name || member.email}
        </p>
        <p className="truncate text-xs text-muted-foreground">{member.email}</p>
      </div>

      {/* Role — hidden on xs, visible from sm */}
      <div className="hidden shrink-0 sm:block">
        <StatusBadge
          status={
            member.role === "owner" || member.role === "approver"
              ? "planning"
              : "pending"
          }
          label={formatRole(member.role)}
        />
      </div>

      {/* Online status */}
      <div className="shrink-0 flex items-center gap-1.5">
        {member.is_online ? (
          <>
            <Wifi className="h-3.5 w-3.5 text-green-500" />
            <span className="hidden text-xs font-semibold text-green-600 sm:inline">Online</span>
          </>
        ) : (
          <>
            <WifiOff className="h-3.5 w-3.5 text-muted-foreground/50" />
            <span className="hidden text-xs text-muted-foreground sm:inline">Offline</span>
          </>
        )}
      </div>
    </div>
  );
}

export default function SessionsPage() {
  const {
    data,
    isLoading,
    isError,
    refetch,
    isFetching,
    dataUpdatedAt,
  } = useQuery({
    queryKey: ["org-sessions"],
    queryFn: getActiveSessions,
    refetchInterval: 30_000,
  });

  const members = data?.members ?? [];
  const onlineMembers = members.filter((m) => m.is_online);
  const offlineMembers = members.filter((m) => !m.is_online);

  const lastUpdated = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString("en-NG", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title="Active Sessions"
          description="See who is currently logged in to your FlowPilot workspace. Refreshes automatically every 30 seconds."
        />
        <div className="flex items-center gap-3 shrink-0">
          {lastUpdated && (
            <p className="text-xs text-muted-foreground">
              Updated {lastUpdated}
            </p>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="h-9 rounded-full border-border px-4 font-semibold"
          >
            <RefreshCw
              className={`mr-1.5 h-3.5 w-3.5 ${isFetching ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard
          label="Online Now"
          value={isLoading ? "…" : String(data?.active_count ?? 0)}
          subtext="Active in last 15 min"
          icon={
            <span className="relative flex h-5 w-5 items-center justify-center">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-40" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-green-500" />
            </span>
          }
          accent="green"
        />
        <MetricCard
          label="Total Members"
          value={isLoading ? "…" : String(data?.total_members ?? 0)}
          subtext="In your workspace"
          icon={<Users className="h-5 w-5" />}
          accent="brand"
        />
        <MetricCard
          label="Session Window"
          value="15 min"
          subtext="Inactivity timeout"
          icon={<Activity className="h-5 w-5" />}
          accent="amber"
        />
      </div>

      {/* Members list */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        {/* Section: Online */}
        <div className="border-b border-border/60 px-5 py-3 bg-muted/20">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5 items-center justify-center">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-green-500" />
            </span>
            <p className="text-xs font-black uppercase tracking-[0.15em] text-muted-foreground/60">
              Online — {isLoading ? "…" : onlineMembers.length}
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="py-10 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <RefreshCw className="h-4 w-4 animate-spin" />
            Loading sessions…
          </div>
        ) : isError ? (
          <div className="py-10 text-center text-sm text-destructive">
            Failed to load sessions. Please refresh.
          </div>
        ) : onlineMembers.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <WifiOff className="mx-auto h-8 w-8 text-muted-foreground/30 mb-2" />
            <p className="text-sm font-semibold text-muted-foreground">Nobody is online right now</p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              Members appear here when they use the app within the last 15 minutes.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {onlineMembers.map((m) => (
              <MemberRow key={m.user_id} member={m} />
            ))}
          </div>
        )}

        {/* Section: Offline */}
        {!isLoading && !isError && offlineMembers.length > 0 && (
          <>
            <div className="border-t border-b border-border/60 px-5 py-3 bg-muted/20">
              <p className="text-xs font-black uppercase tracking-[0.15em] text-muted-foreground/60">
                Offline — {offlineMembers.length}
              </p>
            </div>
            <div className="divide-y divide-border/50">
              {offlineMembers.map((m) => (
                <MemberRow key={m.user_id} member={m} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
