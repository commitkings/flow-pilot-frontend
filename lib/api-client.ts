/* ──────────────────────────────────────────────────────────────
   api-client.ts — Typed HTTP client for FlowPilot backend API
   ────────────────────────────────────────────────────────────── */

import { getToken, clearToken } from "./token-storage";
import {
  ApiError,
  type ApiRunRecord,
  type ApproveRejectPayload,
  type ApproveResponse,
  type RejectResponse,
  type AuditReport,
  type Candidate,
  type CandidateApprovalStatus,
  type CandidatesResponse,
  type CreateRunPayload,
  type InstitutionsResponse,
  type OnboardingPayload,
  type OnboardingResponse,
  type RunStatusResponse,
  type TransactionsResponse,
  type UploadCandidatesResponse,
  type User,
} from "./api-types";

const BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000/api/v1";

// ── Generic fetch wrapper ────────────────────────────────────

interface FetchOptions {
  method?: string;
  body?: unknown;
  auth?: boolean;
  headers?: Record<string, string>;
  raw?: boolean; // return raw Response instead of parsed JSON
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function apiFetch<T>(
  path: string,
  opts: FetchOptions & { raw: true },
): Promise<Response>;
async function apiFetch<T>(
  path: string,
  opts?: FetchOptions,
): Promise<T>;
async function apiFetch<T>(
  path: string,
  opts: FetchOptions = {},
): Promise<T | Response> {
  const { method = "GET", body, auth = false, headers = {}, raw = false } = opts;

  const reqHeaders: Record<string, string> = { ...headers };

  if (auth) {
    const token = getToken();
    if (token) {
      reqHeaders["Authorization"] = `Bearer ${token}`;
    }
  }

  const init: RequestInit = { method, headers: reqHeaders };

  if (body !== undefined) {
    reqHeaders["Content-Type"] = "application/json";
    init.body = JSON.stringify(body);
  }

  init.headers = reqHeaders;

  const res = await fetch(`${BASE}${path}`, init);

  if (raw) {
    if (res.status === 401) clearToken();
    return res;
  }

  if (!res.ok) {
    if (res.status === 401) {
      clearToken();
    }
    let detail: string = res.statusText;
    try {
      const errBody = (await res.json()) as { detail?: string | Array<{ msg: string }> };
      if (typeof errBody.detail === "string") {
        detail = errBody.detail;
      } else if (Array.isArray(errBody.detail)) {
        detail = errBody.detail.map((e) => e.msg).join("; ");
      }
    } catch {
      // response body not JSON — keep statusText
    }
    throw new ApiError(res.status, { detail });
  }

  // 204 No Content
  if (res.status === 204) return undefined as unknown as T;

  return (await res.json()) as T;
}

// ── Multipart helper (for CSV upload) ────────────────────────

async function apiUpload<T>(path: string, formData: FormData, auth = false): Promise<T> {
  const reqHeaders: Record<string, string> = {};

  if (auth) {
    const token = getToken();
    if (token) {
      reqHeaders["Authorization"] = `Bearer ${token}`;
    }
  }

  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: reqHeaders,
    body: formData,
  });

  if (!res.ok) {
    if (res.status === 401) clearToken();
    let detail: string = res.statusText;
    try {
      const errBody = (await res.json()) as { detail?: string | Array<{ msg: string }> };
      if (typeof errBody.detail === "string") {
        detail = errBody.detail;
      } else if (Array.isArray(errBody.detail)) {
        detail = errBody.detail.map((e) => e.msg).join("; ");
      }
    } catch {
      // keep statusText
    }
    throw new ApiError(res.status, { detail });
  }

  return (await res.json()) as T;
}

// ── Auth endpoints ───────────────────────────────────────────

/** URL to redirect the browser to for Google OAuth */
export function googleLoginUrl(): string {
  return `${BASE}/auth/google/login`;
}

/** Fetch authenticated user profile */
export function fetchMe(): Promise<User> {
  return apiFetch<User>("/auth/me", { auth: true });
}

/** Update user profile */
export function updateMe(data: Partial<Pick<User, "display_name" | "avatar_url">>): Promise<User> {
  return apiFetch<User>("/auth/me", { method: "PATCH", body: data, auth: true });
}

/** Server-side logout (invalidate token) */
export function logout(): Promise<void> {
  return apiFetch<void>("/auth/logout", { method: "POST", auth: true });
}

// ── Onboarding ───────────────────────────────────────────────

export function completeOnboarding(payload: OnboardingPayload): Promise<OnboardingResponse> {
  return apiFetch<OnboardingResponse>("/onboarding/complete", {
    method: "POST",
    body: payload,
    auth: true,
  });
}

// ── Runs ─────────────────────────────────────────────────────

export function createRun(payload: CreateRunPayload): Promise<ApiRunRecord> {
  return apiFetch<ApiRunRecord>("/runs", { method: "POST", body: payload, auth: true });
}

export function listRuns(): Promise<ApiRunRecord[]> {
  return apiFetch<ApiRunRecord[]>("/runs", { auth: true });
}

export function getRun(runId: string): Promise<ApiRunRecord> {
  return apiFetch<ApiRunRecord>(`/runs/${runId}`, { auth: true });
}

export function getRunStatus(runId: string): Promise<RunStatusResponse> {
  return apiFetch<RunStatusResponse>(`/runs/${runId}/status`, { auth: true });
}

// ── Candidates ───────────────────────────────────────────────

