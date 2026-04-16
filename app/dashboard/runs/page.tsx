"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Activity,
  ArrowRight,
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
import { useKycStatus } from "@/hooks/use-kyc-queries";
import Link from "next/link";
import { RunFilterModal } from "@/components/dashboard/run/RunFilterModal";
import { ExportRunsModal } from "@/components/dashboard/run/ExportRunsModal";

const LIVE_STATUSES = new Set(["planning", "reconciling", "scoring", "executing"]);

const columns: TableColumn<RunRecord>[] = [
  {
    id: "id",
    header: "Payout ID",
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
    header: "Beneficiaries",
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

  const { data: kycData } = useKycStatus();
  const kycStatus = kycData?.kyc_status;
  const kycVerified = kycStatus === "verified";

  const {
    data: rows = [],
    isLoading: loadingRuns,
    isError: loadError,
  } = useRuns(kycVerified);

  // ── KYC gate ──────────────────────────────────────────────────────────────
  if (kycData && !kycVerified) {
    return (
      <div className="space-y-6">
        <PageHeader title="Payouts" description="Monitor and manage all your payout batches." />
        <div className="flex flex-col items-center gap-5 rounded-2xl border border-border/60 bg-card p-10 text-center shadow-sm">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
            <ShieldAlert className="h-7 w-7 text-muted-foreground" />
          </div>
          <div>
            <h2 className="text-base font-black text-foreground">Verification Required</h2>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground leading-relaxed">
              {kycStatus === "pending"
                ? "Your business documents are under review. You'll be able to access payouts once verification is complete."
                : "Complete business verification (KYC) to unlock payouts and other features."}
            </p>
          </div>
          <Link
            href="/dashboard/kyc"
            className="inline-flex items-center gap-2 rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:opacity-90"
          >
            {kycStatus === "pending" ? "Check Verification Status" : "Complete Verification"}
          </Link>
        </div>
      </div>
    );
  }

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
        title="Payouts"
        description="Monitor and manage all your payout batches."
      />

      {/* Metric cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <MetricCard
          label="Total Payouts"
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
          label="Failed Payouts"
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

      {/* Live Now strip */}
      {(() => {
        const liveRuns = rows.filter((r) => LIVE_STATUSES.has(r.status));
        if (!liveRuns.length) return null;
        return (
          <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-brand/20 bg-brand/5 px-5 py-3.5">
            <div className="flex items-center gap-2 shrink-0">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-brand" />
              </span>
              <span className="text-sm font-bold text-brand">Live</span>
            </div>
            {liveRuns.map((run) => (
              <button
                key={run.id}
                type="button"
                onClick={() => router.push(`/dashboard/runs/${run.id}`)}
                className="inline-flex items-center gap-1.5 rounded-full border border-brand/20 bg-background px-3 py-1 text-xs font-semibold text-foreground shadow-sm transition-all hover:border-brand/50"
              >
                <Activity className="h-3 w-3 text-brand" />
                <span className="max-w-[180px] truncate">{run.objective}</span>
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
              </button>
            ))}
          </div>
        );
      })()}

      {/* Runs table */}
      <div className="">
        {/* Toolbar */}
        <div className="flex flex-col gap-4 py-4 md:flex-row md:items-center md:justify-between">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Search by objective or payout ID..."
            className="w-full md:w-80"
          />
          <div className="flex w-full items-center gap-2 md:w-auto">
            <ToolbarButton icon={<SlidersHorizontal className="h-3.5 w-3.5" />} onClick={() => setFilterOpen(true)} badge={activeFilterCount || undefined}>
              Filter
            </ToolbarButton>
            <ToolbarButton icon={<Download className="h-3.5 w-3.5" />} onClick={() => setExportOpen(true)}>
              Export
            </ToolbarButton>
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
                  No payouts found
                </p>
                <p className="text-sm text-muted-foreground">
                  Create your first payout to get started.
                </p>
                <Button
                  className="mt-1 rounded-full bg-brand px-6 text-white hover:opacity-90"
                  onClick={openNewRun}
                >
                  Start Your First Payout
                </Button>
              </div>
            }
          />
        )}
      </div>
    </div>
  );
}

function ToolbarButton({
  icon,
  onClick,
  badge,
  children,
}: {
  icon: React.ReactNode;
  onClick: () => void;
  badge?: number;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="relative inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-transparent px-3.5 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:border-border hover:bg-muted/40 hover:text-foreground"
    >
      {icon}
      {children}
      {badge !== undefined && (
        <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand text-[10px] font-black text-white">
          {badge}
        </span>
      )}
    </button>
  );
}
