"use client";

import { useState } from "react";
import { Loader2, FileText, Activity, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/form-fields";
import { StatusBadge } from "@/components/status-badge";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { PageHeader } from "@/components/ui/page-header";
import { useAuditEntries } from "@/hooks/use-audit-queries";
import type { AuditFilters } from "@/lib/api-client";

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString("en-NG", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function agentBadge(agent: string) {
  if (agent === "risk") return "failed";
  if (agent === "reconciliation") return "planning";
  if (agent === "execution") return "completed";
  return "pending";
}

export default function AuditPage() {
  const [agentFilter, setAgentFilter] = useState("");

  const apiFilters: AuditFilters = {
    agent_type: agentFilter || undefined,
  };

  const { data, isLoading, isError } = useAuditEntries(apiFilters);

  const entries = data?.entries ?? [];
  const total = data?.total ?? 0;
  const uniqueRuns = new Set(entries.map((e) => e.run_id)).size;
  const uniqueAgents = new Set(entries.map((e) => e.agent_type)).size;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Trail"
        description="Full audit trail and agent activity across all runs."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard
          label="Total Entries"
          value={isLoading ? "…" : String(total)}
          subtext="Audit logs"
          icon={<FileText className="h-4 w-4" />}
          accent="brand"
        />
        <MetricCard
          label="Runs Covered"
          value={isLoading ? "…" : String(uniqueRuns)}
          subtext="Distinct runs"
          icon={<Activity className="h-4 w-4" />}
          accent="green"
        />
        <MetricCard
          label="Agent Types"
          value={isLoading ? "…" : String(uniqueAgents)}
          subtext="Active agents"
          icon={<Shield className="h-4 w-4" />}
          accent="amber"
        />
      </div>

      <div className="overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-border px-4 py-4 md:flex-row md:items-center md:justify-between md:px-6">
          <div className="flex items-center gap-3 flex-wrap">
            {["", "planner", "reconciliation", "risk", "forecast", "execution", "audit"].map((a) => (
              <Button
                key={a}
                variant={agentFilter === a ? "default" : "outline"}
                size="sm"
                className="rounded-full capitalize"
                onClick={() => setAgentFilter(a)}
              >
                {a || "All"}
              </Button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                {["Agent", "Action", "Run", "Details", "Timestamp"].map((h) => (
                  <th key={h} className="px-6 py-3 text-xs font-black uppercase tracking-wider text-muted-foreground">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center">
                    <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-sm text-destructive">
                    Failed to load audit trail. Please refresh.
                  </td>
                </tr>
              ) : entries.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center">
                    <p className="text-base font-black text-foreground">No audit entries found</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Audit entries will appear here as agents process runs.
                    </p>
                  </td>
                </tr>
              ) : (
                entries.map((entry) => (
                  <tr key={entry.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-3">
                      <StatusBadge status={agentBadge(entry.agent_type)} label={entry.agent_type} />
                    </td>
                    <td className="px-6 py-3 font-medium text-foreground">{entry.action}</td>
                    <td className="px-6 py-3 font-mono text-xs text-muted-foreground">
                      {entry.run_id.slice(0, 8)}
                    </td>
                    <td className="px-6 py-3 text-xs text-muted-foreground max-w-[300px] truncate">
                      {entry.detail ? JSON.stringify(entry.detail).slice(0, 80) : "—"}
                    </td>
                    <td className="px-6 py-3 text-muted-foreground">{formatDateTime(entry.created_at)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