export function uploadCandidates(
  runId: string,
  file: File,
): Promise<UploadCandidatesResponse> {
  const fd = new FormData();
  fd.append("file", file);
  return apiUpload<UploadCandidatesResponse>(`/runs/${runId}/candidates/upload`, fd, true);
}

export function listCandidates(
  runId: string,
  approvalStatus?: string,
): Promise<CandidatesResponse> {
  const qs = approvalStatus ? `?approval_status=${approvalStatus}` : "";
  return apiFetch<CandidatesResponse>(`/runs/${runId}/candidates${qs}`, { auth: true });
}

// ── Actions ──────────────────────────────────────────────────

export function approveCandidates(
  runId: string,
  candidateIds: string[],
): Promise<ApproveResponse> {
  return apiFetch<ApproveResponse>(`/runs/${runId}/approve`, {
    method: "POST",
    body: { candidate_ids: candidateIds } satisfies ApproveRejectPayload,
    auth: true,
  });
}

export function rejectCandidates(
  runId: string,
  candidateIds: string[],
  reason?: string,
): Promise<RejectResponse> {
  const payload: ApproveRejectPayload = { candidate_ids: candidateIds };
  if (reason) payload.reason = reason;
  return apiFetch<RejectResponse>(`/runs/${runId}/reject`, {
    method: "POST",
    body: payload,
    auth: true,
  });
}

// ── Audit ────────────────────────────────────────────────────

export function getRunReport(runId: string): Promise<AuditReport> {
  return apiFetch<AuditReport>(`/runs/${runId}/report`, { auth: true });
}

export async function downloadRunReport(runId: string): Promise<Blob> {
  const res = await apiFetch<Response>(`/runs/${runId}/report/download`, { raw: true, auth: true });
  if (!res.ok) {
    throw new ApiError(res.status, { detail: res.statusText });
  }
  return res.blob();
}

// ── Institutions ─────────────────────────────────────────────

export function listInstitutions(): Promise<InstitutionsResponse> {
  return apiFetch<InstitutionsResponse>("/institutions", { auth: true });
}

// ── Health (no auth) ─────────────────────────────────────────

export async function fetchHealth(): Promise<{ payout_mode: string; status: string }> {
  const ROOT =
    process.env.NEXT_PUBLIC_API_BASE_URL?.replace("/api/v1", "") ?? "http://127.0.0.1:8000";
  const res = await fetch(`${ROOT}/health`);
  return (await res.json()) as { payout_mode: string; status: string };
}

// ── Candidate type adapter (API → UI) ────────────────────────

/** Maps snake_case API candidate to camelCase used in existing UI */
import type { PayoutCandidate, RunRecord, RunStatus } from "@/lib/mock-data";

/** Maps API approval_status → UI approvalStatus */
const approvalStatusMap: Record<CandidateApprovalStatus, PayoutCandidate["approvalStatus"]> = {
  pending: "unselected",
  approved: "selected",
  rejected: "blocked",
};

/** Maps backend risk_decision → UI CandidateDecision */
function mapRiskDecision(rd: string): PayoutCandidate["decision"] {
  if (rd === "approve") return "allow";
  if (rd === "reject") return "block";
  return "review";
}

export function adaptCandidate(c: Candidate): PayoutCandidate {
  return {
    id: c.id,
    beneficiaryName: c.beneficiary_name,
    institution: c.institution_code,
    accountNumber: c.account_number,
    amount: c.amount,
    purpose: c.purpose ?? "",
    riskScore: c.risk_score,
    riskReasons: c.risk_reasons,
    lookupStatus: "verified",
    decision: mapRiskDecision(c.risk_decision),
    approvalStatus: approvalStatusMap[c.approval_status],
    similarity: 1,
    nameOnFile: c.beneficiary_name,
    returnedName: c.beneficiary_name,
  };
}

/** Maps backend API status strings to UI RunStatus, collapsing unknown values */
function mapRunStatus(s: string): RunStatus {
  const known: RunStatus[] = [
    "pending", "planning", "running", "awaiting_approval",
    "executing", "completed", "failed",
  ];
  if ((known as string[]).includes(s)) return s as RunStatus;
  // Backend-only intermediate statuses map to "running"
  if (s === "reconciling" || s === "scoring" || s === "forecasting") return "running";
  if (s === "cancelled") return "failed";
  return "running";
}

/** Maps snake_case API run to the shape expected by existing UI components */
export function adaptRun(r: ApiRunRecord): RunRecord {
  const started = new Date(r.created_at);
  const now = new Date();
  const diffMs = now.getTime() - started.getTime();
  const diffMins = Math.floor(diffMs / 60000);
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

// ── Transactions ──────────────────────────────────────────────

export interface TransactionFilters {
  run_id?: string;
  status?: string;
  channel?: string;
  search?: string;
  from_date?: string;
  to_date?: string;
  limit?: number;
  offset?: number;
}

export async function listTransactions(
  filters: TransactionFilters = {},
): Promise<TransactionsResponse> {
  const params = new URLSearchParams();
  if (filters.run_id) params.set("run_id", filters.run_id);
  if (filters.status) params.set("status", filters.status);
  if (filters.channel) params.set("channel", filters.channel);
  if (filters.search) params.set("search", filters.search);
  if (filters.from_date) params.set("from_date", filters.from_date);
  if (filters.to_date) params.set("to_date", filters.to_date);
  if (filters.limit) params.set("limit", String(filters.limit));
  if (filters.offset) params.set("offset", String(filters.offset));

  const qs = params.toString();
  return apiFetch<TransactionsResponse>(
    `/transactions${qs ? `?${qs}` : ""}`,
    { auth: true },
  );
}
