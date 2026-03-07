"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AlertTriangle, ArrowLeft, Loader2 } from "lucide-react";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getRun, listTransactions, getRunReport } from "@/lib/api-client";
import type {
  ApiRunRecord,
  AuditEntry,
  AuditReport,
  Candidate,
  TransactionSummary,
  TransactionsResponse,
} from "@/lib/api-types";

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
  if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes === 1 ? "" : "s"} ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
}

function maskAccount(accountNumber: string): string {
  if (accountNumber.length <= 4) return accountNumber;
  return `${accountNumber.slice(0, 3)}***${accountNumber.slice(-3)}`;
}

function humanize(value: string | null | undefined): string {
  if (!value) return "—";
  return value.replaceAll("_", " ");
}

function toBadgeStatus(status: string): BadgeStatus {
  if (status === "reconciling" || status === "scoring" || status === "forecasting") {
    return "running";
  }
  if (status === "cancelled") {
    return "failed";
  }
  if (status === "completed_with_errors") {
    return "completed_with_errors";
  }
  return status as BadgeStatus;
}

function transactionStatus(status: string): "pending" | "completed" | "failed" {
  if (status === "FAILED") return "failed";
  if (status === "PENDING") return "pending";
  return "completed";
}

function approvalLabel(candidate: Candidate): string {
  if (candidate.approval_status === "approved") return "Approved";
  if (candidate.approval_status === "rejected") return "Rejected";
  return "Pending";
}

function approvalClass(candidate: Candidate): string {
  if (candidate.approval_status === "approved") {
    return "border-emerald-300 bg-emerald-50 text-emerald-700";
  }
  if (candidate.approval_status === "rejected") {
    return "border-red-300 bg-red-50 text-red-700";
  }
  return "border-slate-300 bg-slate-50 text-slate-700";
}

