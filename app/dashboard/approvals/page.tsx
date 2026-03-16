"use client";

import { useState } from "react";
import { ChevronDown, Loader2, ShieldCheck, ShieldAlert, SlidersHorizontal, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/form-fields";
import { StatusBadge } from "@/components/status-badge";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { PageHeader } from "@/components/ui/page-header";
import { useApprovals } from "@/hooks/use-approval-queries";
import type { ApprovalFilters } from "@/lib/api-client";

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

function approvalBadge(status: string) {
  if (status === "approved") return "completed";
  if (status === "rejected") return "failed";
  return "pending";
}

export default function ApprovalsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [expandedRiskId, setExpandedRiskId] = useState<string | null>(null);

  const apiFilters: ApprovalFilters = {
    approval_status: statusFilter || undefined,
    search: search || undefined,
  };

  const { data, isLoading, isError } = useApprovals(apiFilters);

  const approvals = data?.approvals ?? [];
  const total = data?.total ?? 0;
  const pending = approvals.filter((a) => a.approval_status === "pending").length;
  const approved = approvals.filter((a) => a.approval_status === "approved").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Approvals"
        description="Review and approve pending disbursements across all runs."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard
          label="Total"
          value={isLoading ? "…" : String(total)}
          subtext="All candidates"
          icon={<Users className="h-4 w-4" />}
          accent="brand"
        />
        <MetricCard
          label="Pending"
          value={isLoading ? "…" : String(pending)}
          subtext="Awaiting review"
          icon={<ShieldAlert className="h-4 w-4" />}
          accent="amber"
        />
        <MetricCard
          label="Approved"
          value={isLoading ? "…" : String(approved)}
          subtext="Cleared"
          icon={<ShieldCheck className="h-4 w-4" />}
          accent="green"
        />
      </div>

      <div className="overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-border px-4 py-4 md:flex-row md:items-center md:justify-between md:px-6">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by beneficiary or account…"
            className="w-full md:w-80"
          />
          <div className="flex items-center gap-3">
            {["", "pending", "approved", "rejected"].map((s) => (
              <Button
                key={s}
                variant={statusFilter === s ? "default" : "outline"}
                size="sm"
                className="rounded-full capitalize"
                onClick={() => setStatusFilter(s)}
              >
                {s || "All"}
              </Button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                {["Beneficiary", "Amount", "Risk Score", "Risk Decision", "Status", "Run", "Created"].map((h) => (
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
                    Failed to load approvals. Please refresh.
                  </td>
                </tr>
              ) : approvals.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <p className="text-base font-black text-foreground">No approvals found</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Approvals will appear here when a run reaches the approval stage.
                    </p>
                  </td>
                </tr>
              ) : (
                approvals.map((a) => {
                  const hasReasons = a.risk_reasons && a.risk_reasons.length > 0;
                  const isExpanded = expandedRiskId === a.id;
                  return (
                    <tr key={a.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-3">
                        <p className="font-medium text-foreground">{a.beneficiary_name}</p>
                        <p className="text-xs text-muted-foreground">{a.account_number} · {a.institution_code}</p>
                      </td>
                      <td className="px-6 py-3 font-semibold text-foreground">{formatCurrency(a.amount)}</td>
                      <td className="px-6 py-3">
                        <div>
                          <span className="text-muted-foreground">
                            {a.risk_score != null ? a.risk_score.toFixed(2) : "—"}
                          </span>
                          {hasReasons && (
                            <button
                              type="button"
                              onClick={() => setExpandedRiskId(isExpanded ? null : a.id)}
                              className="ml-2 inline-flex items-center gap-0.5 text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors"
                            >
                              <ChevronDown className={`h-3 w-3 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                              {a.risk_reasons!.length}
                            </button>
                          )}
                        </div>
                        {isExpanded && a.risk_reasons && (
                          <ul className="mt-1.5 space-y-0.5 pl-2">
                            {a.risk_reasons.map((reason, i) => (
                              <li key={i} className="text-[11px] text-muted-foreground list-disc ml-2">
                                {reason}
                              </li>
                            ))}
                          </ul>
                        )}
                      </td>
                      <td className="px-6 py-3">
                        <StatusBadge
                          status={a.risk_decision === "allow" ? "completed" : a.risk_decision === "block" ? "failed" : "pending"}
                          label={a.risk_decision ?? "—"}
                        />
                      </td>
                      <td className="px-6 py-3">
                        <StatusBadge status={approvalBadge(a.approval_status)} label={a.approval_status} />
                      </td>
                      <td className="px-6 py-3 text-xs text-muted-foreground max-w-[200px] truncate">
                        {a.run_objective ?? a.run_id.slice(0, 8)}
                      </td>
                      <td className="px-6 py-3 text-muted-foreground">{formatDateTime(a.created_at)}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
