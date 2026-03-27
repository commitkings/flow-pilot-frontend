"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Copy,
  Download,
  FileSearch,
  Loader2,
  ShieldAlert,
  SlidersHorizontal,
  X,
  Zap,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/form-fields";
import { DataTable, type TableColumn } from "@/components/ui/data-table";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { StatusBadge } from "@/components/status-badge";
import { useDashboardShell } from "@/components/dashboard-shell-context";
import { truncateRunId, type RunRecord } from "@/lib/mock-data";
import { PageHeader } from "@/components/ui/page-header";
import { useRuns } from "@/hooks/use-run-queries";
import { RunFilterModal } from "@/components/dashboard/run/RunFilterModal";
import { ExportRunsModal } from "@/components/dashboard/run/ExportRunsModal";

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
          run.status === "awaiting_approval"
            ? "Awaiting Approval"
            : run.status === "completed_with_errors"
              ? "Completed With Exceptions"
              : undefined
        }
      />
    ),
  },
  {
    id: "candidates",
    header: "Candidates",
    headerClassName: "hidden md:table-cell",
    className: "hidden md:table-cell",
    cell: (run) => (
      <span className="text-muted-foreground">{run.candidates}</span>
    ),
  },
  {
    id: "started",
    header: "Started",
    headerClassName: "hidden sm:table-cell",
    className: "hidden sm:table-cell",
    cell: (run) => (
      <span className="text-muted-foreground" title={run.startedAtLabel}>
        {run.startedRelative}
      </span>
    ),
  },
];


export default function RunsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { openNewRun } = useDashboardShell();

  const [dismissedWelcome, setDismissedWelcome] = useState(false);
  const [query, setQuery] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<import("@/components/dashboard/run/RunFilterModal").RunFilters>({
    runId: "", status: "", minCandidates: "", fromDate: "", toDate: "",
  });

  const activeFilterCount = Object.values(appliedFilters).filter(Boolean).length;

  const {
    data: rows = [],
    isLoading: loadingRuns,
    isError: loadError,
  } = useRuns();

  const showWelcome = searchParams.get("welcome") === "1" && !dismissedWelcome;

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      {showWelcome && (
        <div className="flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3.5">
          <p className="text-sm font-semibold text-emerald-800">
            Welcome to FlowPilot — your workspace is ready.
          </p>
          <button
            onClick={() => {
              setDismissedWelcome(true);
              router.replace("/dashboard/runs");
            }}
            className="text-emerald-600 hover:text-emerald-900"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <PageHeader
        title="Runs"
        description="Monitor and manage all your automated treasury runs."
      />

      {/* Metric cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <MetricCard
          label="Total Runs"
          value={loadingRuns ? "…" : String(rows.length)}
          subtext="Active automation"
          icon={<Zap className="h-4 w-4" />}
          accent="brand"
          className="col-span-2 sm:col-span-1"
        />
        {/* <MetricCard
          label="Total Disbursed"
          value="—"
          subtext="Settled this month"
          icon={<Wallet className="h-4 w-4" />}
          accent="green"
        /> */}
        <MetricCard
          label="Pending Approvals"
          value={
            loadingRuns
              ? "…"
              : String(
                rows.filter((r) => r.status === "awaiting_approval").length
              )
          }
          subtext="Requires authorization"
          icon={<FileSearch className="h-4 w-4" />}
          accent="amber"
        />
        <MetricCard
          label="Failed Runs"
          value={
            loadingRuns
              ? "…"
              : String(rows.filter((r) => r.status === "failed").length)
          }
          subtext="Immediate action required"
          icon={<ShieldAlert className="h-4 w-4" />}
          accent="red"
        />
      </div>

      {/* Runs table */}
      <div className="">
        {/* Toolbar */}
        <div className="flex flex-col gap-4 py-4 md:flex-row md:items-center md:justify-between">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Search by objective or run ID..."
            className="w-full md:w-80"
          />
          <div className="flex w-full items-center gap-3 md:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFilterOpen(true)}
              className="relative h-10 flex-1 gap-2 rounded-full px-4 text-sm font-semibold md:h-12 md:flex-none md:px-5"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filter
              {activeFilterCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand text-[10px] font-black text-white">
                  {activeFilterCount}
                </span>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setExportOpen(true)}
              className="h-10 flex-1 gap-2 rounded-full px-4 text-sm font-semibold md:h-12 md:flex-none md:px-5"
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>

          <RunFilterModal
            open={filterOpen}
            onClose={() => setFilterOpen(false)}
            onApply={(f) => { setAppliedFilters(f); setFilterOpen(false); }}
            current={appliedFilters}
          />

          <ExportRunsModal
            open={exportOpen}
            onClose={() => setExportOpen(false)}
            rows={rows}
          />
        </div>

        {/* Table */}
        {loadingRuns ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : loadError ? (
          <div className="flex justify-center py-12">
            <p className="text-sm text-destructive">
              Failed to load runs. Please refresh the page.
            </p>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={rows}
            keyExtractor={(run) => run.id}
            onRowClick={(run) => router.push(`/dashboard/runs/${run.id}`)}
            emptyState={
              <div className="space-y-3 flex items-center flex-col">
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
