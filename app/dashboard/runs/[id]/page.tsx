"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AlertTriangle, ArrowLeft, Loader2 } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes === 1 ? "" : "s"} ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
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
  if (status === "reconciling" || status === "scoring" || status === "forecasting") return "running";
  if (status === "cancelled") return "failed";
  if (status === "completed_with_errors") return "completed_with_errors";
  return status as BadgeStatus;
}

function transactionStatus(status: string): "pending" | "completed" | "failed" {
  if (status === "FAILED") return "failed";
  if (status === "PENDING") return "pending";
  return "completed";
}

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

  function handleTabChange(nextTab: string): void {
    setActiveTab(nextTab);
  }

  if (loadingRun) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (runError || !run) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-red-600">Failed to load run. Please go back and try again.</p>
      </div>
    );
  }

  const status = toBadgeStatus(run.status);
  const statusLabel =
    run.status === "completed_with_errors" ? "Completed With Errors" : humanize(run.status);
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
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/dashboard/runs" className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900">
            <ArrowLeft className="h-4 w-4" />
            Runs / Run {truncateRunId(id)}
          </Link>
          <h1 className="mt-1 text-2xl font-semibold text-slate-900">Run Details</h1>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={status} label={statusLabel} />
          <span className="text-sm text-slate-500">Started {formatRelative(run.startedAt)}</span>
        </div>
      </div>

      {run.status === "awaiting_approval" && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3">
          <div className="flex items-start gap-2 text-sm text-amber-900">
            <AlertTriangle className="mt-0.5 h-4 w-4" />
            Agents completed pre-execution analysis. Approval is required before payouts can execute.
          </div>
          <Button className="rounded-xl bg-amber-500 text-white hover:bg-amber-600" onClick={() => router.push(`/dashboard/runs/${id}/approve`)}>
            Review and Approve
          </Button>
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="space-y-4">
          <Card className="rounded-xl border-slate-200 bg-white">
            <CardHeader><CardTitle className="text-base">Run Details</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <KeyValue label="Objective" value={run.objective} />
              <KeyValue label="Candidates" value={String(run.candidates)} />
              <KeyValue label="Transactions" value={String(summary.total_transactions)} />
              <KeyValue label="Created" value={run.startedAt} />
              <KeyValue label="Status" value={<StatusBadge status={status} label={statusLabel} />} />
            </CardContent>
          </Card>

          <Card className="rounded-xl border-slate-200 bg-white">
            <CardHeader><CardTitle className="text-base">Transaction Summary</CardTitle></CardHeader>
            <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
              <MiniStat label="Total Transactions" value={String(summary.total_transactions)} />
              <MiniStat label="Total Volume" value={formatCurrency(summary.total_volume)} />
              <MiniStat label="Anomalies" value={String(summary.anomaly_count)} />
              <MiniStat label="Failed" value={String(summary.failed_count)} />
            </CardContent>
          </Card>
        </div>

        <div className="xl:col-span-2">
          <Card className="rounded-xl border-slate-200 bg-white">
            <CardHeader><CardTitle className="text-base">Execution Plan</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-slate-500">No execution plan has been recorded for this run yet.</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="rounded-xl border-slate-200 bg-white">
        <CardContent className="py-4">
          <div className="mb-4 flex flex-wrap gap-2">
            {[
              ["transactions", "Transactions"],
              ["candidates", "Candidates"],
              ["audit", "Audit Report"],
            ].map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => handleTabChange(key)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium ${activeTab === key ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-700"}`}
              >
                {label}
              </button>
            ))}
          </div>

          {activeTab === "transactions" && (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-500">
                    <th className="pb-2 font-medium">Reference</th>
                    <th className="pb-2 font-medium">Status</th>
                    <th className="pb-2 font-medium">Amount</th>
                    <th className="pb-2 font-medium">Channel</th>
                    <th className="pb-2 font-medium">Counterparty</th>
                    <th className="pb-2 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingTransactions ? (
                    <tr>
                      <td colSpan={6} className="py-10 text-center">
                        <Loader2 className="mx-auto h-5 w-5 animate-spin text-slate-400" />
                      </td>
                    </tr>
                  ) : transactionsError ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-red-600">Failed to load transactions.</td>
                    </tr>
                  ) : transactions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500">No transactions found for this run.</td>
                    </tr>
                  ) : (
                    transactions.map((transaction) => (
                      <tr key={transaction.id} className="border-b border-slate-100 text-slate-700 last:border-0">
                        <td className="py-3 font-mono text-xs">{transaction.reference}</td>
                        <td className="py-3">
                          <StatusBadge status={transactionStatus(transaction.status)} label={transaction.status} />
                        </td>
                        <td className="py-3">{formatCurrency(transaction.amount)}</td>
                        <td className="py-3">{transaction.channel || "—"}</td>
                        <td className="py-3">{transaction.counterparty_name || "—"}</td>
                        <td className="py-3">{transaction.date ? formatDateTime(transaction.date) : "—"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "candidates" && (
            <div className="grid gap-3 lg:grid-cols-2">
              {loadingCandidates ? (
                <div className="col-span-2 flex justify-center py-10">
                  <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                </div>
              ) : candidates.length === 0 ? (
                <p className="col-span-2 text-sm text-slate-500">No payout candidates have been attached to this run.</p>
              ) : (
                candidates.map((candidate) => (
                  <div key={candidate.id} className="rounded-xl border border-slate-200 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="font-semibold text-slate-900">{candidate.beneficiaryName}</p>
                        <p className="text-xs text-slate-500">{candidate.institution} · {candidate.accountNumber.slice(0, 3)}***{candidate.accountNumber.slice(-3)}</p>
                      </div>
                      <StatusBadge status={candidate.decision as "allow" | "review" | "block"} />
                    </div>
                    <div className="mt-3 space-y-1 text-sm text-slate-600">
                      <p>Amount: {formatCurrency(candidate.amount)}</p>
                      <p>Purpose: {candidate.purpose || "—"}</p>
                      <p>Risk Score: {candidate.riskScore === null ? "Pending" : candidate.riskScore.toFixed(2)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "audit" && (
            <div>
              {loadingReport ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                </div>
              ) : reportError ? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                  Failed to load audit report.
                </div>
              ) : !auditReport ? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                  Audit report has not been generated for this run yet.
                </div>
              ) : (
                <div className="space-y-5">
                  {executiveSummary && (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                      <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-emerald-800">Executive Summary</h3>
                      <p className="whitespace-pre-line text-sm leading-relaxed text-emerald-900">{executiveSummary}</p>
                    </div>
                  )}

                  {auditReportData && (
                    <div className="grid gap-3 sm:grid-cols-3">
                      {riskSummary && (
                        <div className="rounded-xl border border-slate-200 bg-white p-4">
                          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Risk Summary</h4>
                          <div className="space-y-1 text-sm text-slate-700">
                            <p>Total scored: <span className="font-medium">{String(riskSummary.total ?? "—")}</span></p>
                            <p>Avg risk: <span className="font-medium">{asNumber(riskSummary.average_risk_score)?.toFixed(2) ?? "—"}</span></p>
                            <p>Total amount: <span className="font-medium">{formatOptionalCurrency(riskSummary.total_amount)}</span></p>
                          </div>
                        </div>
                      )}
                      {executionSummary && (
                        <div className="rounded-xl border border-slate-200 bg-white p-4">
                          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Execution Summary</h4>
                          <div className="space-y-1 text-sm text-slate-700">
                            <p>Lookups: <span className="font-medium">{String(executionSummary.lookups_performed ?? "—")}</span></p>
                            <p>Submitted: <span className="font-medium">{String(executionSummary.candidates_submitted ?? "—")}</span></p>
                          </div>
                        </div>
                      )}
                      {approvalSummary && (
                        <div className="rounded-xl border border-slate-200 bg-white p-4">
                          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Approval Summary</h4>
                          <div className="space-y-1 text-sm text-slate-700">
                            <p>Approved: <span className="font-medium text-emerald-700">{String(approvalSummary.approved ?? "—")}</span></p>
                            <p>Rejected: <span className="font-medium text-red-600">{String(approvalSummary.rejected ?? "—")}</span></p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {(auditReport.audit_trail ?? auditReport.entries ?? []).length > 0 && (
                    <div>
                      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">Agent Activity Trail</h3>
                      <div className="space-y-2">
                        {(auditReport.audit_trail ?? auditReport.entries ?? []).map((entry: AuditEntry) => (
                          <div key={entry.id} className="flex items-start gap-3 rounded-lg border border-slate-200 px-3 py-2">
                            <div className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-amber-500" />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-slate-900">{entry.action.replaceAll("_", " ")}</span>
                                {entry.agent_type && (
                                  <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500">{entry.agent_type}</span>
                                )}
                              </div>
                              {entry.detail && (
                                <p className="mt-0.5 text-xs text-slate-500">
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
                              <p className="mt-0.5 text-xs text-slate-400">{formatDateTime(entry.created_at)}</p>
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
        </CardContent>
      </Card>
    </div>
  );
}

function KeyValue({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <div className="text-sm text-slate-900">{value}</div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-slate-900">{value}</p>
    </div>
  );
}
