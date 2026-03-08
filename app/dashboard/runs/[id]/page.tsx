"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  FileSearch,
  Loader2,
  ShieldAlert,
  TrendingUp,
  Zap,
} from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { MetricCard } from "@/components/dashboard/MetricCard";
import type { AuditEntry, TransactionSummary } from "@/lib/api-types";
import { useRun, useRunReport } from "@/hooks/use-run-queries";
import { useTransactions } from "@/hooks/use-transaction-queries";
import { useCandidates } from "@/hooks/use-candidate-queries";

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
  return new Date(value).toLocaleString("en-NG", {
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

const TABS = [
  { key: "transactions", label: "Transactions" },
  { key: "candidates", label: "Candidates" },
  { key: "audit", label: "Audit Report" },
];

export default function RunDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("transactions");

  const { data: run, isLoading: loadingRun, isError: runError } = useRun(id);
  const { data: transactionsResponse, isLoading: loadingTransactions, isError: transactionsError } =
    useTransactions({ run_id: id });
  const { data: candidates = [], isLoading: loadingCandidates } = useCandidates(id);
  const { data: auditReport, isLoading: loadingReport, isError: reportError } =
    useRunReport(id, activeTab === "audit");

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
          </div>
          <p className="mt-1 text-sm text-muted-foreground line-clamp-1 max-w-xl">{run.objective}</p>
        </div>
        <p className="text-sm text-muted-foreground self-end">Started {formatRelative(run.startedAt)}</p>
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

      {/* Metric cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Candidates"
          value={String(run.candidates)}
          subtext="Payout recipients"
          icon={<Zap className="h-4 w-4" />}
          accent="brand"
        />
        <MetricCard
          label="Transactions"
          value={String(summary.total_transactions)}
          subtext="Reconciled"
          icon={<TrendingUp className="h-4 w-4" />}
          accent="green"
        />
        <MetricCard
          label="Anomalies"
          value={String(summary.anomaly_count)}
          subtext="Flagged"
          icon={<FileSearch className="h-4 w-4" />}
          accent="amber"
        />
        <MetricCard
          label="Failed"
          value={String(summary.failed_count)}
          subtext="Transactions"
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
          <Detail label="Total Volume" value={formatCurrency(summary.total_volume)} />
          <Detail label="Created" value={formatDateTime(run.startedAt)} />
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
              className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors ${
                activeTab === key
                  ? "bg-background text-foreground border border-b-transparent border-border -mb-px"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="p-6">
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

          {/* Candidates */}
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
                candidates.map((candidate) => (
                  <div key={candidate.id} className="rounded-xl border border-border bg-background p-4">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <p className="font-semibold text-foreground">{candidate.beneficiaryName}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {candidate.institution} · {candidate.accountNumber.slice(0, 3)}***{candidate.accountNumber.slice(-3)}
                        </p>
                      </div>
                      <StatusBadge status={candidate.decision as "allow" | "review" | "block"} />
                    </div>
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      <span>Amount: <span className="font-semibold text-foreground">{formatCurrency(candidate.amount)}</span></span>
                      <span>Risk: <span className="font-semibold text-foreground">{candidate.riskScore === null ? "—" : candidate.riskScore.toFixed(2)}</span></span>
                      <span>Purpose: <span className="text-foreground">{candidate.purpose || "—"}</span></span>
                    </div>
                  </div>
                ))
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
                  {executiveSummary && (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-900 dark:bg-emerald-950/30">
                      <p className="text-xs font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400 mb-2">Executive Summary</p>
                      <p className="whitespace-pre-line text-sm leading-relaxed text-emerald-900 dark:text-emerald-300">{executiveSummary}</p>
                    </div>
                  )}

                  {auditReportData && (
                    <div className="grid gap-4 sm:grid-cols-3">
                      {riskSummary && (
                        <div className="rounded-xl border border-border bg-background p-4">
                          <p className="text-xs font-black uppercase tracking-wider text-muted-foreground mb-3">Risk Summary</p>
                          <div className="space-y-2 text-sm">
                            <Row label="Total scored" value={String(riskSummary.total ?? "—")} />
                            <Row label="Avg risk" value={asNumber(riskSummary.average_risk_score)?.toFixed(2) ?? "—"} />
                            <Row label="Total amount" value={formatOptionalCurrency(riskSummary.total_amount)} />
                          </div>
                        </div>
                      )}
                      {executionSummary && (
                        <div className="rounded-xl border border-border bg-background p-4">
                          <p className="text-xs font-black uppercase tracking-wider text-muted-foreground mb-3">Execution</p>
                          <div className="space-y-2 text-sm">
                            <Row label="Lookups" value={String(executionSummary.lookups_performed ?? "—")} />
                            <Row label="Submitted" value={String(executionSummary.candidates_submitted ?? "—")} />
                          </div>
                        </div>
                      )}
                      {approvalSummary && (
                        <div className="rounded-xl border border-border bg-background p-4">
                          <p className="text-xs font-black uppercase tracking-wider text-muted-foreground mb-3">Approvals</p>
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
                      <p className="text-xs font-black uppercase tracking-wider text-muted-foreground mb-3">Agent Activity Trail</p>
                      <div className="space-y-2">
                        {(auditReport.audit_trail ?? auditReport.entries ?? []).map((entry: AuditEntry) => (
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
                              {entry.detail && (
                                <p className="mt-0.5 text-xs text-muted-foreground">
                                  {typeof entry.detail === "object"
                                    ? Object.entries(entry.detail)
                                        .filter(([k]) => !["plan_steps", "data_integrity", "raw_response"].includes(k))
                                        .map(([k, v]) =>
                                          typeof v === "object"
                                            ? `${k.replaceAll("_", " ")}: ${JSON.stringify(v)}`
                                            : `${k.replaceAll("_", " ")}: ${v}`
                                        )
                                        .join(" · ")
                                    : String(entry.detail)}
                                </p>
                              )}
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
