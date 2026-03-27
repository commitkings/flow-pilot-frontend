"use client";

import { useState } from "react";
import { Download, FileSearch, Loader2, ShieldAlert, SlidersHorizontal, TrendingUp, Zap, Building, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/form-fields";
import { StatusBadge } from "@/components/status-badge";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { PageHeader } from "@/components/ui/page-header";
import { useTransactions } from "@/hooks/use-transaction-queries";
import {
  TransactionFilterModal,
  EMPTY_TX_FILTERS,
  type TransactionFilters,
} from "@/components/dashboard/transaction/TransactionFilterModal";
import { ExportTransactionsModal } from "@/components/dashboard/transaction/ExportTransactionsModal";
import type { TransactionFilters as ApiFilters } from "@/lib/api-client";

function formatCurrency(value: number): string {
  return `₦${value.toLocaleString("en-NG")}`;
}

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

function txStatus(status: string): "pending" | "completed" | "failed" {
  if (status === "FAILED") return "failed";
  if (status === "PENDING") return "pending";
  return "completed";
}

function sourceBadgeClass(recordType?: "reconciled" | "payout"): string {
  return recordType === "payout"
    ? "border border-teal-300 bg-teal-50 text-teal-900 dark:border-teal-700 dark:bg-teal-950/30 dark:text-teal-200"
    : "border border-sky-300 bg-sky-50 text-sky-900 dark:border-sky-700 dark:bg-sky-950/30 dark:text-sky-200";
}

export default function TransactionsPage() {
  const [search, setSearch] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<TransactionFilters>(EMPTY_TX_FILTERS);
  const [viewMode, setViewMode] = useState<"bank" | "all">("all");

  const activeFilterCount = Object.values(appliedFilters).filter(Boolean).length;

  const apiFilters: ApiFilters = {
    run_id: appliedFilters.runId || undefined,
    status: appliedFilters.status || undefined,
    channel: appliedFilters.channel || undefined,
    from_date: appliedFilters.fromDate || undefined,
    to_date: appliedFilters.toDate || undefined,
    search: search || undefined,
    include_payouts: viewMode === "all",
  };

  const { data, isLoading, isError } = useTransactions(apiFilters);

  const transactions = data?.transactions ?? [];
  const summary = data?.summary ?? { total_transactions: 0, total_volume: 0, anomaly_count: 0, failed_count: 0 };
  const isBankView = viewMode === "bank";
  const pageDescription = isBankView
    ? "View reconciled bank transactions pulled during the reconciliation step."
    : "View combined activity across runs, including reconciled bank transactions and payout activity.";
  const totalSubtext = isBankView ? "Reconciled bank transactions" : "Rows across bank and payout activity";
  const failedSubtext = isBankView ? "Transactions" : "Failed rows";
  const emptyMessage = activeFilterCount > 0
    ? "Try adjusting your filters."
    : isBankView
      ? "Reconciled bank transactions will appear here after Transaction Search succeeds for a run."
      : "Payout activity and reconciled bank transactions will appear here after runs complete.";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Transactions"
        description={pageDescription}
      />

      {/* Metric cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Total"
          value={isLoading ? "…" : String(summary.total_transactions)}
          subtext={totalSubtext}
          icon={<Zap className="h-4 w-4" />}
          accent="brand"
        />
        <MetricCard
          label="Volume"
          value={isLoading ? "…" : formatCurrency(summary.total_volume)}
          subtext="Total amount"
          icon={<TrendingUp className="h-4 w-4" />}
          accent="green"
        />
        <MetricCard
          label="Anomalies"
          value={isLoading ? "…" : String(summary.anomaly_count)}
          subtext="Flagged"
          icon={<FileSearch className="h-4 w-4" />}
          accent="amber"
        />
        <MetricCard
          label="Failed"
          value={isLoading ? "…" : String(summary.failed_count)}
          subtext={failedSubtext}
          icon={<ShieldAlert className="h-4 w-4" />}
          accent="red"
        />
      </div>

      {/* Table card */}
      <div className=" overflow-hidden">
        {/* Toolbar */}
        <div className="flex flex-col gap-4 border-b border-border px-4 py-4 md:flex-row md:items-center md:justify-between md:px-6">
          <div className="space-y-2">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search by reference or narration…"
              className="w-full md:w-80"
            />
            <p className="text-xs text-muted-foreground">
              {isBankView
                ? "Bank Transactions shows only reconciled rows from the reconciliation step."
                : "All Activity combines reconciled bank rows with payout activity from approved runs."}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 rounded-full border border-border bg-muted/30 p-1">
              <button
                onClick={() => setViewMode("bank")}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                  viewMode === "bank"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Building className="h-3.5 w-3.5" />
                Bank Transactions
              </button>
              <button
                onClick={() => setViewMode("all")}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                  viewMode === "all"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Activity className="h-3.5 w-3.5" />
                All Activity
              </button>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFilterOpen(true)}
              className="relative h-10 gap-2 rounded-full px-5 text-sm font-semibold"
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
              className="h-10 gap-2 rounded-full px-5 text-sm font-semibold"
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                {["Reference", "Source", "Status", "Amount", "Channel", "Direction", "Counterparty", "Date"].map((h) => (
                  <th key={h} className="px-6 py-3 text-xs font-black uppercase tracking-wider text-muted-foreground">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center">
                    <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-sm text-destructive">
                    Failed to load transactions. Please refresh.
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center">
                    <p className="text-base font-black text-foreground">No transactions found</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {emptyMessage}
                    </p>
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-3 font-mono text-xs text-foreground">{tx.reference}</td>
                    <td className="px-6 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${sourceBadgeClass(tx.record_type)}`}>
                        {tx.record_type === "payout" ? "Payout Activity" : "Reconciled Bank"}
                      </span>
                    </td>
                    <td className="px-6 py-3">
                      <StatusBadge status={txStatus(tx.status)} label={tx.status} />
                    </td>
                    <td className="px-6 py-3 font-semibold text-foreground">{formatCurrency(tx.amount)}</td>
                    <td className="px-6 py-3 text-muted-foreground">{tx.channel || "—"}</td>
                    <td className="px-6 py-3 text-muted-foreground capitalize">{tx.direction}</td>
                    <td className="px-6 py-3 text-muted-foreground">{tx.counterparty_name || "—"}</td>
                    <td className="px-6 py-3 text-muted-foreground">{tx.date ? formatDateTime(tx.date) : "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <TransactionFilterModal
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        onApply={(f) => { setAppliedFilters(f); setFilterOpen(false); }}
        current={appliedFilters}
      />

      <ExportTransactionsModal
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        rows={transactions}
      />
    </div>
  );
}
