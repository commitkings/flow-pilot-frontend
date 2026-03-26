"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle,
  ChevronDown,
  FileSearch,
  FileText,
  Info,
  Loader2,
  Radio,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { AgentTimeline } from "@/components/runs/agent-timeline";
import { AgentThinking } from "@/components/runs/agent-thinking";
import type { AuditEntry, TransactionSummary } from "@/lib/api-types";
import { LIVE_RUN_STATUSES } from "@/lib/event-types";
import { useRun, useRunReport, useRunSteps, useInvalidateRunQueries } from "@/hooks/use-run-queries";
import { useTransactions } from "@/hooks/use-transaction-queries";
import { useCandidates } from "@/hooks/use-candidate-queries";
import { useRunEvents } from "@/hooks/use-run-events";

type BadgeStatus =
  | "pending"
  | "planning"
  | "running"
  | "awaiting_approval"
  | "executing"
  | "completed"
  | "completed_with_errors"
  | "failed";

function truncateRunId(id: string): string {
  return id.slice(0, 8);
}

function formatCurrency(value: number): string {
  return `₦${value.toLocaleString("en-NG")}`;
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "—";
  return date.toLocaleString("en-NG", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatRelative(value: string): string {
  const createdAt = new Date(value).getTime();
  if (!Number.isFinite(createdAt)) return "—";
  const diffMinutes = Math.max(0, Math.floor((Date.now() - createdAt) / 60000));
  if (diffMinutes < 1) return "just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

function humanize(value: string | null | undefined): string {
  if (!value) return "—";
  return value.replaceAll("_", " ");
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function asString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function formatOptionalCurrency(value: unknown): string {
  const amount = asNumber(value);
  return amount === null ? "—" : formatCurrency(amount);
}

function summarizeRunStage(status: string): string {
  switch (status) {
    case "awaiting_approval":
      return "Analysis is complete. Review the recipient and approve before payment is sent.";
    case "executing":
      return "Approved payouts are currently being processed.";
    case "completed":
      return "This payout run finished successfully.";
    case "failed":
      return "This run hit an error before completion.";
    default:
      return "FlowPilot is preparing this payout run.";
  }
}

function cleanFailureMessage(value: string | null | undefined): string | null {
  if (!value) return null;
  return value
    .replace(/\(Background on this error at:[^)]+\)/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function failureHeadline(error: string | null | undefined): string {
  const message = (error ?? "").toLowerCase();
  if (message.includes("oauth/token") || message.includes("401")) {
    return "Interswitch authentication failed";
  }
  if (message.includes("account_number") || message.includes("customer_lookup_result")) {
    return "Lookup result could not be saved";
  }
  if (message.includes("session is already flushing") || message.includes("another operation is in progress")) {
    return "Background event logging interrupted execution";
  }
  return "Run execution failed";
}

function failureActions(error: string | null | undefined): string[] {
  const message = (error ?? "").toLowerCase();
  if (message.includes("oauth/token") || message.includes("401")) {
    return [
      "Check the Interswitch credentials and token configuration for this environment.",
      "Because this workspace is in lookup-only mode, approval can be retried after the auth issue is fixed.",
    ];
  }
  if (message.includes("account_number") || message.includes("customer_lookup_result")) {
    return [
      "Retry the approval after restarting the API so the latest lookup persistence fix is loaded.",
      "If it fails again, inspect the candidate lookup payload for missing account details.",
    ];
  }
  if (message.includes("session is already flushing") || message.includes("another operation is in progress")) {
    return [
      "Retry the approval after restarting the API so the event logging fix is active.",
      "If the issue repeats, disable non-critical telemetry for execution retries.",
    ];
  }
  return [
    "Review the failure detail below and retry after the underlying issue is fixed.",
    "If the run keeps failing, create a fresh run after correcting the root cause.",
  ];
}

function summarizeAuditTrailEntry(entry: AuditEntry): string {
  if (!entry.detail) return "Recorded by FlowPilot.";
  if (typeof entry.detail !== "object") return String(entry.detail);

  const detail = entry.detail as Record<string, unknown>;
  const agentType = entry.agent_type ?? "";
  const action = entry.action ?? "";

  // Semantic humanizers for specific agent_type + action combinations
  if (agentType === "planner" && action === "plan_generated") {
    const steps = detail.plan_steps as Array<{ agent_type?: string }> | undefined;
    if (steps?.length) {
      const stepNames = steps.map((s) => s.agent_type ?? "step").join(", ");
      return `Created execution plan with ${steps.length} steps: ${stepNames}`;
    }
    return "Generated execution plan for this run.";
  }

  if (agentType === "reconciliation") {
    const summary = detail.ai_summary as Record<string, unknown> | undefined;
    if (summary) {
      const parts: string[] = [];
      const insights = summary.insights as unknown[] | undefined;
      const gaps = summary.gaps as unknown[] | undefined;
      if (insights?.length) parts.push(`${insights.length} insight${insights.length > 1 ? "s" : ""} found`);
      if (gaps?.length) parts.push(`${gaps.length} gap${gaps.length > 1 ? "s" : ""} identified`);
      if (parts.length > 0) return `Reconciliation complete • ${parts.join(" • ")}`;
    }
    const txnCount = detail.transaction_count ?? detail.total_transactions;
    if (typeof txnCount === "number") {
      return `Reconciled ${txnCount.toLocaleString()} transactions`;
    }
    return "Transaction reconciliation completed.";
  }

  if (agentType === "risk") {
    const candidates = detail.candidates as Array<{ risk_decision?: string }> | undefined;
    if (candidates?.length) {
      const allow = candidates.filter((c) => c.risk_decision === "allow").length;
      const review = candidates.filter((c) => c.risk_decision === "review").length;
      const block = candidates.filter((c) => c.risk_decision === "block").length;
      const parts: string[] = [];
      if (allow > 0) parts.push(`${allow} approved`);
      if (review > 0) parts.push(`${review} for review`);
      if (block > 0) parts.push(`${block} blocked`);
      return `Risk assessment complete • ${parts.join(" • ") || "All candidates scored"}`;
    }
    return "Risk scoring completed for all candidates.";
  }

  if (agentType === "execution") {
    const submitted = detail.candidates_submitted ?? detail.total_executed;
    const success = detail.successful ?? detail.success_count;
    if (typeof submitted === "number") {
      const parts = [`Executed ${submitted} transaction${submitted !== 1 ? "s" : ""}`];
      if (typeof success === "number" && submitted > 0) {
        const rate = Math.round((success / submitted) * 100);
        parts.push(`${rate}% success rate`);
      }
      return parts.join(" • ");
    }
    return "Payout execution completed.";
  }

  if (agentType === "audit" && action === "final_report") {
    return "Generated compliance and audit report for this run.";
  }

  // Fallback: extract key metrics without raw JSON
  const skipKeys = ["plan_steps", "data_integrity", "raw_response", "data_integrity_hash", "generated_at"];
  const pairs = Object.entries(detail).filter(([key]) => !skipKeys.includes(key));

  if (pairs.length === 0) return "Recorded by FlowPilot.";

  // For remaining cases, extract meaningful values
  return pairs
    .slice(0, 3)
    .map(([key, value]) => {
      const label = key.replaceAll("_", " ");
      if (typeof value === "number") return `${label}: ${value.toLocaleString()}`;
      if (typeof value === "boolean") return `${label}: ${value ? "Yes" : "No"}`;
      if (typeof value === "string" && value.length < 50) return `${label}: ${value}`;
      if (Array.isArray(value)) return `${label}: ${value.length} item${value.length !== 1 ? "s" : ""}`;
      if (typeof value === "object" && value !== null) {
        const keys = Object.keys(value);
        return `${label}: ${keys.length} field${keys.length !== 1 ? "s" : ""}`;
      }
      return null;
    })
    .filter(Boolean)
    .join(" · ") || "Recorded by FlowPilot.";
}

function toBadgeStatus(status: string): BadgeStatus {
  if (["reconciling", "scoring", "forecasting"].includes(status)) return "running";
  if (status === "cancelled") return "failed";
  return status as BadgeStatus;
}

function transactionStatus(status: string): "pending" | "completed" | "failed" {
  if (status === "FAILED") return "failed";
  if (status === "PENDING") return "pending";
  return "completed";
}

const RISK_BORDER_COLORS: Record<string, string> = {
  allow: "border-emerald-300 dark:border-emerald-800",
  review: "border-amber-300 dark:border-amber-800",
  block: "border-red-300 dark:border-red-800",
};

const TABS = [
  { key: "activity", label: "Progress" },
  { key: "transactions", label: "Transactions" },
  { key: "candidates", label: "Candidates" },
  { key: "audit", label: "Review Notes" },
];

export default function RunDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("activity");

  const { data: run, isLoading: loadingRun, isError: runError } = useRun(id);
  const { data: transactionsResponse, isLoading: loadingTransactions, isError: transactionsError } =
    useTransactions({ run_id: id });
  const { data: candidates = [], isLoading: loadingCandidates } = useCandidates(id);
  const { data: auditReport, isLoading: loadingReport, isError: reportError } =
    useRunReport(id, activeTab === "audit");

  // Real-time pipeline data (live for active runs, replay for completed/failed)
  const isLiveRun = LIVE_RUN_STATUSES.has(run?.status ?? "");
  const hasStarted = !!run && run.status !== "pending";
  const { data: steps = [], isLoading: loadingSteps } = useRunSteps(id, run?.status);
  const { events, isLive } = useRunEvents(id, hasStarted);
  const invalidate = useInvalidateRunQueries(id);

  // Invalidate queries when SSE events indicate state changes
  useEffect(() => {
    if (events.length === 0) return;
    const latest = events[events.length - 1];
    invalidate(latest);
  }, [events.length, events, invalidate]);

  if (loadingRun) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (runError || !run) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-destructive">Failed to load run. Please go back and try again.</p>
      </div>
    );
  }

  const status = toBadgeStatus(run.status);
  const statusLabel = run.status === "completed_with_errors" ? "Completed With Errors" : humanize(run.status);
  const transactions = transactionsResponse?.transactions ?? [];
  const summary: TransactionSummary = transactionsResponse?.summary ?? {
    total_transactions: 0,
    total_volume: 0,
    anomaly_count: 0,
    failed_count: 0,
  };
  const auditReportData = asRecord(auditReport?.report);
  const executiveSummary = asString(auditReportData?.executive_summary);
  const riskSummary = asRecord(auditReportData?.risk_summary);
  const executionSummary = asRecord(auditReportData?.execution_summary);
  const approvalSummary = asRecord(auditReportData?.approval_summary);
  const totalCandidateAmount = candidates.reduce(
    (sum, candidate) => sum + (candidate.amount ?? 0),
    0,
  );
  const flaggedCandidates = candidates.filter((candidate) => candidate.decision !== "allow").length;
  const createdAtLabel = formatDateTime(run.startedAt);
  const startedRelative = formatRelative(run.startedAt);
  const failureMessage = cleanFailureMessage(run.error);
  const failureTitle = failureHeadline(failureMessage);
  const failureNextActions = failureActions(failureMessage);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/dashboard/runs"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Runs
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black tracking-tight text-foreground">
              Run <span className="font-mono text-muted-foreground">{truncateRunId(id)}</span>
            </h1>
            <StatusBadge status={status} label={statusLabel} />
            {isLiveRun && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                <Radio className="h-3 w-3 animate-pulse" />
                Live
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground line-clamp-1 max-w-xl">{run.objective}</p>
        </div>
        <p className="text-sm text-muted-foreground self-end">
          {startedRelative === "—" ? "Start time unavailable" : `Started ${startedRelative}`}
        </p>
      </div>

      {/* Approval banner */}
      {run.status === "awaiting_approval" && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 dark:border-amber-900 dark:bg-amber-950/30">
          <div className="flex items-center gap-2 text-sm font-medium text-amber-800 dark:text-amber-300">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            Agents completed pre-execution analysis. Approval is required before payouts can execute.
          </div>
          <Button
            className="rounded-full bg-amber-500 px-6 text-white hover:bg-amber-600"
            onClick={() => router.push(`/dashboard/runs/${id}/approve`)}
          >
            Review &amp; Approve
          </Button>
        </div>
      )}

      <div className="rounded-2xl border border-border bg-card px-5 py-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-xl bg-brand/10 text-brand">
            <Info className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">Run Summary</p>
            <p className="text-sm text-muted-foreground">{summarizeRunStage(run.status)}</p>
          </div>
        </div>
      </div>

      {run.status === "failed" && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-xl bg-red-100 text-red-600">
              <AlertTriangle className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-red-900">{failureTitle}</p>
              <p className="mt-1 text-sm text-red-800">
                {failureMessage ?? "The run stopped during execution. Review the suggested next steps below."}
              </p>
              <div className="mt-3 space-y-1.5">
                {failureNextActions.map((action) => (
                  <p key={action} className="text-xs text-red-700">
                    {action}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Metric cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Recipients"
          value={String(run.candidates)}
          subtext="Included in this run"
          icon={<Zap className="h-4 w-4" />}
          accent="brand"
        />
        <MetricCard
          label="Payout Volume"
          value={formatCurrency(totalCandidateAmount)}
          subtext="Planned disbursement"
          icon={<TrendingUp className="h-4 w-4" />}
          accent="green"
        />
        <MetricCard
          label="Needs Review"
          value={String(flaggedCandidates)}
          subtext="Recipients flagged by checks"
          icon={<FileSearch className="h-4 w-4" />}
          accent="amber"
        />
        <MetricCard
          label="Payments Sent"
          value={String(summary.total_transactions)}
          subtext="Completed transactions"
          icon={<ShieldAlert className="h-4 w-4" />}
          accent="red"
        />
      </div>

      {/* Run info strip */}
      <div className="rounded-2xl border border-border bg-card px-6 py-5">
        <p className="text-xs font-black uppercase tracking-wider text-muted-foreground mb-4">Run Details</p>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <Detail label="Run ID" value={<span className="font-mono text-xs">{id}</span>} />
          <Detail label="Status" value={<StatusBadge status={status} label={statusLabel} />} />
          <Detail label="Total Volume" value={formatCurrency(totalCandidateAmount || summary.total_volume)} />
          <Detail label="Created" value={createdAtLabel} />
        </div>
      </div>

      {/* Tabbed section */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="flex border-b border-border px-6 pt-4 gap-1">
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key)}
              className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors ${activeTab === key
                  ? "bg-background text-foreground border border-b-transparent border-border -mb-px"
                  : "text-muted-foreground hover:text-foreground"
                }`}
            >
              {label}
              {key === "activity" && isLive && (
                <span className="ml-2 inline-block h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
              )}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* Agent Activity */}
          {activeTab === "activity" && (
            <div className="grid gap-6 lg:grid-cols-2">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <p className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                    Pipeline Steps
                  </p>
                  {!isLiveRun && events.length > 0 && (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                      Replay
                    </span>
                  )}
                </div>
                {loadingSteps ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <AgentTimeline steps={steps} />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <p className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                    Technical Event Log
                  </p>
                  {events.length > 0 && (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                      {events.length} events
                    </span>
                  )}
                </div>
                <p className="mb-3 text-xs text-muted-foreground">
                  Internal system activity for debugging and support. Most operators only need the summary, candidates, and approval action.
                </p>
                <AgentThinking events={events} className="max-h-[500px]" />
              </div>
            </div>
          )}

          {/* Transactions */}
          {activeTab === "transactions" && (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    {["Reference", "Status", "Amount", "Channel", "Counterparty", "Date"].map((h) => (
                      <th key={h} className="pb-3 pr-6 text-xs font-black uppercase tracking-wider text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loadingTransactions ? (
                    <tr><td colSpan={6} className="py-12 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" /></td></tr>
                  ) : transactionsError ? (
                    <tr><td colSpan={6} className="py-10 text-center text-sm text-destructive">Failed to load transactions.</td></tr>
                  ) : transactions.length === 0 ? (
                    <tr><td colSpan={6} className="py-10 text-center text-sm text-muted-foreground">No transactions found for this run.</td></tr>
                  ) : (
                    transactions.map((tx) => (
                      <tr key={tx.id} className="border-b border-border last:border-0">
                        <td className="py-3 pr-6 font-mono text-xs text-foreground">{tx.reference}</td>
                        <td className="py-3 pr-6"><StatusBadge status={transactionStatus(tx.status)} label={tx.status} /></td>
                        <td className="py-3 pr-6 font-semibold text-foreground">{formatCurrency(tx.amount)}</td>
                        <td className="py-3 pr-6 text-muted-foreground">{tx.channel || "—"}</td>
                        <td className="py-3 pr-6 text-muted-foreground">{tx.counterparty_name || "—"}</td>
                        <td className="py-3 text-muted-foreground">{tx.date ? formatDateTime(tx.date) : "—"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Candidates (enhanced B8) */}
          {activeTab === "candidates" && (
            <div className="grid gap-4 lg:grid-cols-2">
              {loadingCandidates ? (
                <div className="col-span-2 flex justify-center py-10">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : candidates.length === 0 ? (
                <p className="col-span-2 py-10 text-center text-sm text-muted-foreground">
                  No payout candidates have been attached to this run.
                </p>
              ) : (
                candidates.map((candidate) => {
                  const borderColor = RISK_BORDER_COLORS[candidate.decision] ?? "border-border";
                  return (
                    <CandidateCard key={candidate.id} candidate={candidate} borderColor={borderColor} />
                  );
                })
              )}
            </div>
          )}

          {/* Audit */}
          {activeTab === "audit" && (
            <div>
              {loadingReport ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : reportError ? (
                <p className="py-10 text-center text-sm text-destructive">Failed to load audit report.</p>
              ) : !auditReport ? (
                <p className="py-10 text-center text-sm text-muted-foreground">
                  Audit report has not been generated for this run yet.
                </p>
              ) : (
                <div className="space-y-6">
                  {/* Hero Executive Summary Card */}
                  {executiveSummary && (
                    <div className="rounded-xl border-2 border-brand/20 bg-gradient-to-br from-brand/5 to-transparent p-6">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand/10">
                          <FileText className="h-5 w-5 text-brand" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-black uppercase tracking-wider text-brand mb-2">Executive Summary</p>
                          <p className="whitespace-pre-line text-sm leading-relaxed text-foreground">{executiveSummary}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Compliance Status Badge - only show if we have data */}
                  {auditReportData && (
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "flex items-center gap-2 rounded-full px-4 py-2",
                        run.status === "completed" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                      )}>
                        {run.status === "completed" ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <AlertTriangle className="h-4 w-4" />
                        )}
                        <span className="text-sm font-semibold">
                          {run.status === "completed" ? "Audit Complete" : "Requires Attention"}
                        </span>
                      </div>
                      {typeof riskSummary?.total === "number" && riskSummary.total > 0 && (
                        <span className="text-sm text-muted-foreground">
                          {riskSummary.total} candidate{riskSummary.total !== 1 ? "s" : ""} processed
                        </span>
                      )}
                    </div>
                  )}

                  {run.status === "failed" && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
                      <p className="text-xs font-black uppercase tracking-wider text-amber-700 mb-2">Why This Run Failed</p>
                      <p className="text-sm leading-relaxed text-amber-900">
                        {failureMessage ?? "FlowPilot marked this run as failed, but no detailed error message was captured."}
                      </p>
                    </div>
                  )}

                  {auditReportData && (
                    <div className="grid gap-4 sm:grid-cols-3">
                      {riskSummary && (
                        <div className="rounded-xl border border-border bg-background p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                            <p className="text-xs font-black uppercase tracking-wider text-muted-foreground">Risk Summary</p>
                          </div>
                          <div className="space-y-2 text-sm">
                            <Row label="Total scored" value={String(riskSummary.total ?? "—")} />
                            <Row label="Avg risk" value={asNumber(riskSummary.average_risk_score)?.toFixed(2) ?? "—"} />
                            <Row label="Total amount" value={formatOptionalCurrency(riskSummary.total_amount)} />
                          </div>
                        </div>
                      )}
                      {executionSummary && (
                        <div className="rounded-xl border border-border bg-background p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <Zap className="h-4 w-4 text-muted-foreground" />
                            <p className="text-xs font-black uppercase tracking-wider text-muted-foreground">Execution</p>
                          </div>
                          <div className="space-y-2 text-sm">
                            <Row label="Lookups" value={String(executionSummary.lookups_performed ?? "—")} />
                            <Row label="Submitted" value={String(executionSummary.candidates_submitted ?? "—")} />
                          </div>
                        </div>
                      )}
                      {approvalSummary && (
                        <div className="rounded-xl border border-border bg-background p-4">
                          <div className="flex items-center gap-2 mb-3">
                            <CheckCircle className="h-4 w-4 text-muted-foreground" />
                            <p className="text-xs font-black uppercase tracking-wider text-muted-foreground">Approvals</p>
                          </div>
                          <div className="space-y-2 text-sm">
                            <Row label="Approved" value={String(approvalSummary.approved ?? "—")} valueClass="text-emerald-600" />
                            <Row label="Rejected" value={String(approvalSummary.rejected ?? "—")} valueClass="text-destructive" />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {(auditReport.audit_trail ?? auditReport.entries ?? []).length > 0 && (
                    <div>
                      <p className="text-xs font-black uppercase tracking-wider text-muted-foreground mb-3">Key Run Notes</p>
                      <div className="space-y-2">
                        {(auditReport.audit_trail ?? auditReport.entries ?? []).slice(0, 6).map((entry: AuditEntry) => (
                          <div key={entry.id} className="flex items-start gap-3 rounded-xl border border-border bg-background px-4 py-3">
                            <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand" />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-semibold text-foreground">{entry.action.replaceAll("_", " ")}</span>
                                {entry.agent_type && (
                                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                                    {entry.agent_type}
                                  </span>
                                )}
                              </div>
                              <p className="mt-0.5 text-xs text-muted-foreground">
                                {summarizeAuditTrailEntry(entry)}
                              </p>
                              <p className="mt-1 text-[10px] text-muted-foreground/60">{formatDateTime(entry.created_at)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Candidate Card (B8) ────────────────────────────────────── */

function CandidateCard({
  candidate,
  borderColor,
}: {
  candidate: {
    id: string;
    beneficiaryName: string;
    institution: string;
    accountNumber: string;
    amount: number;
    purpose: string;
    riskScore: number;
    riskReasons: string[];
    decision: string;
    lookupStatus: string;
    similarity: number;
    nameOnFile: string;
    returnedName: string;
  };
  borderColor: string;
}) {
  const [showReasons, setShowReasons] = useState(false);

  return (
    <div className={cn("rounded-xl border-2 bg-background p-4", borderColor)}>
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <p className="font-semibold text-foreground">{candidate.beneficiaryName}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {candidate.institution} · {candidate.accountNumber.slice(0, 3)}***{candidate.accountNumber.slice(-3)}
          </p>
        </div>
        <StatusBadge status={candidate.decision as "allow" | "review" | "block"} />
      </div>

      <div className="flex gap-4 text-xs text-muted-foreground flex-wrap">
        <span>Amount: <span className="font-semibold text-foreground">{formatCurrency(candidate.amount)}</span></span>
        <span>Risk: <span className="font-semibold text-foreground">{candidate.riskScore === null ? "—" : candidate.riskScore.toFixed(2)}</span></span>
        <span>Purpose: <span className="text-foreground">{candidate.purpose || "—"}</span></span>
      </div>

      {/* Lookup info */}
      {candidate.lookupStatus === "verified" && candidate.returnedName && (
        <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
          <span className="rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
            Verified
          </span>
          <span>{candidate.returnedName}</span>
          {candidate.similarity > 0 && candidate.similarity < 100 && (
            <span className="text-muted-foreground/60">({candidate.similarity}% match)</span>
          )}
        </div>
      )}

      {/* Risk reasons */}
      {candidate.riskReasons.length > 0 && (
        <div className="mt-2">
          <button
            type="button"
            onClick={() => setShowReasons(!showReasons)}
            className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronDown
              className={cn(
                "h-3 w-3 transition-transform",
                showReasons && "rotate-180",
              )}
            />
            {candidate.riskReasons.length} risk reason{candidate.riskReasons.length !== 1 ? "s" : ""}
          </button>
          {showReasons && (
            <ul className="mt-1.5 space-y-1 pl-4">
              {candidate.riskReasons.map((reason, i) => (
                <li key={i} className="text-xs text-muted-foreground list-disc">
                  {reason}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Shared sub-components ──────────────────────────────────── */

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-black uppercase tracking-wider text-muted-foreground/60">{label}</p>
      <div className="text-sm text-foreground">{value}</div>
    </div>
  );
}

function Row({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-semibold text-foreground ${valueClass ?? ""}`}>{value}</span>
    </div>
  );
}
