/**
 * useHelper.ts — Shared pure-function utilities for FlowPilot
 *
 * Sections:
 *  1. Blob / file download
 *  2. Run adapters   (API → UI)
 *  3. Candidate adapters (API → UI)
 */

import type { PayoutCandidate, RunRecord, RunStatus } from "@/lib/mock-data";
import type { ApiRunRecord, Candidate, CandidateApprovalStatus } from "@/lib/api-types";

// ── 1. Blob download ─────────────────────────────────────────────────────────

/**
 * Triggers a browser file download from a Blob.
 *
 * @param blob     The Blob returned by an API download endpoint
 * @param filename The suggested filename for the saved file
 *
 * @example
 *   const blob = await downloadRunReport(id);
 *   downloadBlob(blob, `run-${id}-report.json`);
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1_500);
}

// ── 2. Run adapters ──────────────────────────────────────────────────────────

/** Maps backend status strings to UI RunStatus, collapsing unknown values */
function mapRunStatus(s: string): RunStatus {
  const known: RunStatus[] = [
    "pending", "planning", "running", "awaiting_approval",
    "executing", "completed", "completed_with_errors", "failed",
  ];
  if ((known as string[]).includes(s)) return s as RunStatus;
  if (s === "reconciling" || s === "scoring" || s === "forecasting") return "running";
  if (s === "cancelled") return "failed";
  return "running";
}

/** Maps a snake_case API run record to the shape expected by UI components */
export function adaptRun(r: ApiRunRecord): RunRecord {
  const started = new Date(r.created_at);
  const diffMs = Date.now() - started.getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  let startedRelative: string;
  if (diffMins < 60) startedRelative = `${diffMins} minutes ago`;
  else if (diffHours < 24) startedRelative = `${diffHours} hours ago`;
  else if (diffDays === 1) startedRelative = "Yesterday";
  else if (diffDays < 7) startedRelative = `${diffDays} days ago`;
  else startedRelative = "Last week";

  return {
    id: r.run_id,
    objective: r.objective,
    status: mapRunStatus(r.status),
    candidates: r.candidate_count ?? 0,
    startedRelative,
    startedAt: started.toLocaleString("en-NG", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZoneName: "short",
    }),
  };
}

// ── 3. Candidate adapters ────────────────────────────────────────────────────

/** Maps API approval_status → UI approvalStatus */
const approvalStatusMap: Record<CandidateApprovalStatus, PayoutCandidate["approvalStatus"]> = {
  pending: "unselected",
  approved: "selected",
  rejected: "blocked",
};

/** Maps backend risk_decision string → UI CandidateDecision */
function mapRiskDecision(rd: string): PayoutCandidate["decision"] {
  if (rd === "approve" || rd === "allow") return "allow";
  if (rd === "reject" || rd === "block") return "block";
  return "review";
}

function mapLookupStatus(c: Candidate): PayoutCandidate["lookupStatus"] {
  if (!c.lookup_account_name) return "failed";
  if (c.lookup_match_score !== null && c.lookup_match_score < 0.8) return "mismatch";
  return "verified";
}

/** Maps a snake_case API candidate to the camelCase shape used in UI components */
export function adaptCandidate(c: Candidate): PayoutCandidate {
  const matchPct = c.lookup_match_score !== null
    ? Math.round(c.lookup_match_score * 100)
    : 0;

  return {
    id: c.id,
    beneficiaryName: c.beneficiary_name,
    institution: c.institution_code,
    accountNumber: c.account_number,
    amount: c.amount,
    purpose: c.purpose ?? "",
    riskScore: c.risk_score ?? 0,
    riskReasons: c.risk_reasons ?? [],
    lookupStatus: mapLookupStatus(c),
    decision: mapRiskDecision(c.risk_decision ?? "review"),
    approvalStatus: approvalStatusMap[c.approval_status],
    similarity: matchPct,
    nameOnFile: c.beneficiary_name,
    returnedName: c.lookup_account_name ?? c.beneficiary_name,
  };
}
