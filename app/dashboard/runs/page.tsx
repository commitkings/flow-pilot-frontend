"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Copy, FileSearch, Loader2, ShieldAlert, Wallet, X, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  SearchInput,
  SelectInput,
  DateRangeInput,
} from "@/components/ui/form-fields";
import { DataTable, type TableColumn } from "@/components/ui/data-table";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { StatusBadge } from "@/components/status-badge";
import { useDashboardShell } from "@/components/dashboard-shell-context";
import { truncateRunId, type RunRecord } from "@/lib/mock-data";
import { PageHeader } from "@/components/ui/page-header";
import { useRuns } from "@/hooks/use-run-queries";

const STATUS_OPTIONS = ["Running", "Awaiting Approval", "Completed", "Failed"];

const columns: TableColumn<RunRecord>[] = [
  {
    id: "id",
    header: "Run ID",
    cell: (run) => (
      <button
        type="button"
        className="group inline-flex items-center gap-1.5 font-mono text-xs font-semibold text-foreground"
        onClick={(e) => {
          e.stopPropagation();
          navigator.clipboard.writeText(run.id);
        }}
      >
        {truncateRunId(run.id)}
        <Copy className="h-3 w-3 opacity-0 transition group-hover:opacity-50" />
      </button>
    ),
  },
  {
    id: "objective",
    header: "Objective",
    className: "max-w-xs",
    cell: (run) => (
      <span
        className="line-clamp-1 text-muted-foreground"
        title={run.objective}
      >
        {run.objective}
      </span>
    ),
  },
  {
    id: "status",
    header: "Status",
    cell: (run) => (
      <StatusBadge
        status={run.status}
        label={
          run.status === "awaiting_approval" ? "Awaiting Approval" : undefined
        }
      />
    ),
  },
  {
    id: "candidates",
    header: "Candidates",
    cell: (run) => (
      <span className="text-muted-foreground">{run.candidates}</span>
    ),
  },
  {
    id: "started",
    header: "Started",
    cell: (run) => (
      <span className="text-muted-foreground" title={run.startedAt}>
        {run.startedRelative}
      </span>
    ),
  },
  // {
  //   id: "actions",
  //   header: "",
  //   cell: () => (
  //     <Button size="sm" variant="outline" className="rounded-full text-xs">
  //       View
  //     </Button>
  //   ),
  // },
];

export default function RunsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { openNewRun } = useDashboardShell();

  const [dismissedWelcome, setDismissedWelcome] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const { data: rows = [], isLoading: loadingRuns, isError: loadError } = useRuns();

  const showWelcome = searchParams.get("welcome") === "1" && !dismissedWelcome;

  const filteredRows = useMemo(
    () =>
      rows.filter((run) => {
        const q = query.toLowerCase();
        const matchesQuery =
          run.id.toLowerCase().includes(q) ||
          run.objective.toLowerCase().includes(q);
        const matchesStatus =
          !statusFilter ||
          run.status === statusFilter.toLowerCase().replace(" ", "_");
        return matchesQuery && matchesStatus;
      }),
    [query, rows, statusFilter]
  );

  return (
    <div className="space-y-8">
      {/* Welcome banner */}
      {showWelcome && (
        <div className="flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3.5 dark:border-emerald-900 dark:bg-emerald-950/40">
          <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
            Welcome to FlowPilot — your workspace is ready.
          </p>
          <button
            onClick={() => {
              setDismissedWelcome(true);
              router.replace("/dashboard/runs");
            }}
            className="text-emerald-600 hover:text-emerald-900 dark:text-emerald-400"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div>
        <PageHeader
          title="Runs"
          description="Monitor and manage all your automated treasury runs."
        />
      </div>

      {/* Metric cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Total Runs"
          value={loadingRuns ? "…" : String(rows.length)}
          subtext="Active automation"
          icon={<Zap className="h-4 w-4" />}
          accent="brand"
        />
        <MetricCard
          label="Total Disbursed"
          value="—"
          subtext="Settled this month"
          icon={<Wallet className="h-4 w-4" />}
          accent="green"
        />
        <MetricCard
          label="Pending Approvals"
          value={loadingRuns ? "…" : String(rows.filter(r => r.status === "awaiting_approval").length)}
          subtext="Requires authorization"
          icon={<FileSearch className="h-4 w-4" />}
          accent="amber"
        />
        <MetricCard
          label="Failed Runs"
          value={loadingRuns ? "…" : String(rows.filter(r => r.status === "failed").length)}
          subtext="Immediate action required"
          icon={<ShieldAlert className="h-4 w-4" />}
          accent="red"
        />
      </div>

      {/* Runs table */}
      <div className="rounded-2xl border border-border bg-card">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3 border-b border-border px-5 py-4">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Search by objective or run ID..."
            className="min-w-50 flex-1"
          />
          <SelectInput
            value={statusFilter}
            onChange={setStatusFilter}
            placeholder="All Statuses"
            options={STATUS_OPTIONS}
          />
          <DateRangeInput
            from={fromDate}
            to={toDate}
            onFromChange={setFromDate}
            onToChange={setToDate}
          />
        </div>

        {/* Table */}
        {loadingRuns ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : loadError ? (
          <div className="flex justify-center py-12"><p className="text-sm text-red-600">Failed to load runs. Please refresh the page.</p></div>
        ) : (
          <DataTable
            columns={columns}
            data={filteredRows}
            keyExtractor={(run) => run.id}
            onRowClick={(run) => router.push(`/dashboard/runs/${run.id}`)}
            emptyState={
              <div className="space-y-3">
                <p className="text-base font-black text-foreground">
                  No runs found
                </p>
                <p className="text-sm text-muted-foreground">
                  Create your first run to start automated treasury execution.
                </p>
                <Button
                  className="mt-1 rounded-full bg-brand px-6 text-white hover:opacity-90"
                  onClick={openNewRun}
                >
                  Start Your First Run
                </Button>
              </div>
            }
          />
        )}
      </div>
    </div>
  );
}
