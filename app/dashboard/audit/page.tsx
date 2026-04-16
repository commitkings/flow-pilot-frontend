"use client";

import { useState } from "react";
import { Loader2, FileText, Activity, Shield, Download, X } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { PageHeader } from "@/components/ui/page-header";
import { Pagination } from "@/components/ui/pagination";
import { ExportAuditModal } from "@/components/dashboard/audit/ExportAuditModal";
import { DateInput } from "@/components/ui/form-fields";
import { useAuditEntries } from "@/hooks/use-audit-queries";
import type { AuditFilters } from "@/lib/api-client";

const PAGE_SIZE = 50;

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
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [runIdFilter, setRunIdFilter] = useState("");
  const [exportOpen, setExportOpen] = useState(false);
  const [offset, setOffset] = useState(0);
  const [searchTab, setSearchTab] = useState<"action" | "run_id">("action");

  const apiFilters: AuditFilters = {
    agent_type: agentFilter || undefined,
    from_date: fromDate || undefined,
    to_date: toDate || undefined,
    action: actionFilter || undefined,
    run_id: runIdFilter || undefined,
  };

  const hasActiveFilters =
    Boolean(fromDate) ||
    Boolean(toDate) ||
    Boolean(actionFilter) ||
    Boolean(runIdFilter);

  function clearFilters() {
    setFromDate("");
    setToDate("");
    setActionFilter("");
    setRunIdFilter("");
    setOffset(0);
  }

  const { data, isLoading, isError } = useAuditEntries(apiFilters, PAGE_SIZE, offset);

  const entries = data?.entries ?? [];
  const total = data?.total ?? 0;
  const uniqueRuns = new Set(entries.map((e) => e.run_id)).size;
  const uniqueAgents = new Set(entries.map((e) => e.agent_type)).size;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Trail"
        description="Full audit trail and agent activity across all payouts."
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
          label="Payouts Covered"
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
        {/* ── Advanced filter row ───────────────────────────────────────── */}
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border p-4 md:px-6">

          {/* Left: date pickers */}
          <div className="flex items-end gap-3">
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground px-1">From</span>
              <DateInput
                value={fromDate}
                onChange={(v) => { setFromDate(v); setOffset(0); }}
                placeholder="Start date"
                className="w-40 h-10 border-border/60"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground px-1">To</span>
              <DateInput
                value={toDate}
                onChange={(v) => { setToDate(v); setOffset(0); }}
                placeholder="End date"
                className="w-40 h-10 border-border/60"
              />
            </div>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center gap-1.5 h-10 rounded-full border border-border/60 bg-transparent px-3.5 text-xs font-semibold text-muted-foreground transition-colors hover:border-border hover:bg-muted/40 hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
                Clear
              </button>
            )}
          </div>

          {/* Right: inline tabbed search */}
          <div className="flex flex-col gap-1.5 flex-1 md:max-w-sm lg:max-w-md xl:max-w-lg">
            <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground px-1">Search</span>
            <div className="flex h-10 w-full items-center rounded-full border border-border/60 bg-background transition-all focus-within:border-brand focus-within:ring-1 focus-within:ring-brand/10 overflow-hidden">
              {/* Tab prefix */}
              <div className="flex items-center gap-0.5 border-r border-border/60 px-2 shrink-0">
                {(["action", "run_id"] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setSearchTab(tab)}
                    className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors whitespace-nowrap ${
                      searchTab === tab
                        ? "bg-brand text-white"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {tab === "action" ? "Action" : "Payout ID"}
                  </button>
                ))}
              </div>
              {/* Search input */}
              <div className="flex items-center gap-1.5 px-3 flex-1">
                <svg className="h-3.5 w-3.5 shrink-0 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
                </svg>
                {searchTab === "action" ? (
                  <input
                    key="action"
                    value={actionFilter}
                    onChange={(e) => { setActionFilter(e.target.value); setOffset(0); }}
                    placeholder="Filter by action…"
                    className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                  />
                ) : (
                  <input
                    key="run_id"
                    value={runIdFilter}
                    onChange={(e) => { setRunIdFilter(e.target.value); setOffset(0); }}
                    placeholder="Payout ID…"
                    className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                  />
                )}
              </div>
            </div>
          </div>

        </div>

        {/* ── Agent type filter + export ────────────────────────────────── */}
        <div className="flex flex-col gap-4 border-b border-border px-4 py-4 md:flex-row md:items-center md:justify-between md:px-6">
          <div className="flex items-center gap-2 flex-wrap">
            {["", "planner", "reconciliation", "risk", "forecast", "execution", "audit"].map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => { setAgentFilter(a); setOffset(0); }}
                className={`inline-flex items-center rounded-full border px-3.5 py-2 text-xs font-semibold capitalize transition-colors ${
                  agentFilter === a
                    ? "border-brand bg-brand text-white"
                    : "border-border/60 bg-transparent text-muted-foreground hover:border-border hover:bg-muted/40 hover:text-foreground"
                }`}
              >
                {a || "All"}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setExportOpen(true)}
            disabled={entries.length === 0}
            className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-transparent px-3.5 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:border-border hover:bg-muted/40 hover:text-foreground disabled:pointer-events-none disabled:opacity-40 shrink-0"
          >
            <Download className="h-3.5 w-3.5" />
            Export
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-4 py-3 text-xs font-black uppercase tracking-wider text-muted-foreground md:px-6">Agent</th>
                <th className="px-4 py-3 text-xs font-black uppercase tracking-wider text-muted-foreground md:px-6">Action</th>
                <th className="hidden px-6 py-3 text-xs font-black uppercase tracking-wider text-muted-foreground md:table-cell">Run</th>
                <th className="hidden px-6 py-3 text-xs font-black uppercase tracking-wider text-muted-foreground lg:table-cell">Details</th>
                <th className="px-4 py-3 text-xs font-black uppercase tracking-wider text-muted-foreground md:px-6">Timestamp</th>
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
                    <td className="px-4 py-3 md:px-6">
                      <StatusBadge status={agentBadge(entry.agent_type)} label={entry.agent_type} />
                    </td>
                    <td className="px-4 py-3 font-medium text-foreground md:px-6">{entry.action}</td>
                    <td className="hidden px-6 py-3 font-mono text-xs text-muted-foreground md:table-cell">
                      {entry.run_id.slice(0, 8)}
                    </td>
                    <td className="hidden px-6 py-3 text-xs text-muted-foreground max-w-[300px] truncate lg:table-cell">
                      {entry.detail ? JSON.stringify(entry.detail).slice(0, 80) : "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground md:px-6 md:text-sm">
                      {formatDateTime(entry.created_at)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <Pagination total={total} limit={PAGE_SIZE} offset={offset} onChange={setOffset} />
      </div>

      <ExportAuditModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        entries={entries}
      />
    </div>
  );
}
