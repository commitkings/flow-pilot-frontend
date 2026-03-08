"use client";

import { useState } from "react";
import { Download, FileSearch, Loader2, ShieldAlert, SlidersHorizontal, TrendingUp, Zap } from "lucide-react";
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

export default function TransactionsPage() {
  const [search, setSearch] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<TransactionFilters>(EMPTY_TX_FILTERS);

  const activeFilterCount = Object.values(appliedFilters).filter(Boolean).length;

  const apiFilters: ApiFilters = {
    run_id: appliedFilters.runId || undefined,
    status: appliedFilters.status || undefined,
    channel: appliedFilters.channel || undefined,
    from_date: appliedFilters.fromDate || undefined,
    to_date: appliedFilters.toDate || undefined,
    search: search || undefined,
  };

  const { data, isLoading, isError } = useTransactions(apiFilters);

  const transactions = data?.transactions ?? [];
  const summary = data?.summary ?? { total_transactions: 0, total_volume: 0, anomaly_count: 0, failed_count: 0 };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Transactions"
        description="View and audit all reconciled transactions across your runs."
      />

      {/* Metric cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Total"
          value={isLoading ? "…" : String(summary.total_transactions)}
          subtext="Reconciled transactions"
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
          subtext="Transactions"
          icon={<ShieldAlert className="h-4 w-4" />}
          accent="red"
        />
      </div>

      {/* Table card */}
      <div className=" overflow-hidden">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-6 py-4">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by reference or narration…"
            className="min-w-48 w-72 flex-1 md:flex-initial"
          />
          <div className="flex items-center gap-3">
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
                {["Reference", "Status", "Amount", "Channel", "Direction", "Counterparty", "Date"].map((h) => (
                  <th key={h} className="px-6 py-3 text-xs font-black uppercase tracking-wider text-muted-foreground">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-sm text-destructive">
                    Failed to load transactions. Please refresh.
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <p className="text-base font-black text-foreground">No transactions found</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {activeFilterCount > 0
                        ? "Try adjusting your filters."
                        : "Transactions will appear here after a run completes."}
                    </p>
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-3 font-mono text-xs text-foreground">{tx.reference}</td>
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
