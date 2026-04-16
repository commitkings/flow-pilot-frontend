"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Plus,
  ShieldAlert,
  TrendingUp,
  Zap,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { StatusBadge, type StatusType } from "@/components/status-badge";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { AnalyticsSection } from "@/components/dashboard/AnalyticsSection";
import { useAuth } from "@/context/auth-context";
import { getDashboardStats } from "@/lib/api-client";
import { canManageRuns } from "@/lib/api-types";
import { cn } from "@/lib/utils";

const LIVE_STATUSES = new Set(["planning", "reconciling", "scoring", "executing"]);

function formatCurrency(amount: number): string {
  if (amount >= 1_000_000_000) return `₦${(amount / 1_000_000_000).toFixed(1)}B`;
  if (amount >= 1_000_000) return `₦${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `₦${(amount / 1_000).toFixed(1)}K`;
  return `₦${amount.toLocaleString()}`;
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

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const canRun = canManageRuns(user);

  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: getDashboardStats,
    refetchInterval: 15_000, // refresh every 15s
  });

  const firstName = user?.first_name || user?.display_name?.split(" ")[0] || "there";
  const liveRuns = stats?.recent_runs.filter((r) => LIVE_STATUSES.has(r.status)) ?? [];
  const hasLive = liveRuns.length > 0;

  return (
    <div className="space-y-8">
      {/* ── Welcome header ───────────────────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">
            Good {getTimeOfDay()}, {firstName} 👋
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Here&apos;s what&apos;s happening in your workspace today.
          </p>
        </div>
        {canRun && (
          <Button
            onClick={() => router.push("/dashboard/runs/new")}
            className="h-10 shrink-0 rounded-full bg-primary px-5 text-primary-foreground font-semibold shadow-sm hover:opacity-90"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            New Payout
          </Button>
        )}
      </div>

      {/* ── Live Now banner ──────────────────────────────────────────────── */}
      {hasLive && (
        <div className="rounded-2xl border border-brand/20 bg-brand/5 px-5 py-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-brand" />
            </span>
            <span className="text-sm font-bold text-brand">Live Now — {liveRuns.length} payout{liveRuns.length > 1 ? "s" : ""} processing</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {liveRuns.map((run) => (
              <Link
                key={run.run_id}
                href={`/dashboard/runs/${run.run_id}`}
                className="inline-flex items-center gap-2 rounded-full border border-brand/20 bg-background px-3 py-1.5 text-xs font-semibold text-foreground shadow-sm transition-all hover:border-brand/50 hover:shadow"
              >
                <Activity className="h-3 w-3 text-brand" />
                <span className="max-w-[200px] truncate">{run.objective}</span>
                <ArrowRight className="h-3 w-3 text-muted-foreground" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── Stat cards ───────────────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Total Disbursed"
          value={isLoading ? "…" : formatCurrency(stats?.total_volume_disbursed ?? 0)}
          subtext="All-time successful payouts"
          icon={<TrendingUp className="h-4 w-4" />}
          accent="brand"
        />
        <MetricCard
          label="Payouts This Month"
          value={isLoading ? "…" : String(stats?.runs_this_month ?? 0)}
          subtext="Since start of month"
          icon={<Zap className="h-4 w-4" />}
          accent="green"
        />
        <MetricCard
          label="Pending Approvals"
          value={isLoading ? "…" : String(stats?.pending_approvals ?? 0)}
          subtext="Awaiting your review"
          icon={<ShieldAlert className="h-4 w-4" />}
          accent={stats?.pending_approvals ? "amber" : "default"}
        />
        <MetricCard
          label="Active Now"
          value={isLoading ? "…" : String(stats?.active_runs ?? 0)}
          subtext="Payouts currently processing"
          icon={<Activity className="h-4 w-4" />}
          accent={stats?.active_runs ? "brand" : "default"}
        />
      </div>

      {/* ── Analytics ────────────────────────────────────────────────────── */}
      <div>
        <SectionHeader title="Analytics" />
        <AnalyticsSection />
      </div>

      {/* ── Recent runs ──────────────────────────────────────────────────── */}
      <div>
        <SectionHeader title="Recent Payouts">
          <Link
            href="/dashboard/runs"
            className="flex items-center gap-1 text-xs font-semibold text-brand hover:opacity-80 transition-opacity"
          >
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </SectionHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-16 rounded-2xl border border-border bg-card">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : !stats?.recent_runs.length ? (
          <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-border bg-muted/10 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              <Zap className="h-7 w-7" />
            </div>
            <div>
              <p className="text-base font-black text-foreground">No payouts yet</p>
              <p className="mt-1 text-sm text-muted-foreground max-w-xs">
                Start your first payout by telling FlowPilot what you need in plain language.
              </p>
            </div>
            {canRun && (
              <Button
                onClick={() => router.push("/dashboard/runs/new")}
                className="rounded-full bg-primary px-5 text-primary-foreground font-semibold hover:opacity-90"
              >
                <Plus className="mr-1.5 h-4 w-4" />
                Start your first payout
              </Button>
            )}
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-5 py-3 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">Objective</th>
                  <th className="px-5 py-3 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 hidden sm:table-cell">Status</th>
                  <th className="px-5 py-3 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground/70 hidden md:table-cell">Recipients</th>
                  <th className="px-5 py-3 text-left text-[10px] font-black uppercase tracking-widest text-muted-foreground/70">When</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {stats.recent_runs.map((run) => {
                  const isLive = LIVE_STATUSES.has(run.status);
                  return (
                    <tr
                      key={run.run_id}
                      onClick={() => router.push(`/dashboard/runs/${run.run_id}`)}
                      className={cn(
                        "group cursor-pointer transition-colors hover:bg-muted/40",
                        isLive && "bg-brand/[0.03]"
                      )}
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          {isLive ? (
                            <span className="relative flex h-2 w-2 shrink-0">
                              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-75" />
                              <span className="relative inline-flex h-2 w-2 rounded-full bg-brand" />
                            </span>
                          ) : (
                            <span className="h-2 w-2 shrink-0 rounded-full bg-muted-foreground/20" />
                          )}
                          <span className="line-clamp-1 font-semibold text-foreground max-w-[220px]">
                            {run.objective}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 hidden sm:table-cell">
                        <StatusBadge
                          status={run.status as StatusType}
                          label={
                            run.status === "awaiting_approval"
                              ? "Awaiting Approval"
                              : run.status === "completed_with_errors"
                              ? "Completed w/ Errors"
                              : undefined
                          }
                        />
                      </td>
                      <td className="px-5 py-3.5 hidden md:table-cell">
                        <span className="text-sm font-medium text-foreground/70">
                          {run.candidate_count ?? "—"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-muted-foreground whitespace-nowrap">
                        {relativeTime(run.created_at)}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/30 inline-block transition-all group-hover:text-brand group-hover:translate-x-0.5" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Quick actions ────────────────────────────────────────────────── */}
      <div>
        <SectionHeader title="Quick Actions" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {canRun && (
            <QuickAction
              href="/dashboard/runs/new"
              icon={<Zap className="h-5 w-5" />}
              title="Start a Payout"
              description="Describe your disbursement in plain English and let FlowPilot handle the rest."
              accent="brand"
            />
          )}
          {(stats?.pending_approvals ?? 0) > 0 && (
            <QuickAction
              href="/dashboard/runs"
              icon={<ShieldAlert className="h-5 w-5" />}
              title={`${stats!.pending_approvals} Payout${stats!.pending_approvals > 1 ? "s" : ""} Need Approval`}
              description="Review risk scores and approve or reject pending disbursements."
              accent="amber"
            />
          )}
          <QuickAction
            href="/dashboard/transactions"
            icon={<CheckCircle2 className="h-5 w-5" />}
            title="View Transactions"
            description="See all executed payouts, reconciliation records, and status updates."
            accent="green"
          />
        </div>
      </div>
    </div>
  );
}

function SectionHeader({
  title,
  children,
}: {
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2.5">
        <span className="h-4 w-1 rounded-full bg-brand" />
        <h2 className="text-base font-black tracking-tight text-foreground">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function getTimeOfDay(): string {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

function QuickAction({
  href,
  icon,
  title,
  description,
  accent,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  accent: "brand" | "amber" | "green";
}) {
  const accentBar = {
    brand: "before:bg-brand",
    amber: "before:bg-amber-500",
    green: "before:bg-emerald-500",
  };
  const iconColors = {
    brand: "bg-brand/10 text-brand",
    amber: "bg-amber-500/10 text-amber-600",
    green: "bg-emerald-500/10 text-emerald-600",
  };
  return (
    <Link
      href={href}
      className={cn(
        "group relative flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 transition-all hover:shadow-md hover:border-border/80",
        "before:absolute before:inset-x-0 before:top-0 before:h-0.75 before:rounded-t-2xl before:opacity-0 before:transition-opacity group-hover:before:opacity-100",
        accentBar[accent]
      )}
    >
      <div className="flex items-center justify-between">
        <div className={cn(
          "flex h-10 w-10 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110",
          iconColors[accent]
        )}>
          {icon}
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground/30 transition-all group-hover:text-brand group-hover:translate-x-0.5" />
      </div>
      <div>
        <p className="font-bold text-sm text-foreground">{title}</p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{description}</p>
      </div>
    </Link>
  );
}
