/**
 * api-client.ts — FlowPilot API endpoints
 *
 * All HTTP calls go through the shared Axios instance in lib/axios.ts.
 * That instance handles: base URL, Bearer token injection, error normalisation, 401 clearing.
 *
 * Sections:
 *  1. Auth
 *  2. Onboarding
 *  3. Runs
 *  4. Candidates
 *  5. Approvals
 *  6. Audit / Reports
 *  7. Institutions
 *  8. Transactions
 *  9. Health
 */

import apiClient from "./axios";
import type {
  ApiRunRecord,
  ApproveRejectPayload,
  ApproveResponse,
  AuthResponse,
  RejectResponse,
  AuditReport,
  CandidatesResponse,
  CreateRunPayload,
  InstitutionsResponse,
  OnboardingPayload,
  OnboardingResponse,
  RunStatusResponse,
  TransactionsResponse,
  UploadCandidatesResponse,
  User,
} from "./api-types";
import { transactionRows } from "./mock-data";

// ── 1. Auth ──────────────────────────────────────────────────────────────────

/** URL to redirect the browser to for Google OAuth (no HTTP call needed) */
export function googleLoginUrl(): string {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000/api/v1";
  return `${base}/auth/google/login`;
}

export function register(name: string, email: string, password: string): Promise<AuthResponse> {
  return apiClient.post<AuthResponse>("/auth/register", { name, email, password }).then((r) => r.data);
}

export function login(email: string, password: string): Promise<AuthResponse> {
  return apiClient.post<AuthResponse>("/auth/login", { email, password }).then((r) => r.data);
}

export function fetchMe(): Promise<User> {
  return apiClient.get<User>("/auth/me").then((r) => r.data);
}

export function updateMe(data: Partial<Pick<User, "display_name" | "avatar_url">>): Promise<User> {
  return apiClient.patch<User>("/auth/me", data).then((r) => r.data);
}

export function logout(): Promise<void> {
  return apiClient.post<void>("/auth/logout").then(() => undefined);
}

// ── 2. Onboarding ────────────────────────────────────────────────────────────

export function completeOnboarding(payload: OnboardingPayload): Promise<OnboardingResponse> {
  return apiClient.post<OnboardingResponse>("/onboarding/complete", payload).then((r) => r.data);
}

// ── 3. Runs ──────────────────────────────────────────────────────────────────

export function createRun(payload: CreateRunPayload): Promise<ApiRunRecord> {
  return apiClient.post<ApiRunRecord>("/runs", payload).then((r) => r.data);
}

export function listRuns(): Promise<ApiRunRecord[]> {
  return apiClient.get<ApiRunRecord[]>("/runs").then((r) => r.data);
}

export function getRun(runId: string): Promise<ApiRunRecord> {
  return apiClient.get<ApiRunRecord>(`/runs/${runId}`).then((r) => r.data);
}

export function getRunStatus(runId: string): Promise<RunStatusResponse> {
  return apiClient.get<RunStatusResponse>(`/runs/${runId}/status`).then((r) => r.data);
}

// ── 4. Candidates ────────────────────────────────────────────────────────────

export function uploadCandidates(runId: string, file: File): Promise<UploadCandidatesResponse> {
  const fd = new FormData();
  fd.append("file", file);
  return apiClient
    .post<UploadCandidatesResponse>(`/runs/${runId}/candidates/upload`, fd, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((r) => r.data);
}

export function listCandidates(runId: string, approvalStatus?: string): Promise<CandidatesResponse> {
  return apiClient
    .get<CandidatesResponse>(`/runs/${runId}/candidates`, {
      params: approvalStatus ? { approval_status: approvalStatus } : undefined,
    })
    .then((r) => r.data);
}

// ── 5. Approvals ─────────────────────────────────────────────────────────────

export function approveCandidates(runId: string, candidateIds: string[]): Promise<ApproveResponse> {
  const payload: ApproveRejectPayload = { candidate_ids: candidateIds };
  return apiClient.post<ApproveResponse>(`/runs/${runId}/approve`, payload).then((r) => r.data);
}

export function rejectCandidates(runId: string, candidateIds: string[], reason?: string): Promise<RejectResponse> {
  const payload: ApproveRejectPayload = { candidate_ids: candidateIds };
  if (reason) payload.reason = reason;
  return apiClient.post<RejectResponse>(`/runs/${runId}/reject`, payload).then((r) => r.data);
}

// ── 6. Audit / Reports ───────────────────────────────────────────────────────

export function getRunReport(runId: string): Promise<AuditReport> {
  return apiClient.get<AuditReport>(`/runs/${runId}/report`).then((r) => r.data);
}

export function downloadRunReport(runId: string): Promise<Blob> {
  return apiClient
    .get(`/runs/${runId}/report/download`, { responseType: "blob" })
    .then((r) => r.data as Blob);
}

// ── 7. Institutions ──────────────────────────────────────────────────────────

export function listInstitutions(): Promise<InstitutionsResponse> {
  return apiClient.get<InstitutionsResponse>("/institutions").then((r) => r.data);
}

// ── 8. Transactions ──────────────────────────────────────────────────────────

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

export function listTransactions(filters: TransactionFilters = {}): Promise<TransactionsResponse> {
  // Commenting out real API call since endpoint is not done yet
  /*
  return apiClient
    .get<TransactionsResponse>("/transactions", { params: filters })
    .then((r) => r.data);
  */
  
  const mockRows = transactionRows.map((r, i) => ({
    id: `mock-tx-${i}`,
    run_id: "mock-run-id",
    reference: r.reference,
    channel: r.channel,
    amount: r.amount,
    currency: "NGN",
    direction: "credit",
    status: r.status.toUpperCase(),
    narration: "Mock narration",
    counterparty_name: "Mock Counterparty",
    counterparty_bank: "Mock Bank",
    date: r.date,
    settlement_date: r.date,
    anomaly: r.anomaly,
    anomaly_count: r.anomaly === "Clean" ? 0 : 1,
  })) as any;

  return Promise.resolve({
    transactions: mockRows,
    total: mockRows.length,
    limit: 50,
    offset: 0,
    summary: { 
      total_transactions: mockRows.length, 
      total_volume: mockRows.reduce((acc: number, curr: any) => acc + curr.amount, 0), 
      anomaly_count: mockRows.filter((r: any) => r.anomaly_count > 0).length, 
      failed_count: mockRows.filter((r: any) => r.status === "FAILED").length 
    }
  });
}

// ── 9. Health (unauthenticated) ───────────────────────────────────────────────

export async function fetchHealth(): Promise<{ payout_mode: string; status: string }> {
  const root = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000/api/v1").replace(
    "/api/v1",
    "",
  );
  const res = await fetch(`${root}/health`);
  return res.json() as Promise<{ payout_mode: string; status: string }>;
}