export default function RunDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("transactions");
  const [run, setRun] = useState<ApiRunRecord | null>(null);
  const [transactionsResponse, setTransactionsResponse] =
    useState<TransactionsResponse | null>(null);
  const [auditReport, setAuditReport] = useState<AuditReport | null>(null);
  const [loadingRun, setLoadingRun] = useState(true);
  const [loadingTransactions, setLoadingTransactions] = useState(true);
  const [loadingReport, setLoadingReport] = useState(false);
  const [runError, setRunError] = useState<string | null>(null);
  const [transactionsError, setTransactionsError] = useState<string | null>(null);
  const [reportError, setReportError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    getRun(id)
      .then((response) => {
        if (!cancelled) {
          setRun(response);
        }
      })
      .catch((error: Error) => {
        if (!cancelled) {
          setRunError(error.message || "Failed to load run.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingRun(false);
        }
      });

    listTransactions({ run_id: id })
      .then((response) => {
        if (!cancelled) {
          setTransactionsResponse(response);
        }
      })
      .catch((error: Error) => {
        if (!cancelled) {
          setTransactionsError(error.message || "Failed to load transactions.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingTransactions(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  // Fetch audit report when the tab is activated (fetch-once pattern)
  const reportFetchedRef = useRef(false);
  useEffect(() => {
    if (activeTab !== "audit" || reportFetchedRef.current) return;
    reportFetchedRef.current = true;
    setLoadingReport(true);
    getRunReport(id)
      .then((data) => setAuditReport(data))
      .catch((err: Error) => setReportError(err.message || "Failed to load report."))
      .finally(() => setLoadingReport(false));
  }, [activeTab, id]);

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
        <p className="text-sm text-red-600">{runError ?? "Run not found."}</p>
      </div>
    );
  }

  const status = toBadgeStatus(run.status);
  const statusLabel =
    run.status === "completed_with_errors"
      ? "Completed With Errors"
      : humanize(run.status);
  const transactions = transactionsResponse?.transactions ?? [];
  const summary: TransactionSummary = transactionsResponse?.summary ?? {
    total_transactions: 0,
    total_volume: 0,
    anomaly_count: 0,
    failed_count: 0,
  };
  const candidates = run.candidates ?? [];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            href="/dashboard/runs"
            className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Runs / Run {truncateRunId(id)}
          </Link>
          <h1 className="mt-1 text-2xl font-semibold text-slate-900">
            Run Details
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={status} label={statusLabel} />
          <span className="text-sm text-slate-500">
            Started {formatRelative(run.created_at)}
          </span>
        </div>
      </div>

      {run.error && (
        <div className="flex items-start gap-2 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
          <AlertTriangle className="mt-0.5 h-4 w-4" />
          <div>
            <p className="font-medium">Run error</p>
            <p>{run.error}</p>
          </div>
        </div>
      )}

      {run.status === "awaiting_approval" && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3">
          <div className="flex items-start gap-2 text-sm text-amber-900">
            <AlertTriangle className="mt-0.5 h-4 w-4" />
            Agents completed pre-execution analysis. Approval is required before
            payouts can execute.
          </div>
          <Button
            className="rounded-xl bg-amber-500 text-white hover:bg-amber-600"
            onClick={() => router.push(`/dashboard/runs/${id}/approve`)}
          >
            Review and Approve
          </Button>
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="space-y-4">
          <Card className="rounded-xl border-slate-200 bg-white">
            <CardHeader>
              <CardTitle className="text-base">Run Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <KeyValue label="Objective" value={run.objective} />
              <KeyValue label="Current Step" value={humanize(run.current_step)} />
              <KeyValue
                label="Candidates"
                value={String(run.candidate_count ?? candidates.length)}
              />
              <KeyValue
                label="Transactions"
                value={String(summary.total_transactions)}
              />
              <KeyValue label="Created" value={formatDateTime(run.created_at)} />
              <KeyValue
                label="Status"
                value={<StatusBadge status={status} label={statusLabel} />}
              />
            </CardContent>
          </Card>

          <Card className="rounded-xl border-slate-200 bg-white">
            <CardHeader>
              <CardTitle className="text-base">Transaction Summary</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
              <MiniStat
                label="Total Transactions"
                value={String(summary.total_transactions)}
              />
              <MiniStat
                label="Total Volume"
                value={formatCurrency(summary.total_volume)}
              />
              <MiniStat
                label="Anomalies"
                value={String(summary.anomaly_count)}
              />
              <MiniStat
                label="Failed Transactions"
                value={String(summary.failed_count)}
              />
            </CardContent>
          </Card>
        </div>

        <div className="xl:col-span-2">
          <Card className="rounded-xl border-slate-200 bg-white">
            <CardHeader>
              <CardTitle className="text-base">Execution Plan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {run.plan_steps?.length ? (
                run.plan_steps
                  .slice()
                  .sort((left, right) => left.order - right.order)
                  .map((step) => (
                    <div
                      key={`${step.agent_type}-${step.order}`}
                      className="flex items-start justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2"
                    >
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {step.description}
                        </p>
                        <p className="text-xs text-slate-500">{step.agent_type}</p>
                      </div>
                      <StatusBadge
                        status={toBadgeStatus(step.status)}
                        label={humanize(step.status)}
                      />
                    </div>
                  ))
              ) : (
                <p className="text-sm text-slate-500">
                  No execution plan has been recorded for this run yet.
                </p>
              )}
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
                onClick={() => setActiveTab(key)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium ${activeTab === key
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-700"
                  }`}
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
                      <td colSpan={6} className="py-8 text-center text-red-600">
                        {transactionsError}
                      </td>
                    </tr>
                  ) : transactions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500">
                        No transactions found for this run.
                      </td>
                    </tr>
                  ) : (
                    transactions.map((transaction) => (
                      <tr
                        key={transaction.id}
                        className="border-b border-slate-100 text-slate-700 last:border-0"
                      >
                        <td className="py-3 font-mono text-xs">
                          {transaction.reference}
                        </td>
                        <td className="py-3">
                          <StatusBadge
                            status={transactionStatus(transaction.status)}
                            label={transaction.status}
                          />
                        </td>
                        <td className="py-3">
                          {formatCurrency(transaction.amount)}
                        </td>
                        <td className="py-3">{transaction.channel || "—"}</td>
                        <td className="py-3">
                          {transaction.counterparty_name || "—"}
                        </td>
                        <td className="py-3">
                          {transaction.date ? formatDateTime(transaction.date) : "—"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "candidates" && (
            <div className="grid gap-3 lg:grid-cols-2">
              {candidates.length === 0 ? (
                <p className="text-sm text-slate-500">
                  No payout candidates have been attached to this run.
                </p>
              ) : (
                candidates.map((candidate) => (
                  <div
                    key={candidate.id}
                    className="rounded-xl border border-slate-200 p-4 text-left"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="font-semibold text-slate-900">
                          {candidate.beneficiary_name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {candidate.institution_code} · {maskAccount(candidate.account_number)}
                        </p>
                      </div>
                      <StatusBadge
                        status={(candidate.risk_decision ?? "review") as "allow" | "review" | "block"}
                      />
                    </div>
                    <div className="mt-3 space-y-2 text-sm text-slate-600">
                      <p>Amount: {formatCurrency(candidate.amount)}</p>
                      <p>Purpose: {candidate.purpose || "—"}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500">Approval</span>
                        <span
                          className={`rounded-full border px-2 py-0.5 text-xs ${approvalClass(candidate)}`}
                        >
                          {approvalLabel(candidate)}
                        </span>
                      </div>
                      <p>Execution: {humanize(candidate.execution_status)}</p>
                      <p>
                        Risk Score: {candidate.risk_score === null ? "Pending" : candidate.risk_score.toFixed(2)}
                      </p>
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
                  {reportError}
                </div>
              ) : !auditReport ? (
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                  Audit report has not been generated for this run yet.
                </div>
              ) : (
                <div className="space-y-5">
                  {/* Executive Summary */}
                  {auditReport.report?.executive_summary && (
                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                      <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-emerald-800">
                        Executive Summary
                      </h3>
                      <p className="whitespace-pre-line text-sm leading-relaxed text-emerald-900">
                        {auditReport.report.executive_summary as string}
                      </p>
                    </div>
                  )}

                  {/* Summary Cards */}
                  {auditReport.report && (
                    <div className="grid gap-3 sm:grid-cols-3">
                      {auditReport.report.risk_summary && (
                        <div className="rounded-xl border border-slate-200 bg-white p-4">
                          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Risk Summary</h4>
                          <div className="space-y-1 text-sm text-slate-700">
                            <p>Total scored: <span className="font-medium">{String((auditReport.report.risk_summary as Record<string, unknown>).total)}</span></p>
                            <p>Avg risk: <span className="font-medium">{Number((auditReport.report.risk_summary as Record<string, unknown>).average_risk_score)?.toFixed(2)}</span></p>
                            <p>Total amount: <span className="font-medium">{formatCurrency(Number((auditReport.report.risk_summary as Record<string, unknown>).total_amount))}</span></p>
                          </div>
                        </div>
                      )}
                      {auditReport.report.execution_summary && (
                        <div className="rounded-xl border border-slate-200 bg-white p-4">
                          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Execution Summary</h4>
                          <div className="space-y-1 text-sm text-slate-700">
                            <p>Lookups: <span className="font-medium">{String((auditReport.report.execution_summary as Record<string, unknown>).lookups_performed)}</span></p>
                            <p>Submitted: <span className="font-medium">{String((auditReport.report.execution_summary as Record<string, unknown>).candidates_submitted)}</span></p>
                          </div>
                        </div>
                      )}
                      {auditReport.report.approval_summary && (
                        <div className="rounded-xl border border-slate-200 bg-white p-4">
                          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Approval Summary</h4>
                          <div className="space-y-1 text-sm text-slate-700">
                            <p>Approved: <span className="font-medium text-emerald-700">{String((auditReport.report.approval_summary as Record<string, unknown>).approved)}</span></p>
                            <p>Rejected: <span className="font-medium text-red-600">{String((auditReport.report.approval_summary as Record<string, unknown>).rejected)}</span></p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Audit Trail */}
                  {(auditReport.audit_trail ?? auditReport.entries ?? []).length > 0 && (
                    <div>
                      <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
                        Agent Activity Trail
                      </h3>
                      <div className="space-y-2">
                        {(auditReport.audit_trail ?? auditReport.entries ?? []).map((entry: AuditEntry) => (
                          <div
                            key={entry.id}
                            className="flex items-start gap-3 rounded-lg border border-slate-200 px-3 py-2"
                          >
                            <div className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-amber-500" />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-slate-900">
                                  {entry.action.replaceAll("_", " ")}
                                </span>
                                {entry.agent_type && (
                                  <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500">
                                    {entry.agent_type}
                                  </span>
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
                              <p className="mt-0.5 text-xs text-slate-400">
                                {formatDateTime(entry.created_at)}
                              </p>
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
