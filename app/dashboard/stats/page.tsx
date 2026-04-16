"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  TrendingUp,
  Zap,
  CheckCircle2,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
} from "lucide-react";
import { format } from "date-fns";

import { MetricCard } from "@/components/dashboard/MetricCard";
import { AnalyticsSection } from "@/components/dashboard/AnalyticsSection";
import { StatusBadge, type StatusType } from "@/components/status-badge";
import { PageHeader } from "@/components/ui/page-header";
import { getDashboardStats } from "@/lib/api-client";
import { useTransactions } from "@/hooks/use-transaction-queries";

function formatCurrency(n: number): string {
  if (n >= 1_000_000_000) return `₦${(n / 1_000_000_000).toFixed(2)}B`;
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `₦${(n / 1_000).toFixed(0)}K`;
  return `₦${n.toLocaleString()}`;
}

function relativeTime(iso: string | null): string {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  return `${d}d ago`;
}

const STATUS_ORDER = [
  "completed",
  "completed_with_errors",
  "awaiting_approval",
  "executing",
  "scoring",
  "reconciling",
  "planning",
  "failed",
  "cancelled",
];

export default function StatsPage() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: getDashboardStats,
    refetchInterval: 30_000,
  });

  const { data: txResponse, isLoading: txLoading } = useTransactions({}, 200, 0);

  // ── Server-computed metrics (accurate, no pagination cap) ─────────────────

  const totalRuns = stats?.total_runs ?? 0;
  const completedRuns = stats?.completed_runs ?? 0;
  const failedRuns = stats?.failed_runs ?? 0;
  const successRate = stats?.success_rate ?? 0;

  // ── Run status breakdown (from server recent_runs — for visual only) ──────

  const statusBreakdown = useMemo(() => {
    if (!stats) return [];
    const breakdown = [
      { status: "completed", count: completedRuns },
      { status: "failed", count: failedRuns },
      { status: "awaiting_approval", count: stats.pending_approvals },
      { status: "executing", count: stats.active_runs },
    ].filter((s) => s.count > 0);
    return breakdown.map((s) => ({
      ...s,
      pct: totalRuns > 0 ? Math.round((s.count / totalRuns) * 100) : 0,
    }));
  }, [stats, totalRuns, completedRuns, failedRuns]);

  // ── Top transactions by amount ────────────────────────────────────────────

  const topTransactions = useMemo(() => {
    return [...(txResponse?.transactions ?? [])]
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 8);
  }, [txResponse]);

  const totalTxAmount = useMemo(
    () => (txResponse?.transactions ?? []).reduce((sum, t) => sum + t.amount, 0),
    [txResponse]
  );

  return (
    <div className="space-y-8">
      <PageHeader
        title="Analytics"
        description="Workspace performance metrics and activity breakdown."
      />

      {/* ── KPI Cards ─────────────────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Total Disbursed"
          value={statsLoading ? "…" : formatCurrency(stats?.total_volume_disbursed ?? 0)}
          subtext="All-time across all payouts"
          icon={<TrendingUp className="h-4 w-4" />}
          accent="brand"
        />
        <MetricCard
          label="Total Payouts"
          value={statsLoading ? "…" : String(totalRuns)}
          subtext={`${completedRuns} completed · ${failedRuns} failed`}
          icon={<Zap className="h-4 w-4" />}
          accent="green"
        />
        <MetricCard
          label="Success Rate"
          value={statsLoading ? "…" : `${successRate}%`}
          subtext="Payouts completed successfully"
          icon={<CheckCircle2 className="h-4 w-4" />}
          accent={successRate >= 80 ? "green" : successRate >= 50 ? "amber" : "default"}
        />
        <MetricCard
          label="Active Now"
          value={statsLoading ? "…" : String(stats?.active_runs ?? 0)}
          subtext="Payouts currently processing"
          icon={<Activity className="h-4 w-4" />}
          accent={stats?.active_runs ? "brand" : "default"}
        />
      </div>

      {/* ── Charts ────────────────────────────────────────────────────────── */}
      <div>
        <h2 className="text-base font-black text-foreground mb-4">Charts</h2>
        <AnalyticsSection />
      </div>

      {/* ── Run Status Breakdown + Top Transactions ────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-2">

        {/* Run Status Breakdown */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-black text-foreground">Run Status Breakdown</h3>
            {!statsLoading && (
              <span className="text-[11px] font-semibold text-muted-foreground">
                {totalRuns} total
              </span>
            )}
          </div>

          {statsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="h-4 w-24 rounded-full bg-muted animate-pulse" />
                  <div className="flex-1 h-2 rounded-full bg-muted animate-pulse" />
                  <div className="h-4 w-8 rounded-full bg-muted animate-pulse" />
                </div>
              ))}
            </div>
          ) : statusBreakdown.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No runs yet.</p>
          ) : (
            <div className="space-y-4">
              {statusBreakdown.map(({ status, count, pct }) => (
                <div key={status} className="flex items-center gap-3">
                  <div className="w-36 shrink-0">
                    <StatusBadge status={status as StatusType} />
                  </div>
                  <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-brand transition-all duration-700"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-muted-foreground w-12 text-right">
                    {count} <span className="text-[10px] opacity-60">({pct}%)</span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Transactions */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-black text-foreground">Top Transactions</h3>
            {!txLoading && txResponse && (
              <span className="text-[11px] font-semibold text-muted-foreground">
                {formatCurrency(totalTxAmount)} total
              </span>
            )}
          </div>

          {txLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between gap-3">
                  <div className="flex-1 space-y-1">
                    <div className="h-3 w-32 rounded bg-muted animate-pulse" />
                    <div className="h-3 w-20 rounded bg-muted animate-pulse" />
                  </div>
                  <div className="h-4 w-20 rounded bg-muted animate-pulse" />
                </div>
              ))}
            </div>
          ) : topTransactions.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No transactions yet.</p>
          ) : (
            <div className="divide-y divide-border/60">
              {topTransactions.map((tx) => {
                const isSuccess =
                  tx.status === "success" || tx.status === "completed";
                const isFailed = tx.status === "failed";
                return (
                  <div key={tx.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {tx.counterparty_name || tx.narration || "—"}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Clock className="h-3 w-3 text-muted-foreground/60 shrink-0" />
                        <span className="text-[10px] text-muted-foreground">
                          {tx.date ? format(new Date(tx.date), "MMM d, yyyy") : "—"}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0 flex items-center gap-1.5">
                      {isSuccess ? (
                        <ArrowUpRight className="h-3.5 w-3.5 text-green-500" />
                      ) : isFailed ? (
                        <ArrowDownRight className="h-3.5 w-3.5 text-red-500" />
                      ) : null}
                      <span className="text-sm font-black text-foreground">
                        {formatCurrency(tx.amount)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
