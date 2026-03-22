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
  AbandonConversationResponse,
  ApiRunRecord,
  ApproveRejectPayload,
  ApproveResponse,
  ApprovalsQueueResponse,
  AuditListResponse,
  AuthResponse,
  ChatSendResponse,
  ConfirmRunResponse,
  ConversationDetail,
  ConversationsListResponse,
  RejectResponse,
  AuditReport,
  CandidatesResponse,
  ConnectionsResponse,
  CreateRunPayload,
  InstitutionsResponse,
  InviteMemberPayload,
  NotificationsResponse,
  OnboardingPayload,
  OnboardingResponse,
  OrgProfile,
  RunStatusResponse,
  TeamMembersResponse,
  TransactionsResponse,
  UploadCandidatesResponse,
  User,
} from "./api-types";
import type { StepSummary, StepDetail } from "./event-types";

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

export function updateMe(data: Partial<Pick<User, "display_name" | "avatar_url" | "first_name" | "last_name" | "job_title" | "phone" | "timezone" | "department">>): Promise<User> {
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
  return apiClient
    .get<{ runs: ApiRunRecord[] }>("/runs")
    .then((r) => r.data.runs);
}

export function getRun(runId: string): Promise<ApiRunRecord> {
  return apiClient.get<ApiRunRecord>(`/runs/${runId}`).then((r) => r.data);
}

export function getRunStatus(runId: string): Promise<RunStatusResponse> {
  return apiClient.get<RunStatusResponse>(`/runs/${runId}/status`).then((r) => r.data);
}

export function getRunSteps(runId: string): Promise<{ run_id: string; steps: StepSummary[] }> {
  return apiClient.get<{ run_id: string; steps: StepSummary[] }>(`/runs/${runId}/steps`).then((r) => r.data);
}

export function getRunStepDetail(runId: string, stepId: string): Promise<StepDetail> {
  return apiClient.get<StepDetail>(`/runs/${runId}/steps/${stepId}`).then((r) => r.data);
}

/** Returns the SSE stream URL for a run (used with fetch streaming, not Axios) */
export function getRunEventsStreamUrl(runId: string, lastSeq: number = 0): string {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000/api/v1";
  return `${base}/runs/${runId}/events/stream?last_seq=${lastSeq}`;
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
  return apiClient
    .get<TransactionsResponse>("/transactions", { params: filters })
    .then((r) => r.data);
}

// ── 9. Approvals Queue ────────────────────────────────────────────────────────

export interface ApprovalFilters {
  approval_status?: string;
  risk_decision?: string;
  run_id?: string;
  search?: string;
  from_date?: string;
  to_date?: string;
  limit?: number;
  offset?: number;
}

export function listApprovals(filters: ApprovalFilters = {}): Promise<ApprovalsQueueResponse> {
  return apiClient
    .get<ApprovalsQueueResponse>("/approvals", { params: filters })
    .then((r) => r.data);
}

// ── 10. Audit (Global) ───────────────────────────────────────────────────────

export interface AuditFilters {
  run_id?: string;
  agent_type?: string;
  action?: string;
  from_date?: string;
  to_date?: string;
  limit?: number;
  offset?: number;
}

export function listAuditEntries(filters: AuditFilters = {}): Promise<AuditListResponse> {
  return apiClient
    .get<AuditListResponse>("/audit", { params: filters })
    .then((r) => r.data);
}

// ── 11. Notifications ────────────────────────────────────────────────────────

export function listNotifications(params: { is_read?: boolean; limit?: number; offset?: number } = {}): Promise<NotificationsResponse> {
  return apiClient
    .get<NotificationsResponse>("/notifications", { params })
    .then((r) => r.data);
}

export function markNotificationRead(id: string): Promise<{ status: string }> {
  return apiClient.patch<{ status: string }>(`/notifications/${id}/read`).then((r) => r.data);
}

export function markAllNotificationsRead(): Promise<{ marked_read: number }> {
  return apiClient.post<{ marked_read: number }>("/notifications/read-all").then((r) => r.data);
}

export function deleteNotification(id: string): Promise<{ status: string }> {
  return apiClient.delete<{ status: string }>(`/notifications/${id}`).then((r) => r.data);
}

// ── 12. Team ─────────────────────────────────────────────────────────────────

export function listTeamMembers(params: { limit?: number; offset?: number } = {}): Promise<TeamMembersResponse> {
  return apiClient
    .get<TeamMembersResponse>("/team/members", { params })
    .then((r) => r.data);
}

export function inviteTeamMember(payload: InviteMemberPayload): Promise<{ status: string; member: import("./api-types").TeamMember }> {
  return apiClient.post("/team/invite", payload).then((r) => r.data);
}

export function updateTeamMemberRole(memberId: string, role: string): Promise<{ status: string; member: import("./api-types").TeamMember }> {
  return apiClient.patch(`/team/members/${memberId}`, { role }).then((r) => r.data);
}

export function removeTeamMember(memberId: string): Promise<{ status: string }> {
  return apiClient.delete<{ status: string }>(`/team/members/${memberId}`).then((r) => r.data);
}

// ── 13. Org Profile ──────────────────────────────────────────────────────────

export function getOrgProfile(): Promise<OrgProfile> {
  return apiClient.get<OrgProfile>("/org/profile").then((r) => r.data);
}

export function updateOrgProfile(data: Record<string, unknown>): Promise<Record<string, unknown>> {
  return apiClient.patch("/org/profile", data).then((r) => r.data);
}

export function updateOrgConfig(data: Record<string, unknown>): Promise<Record<string, unknown>> {
  return apiClient.patch("/org/profile/config", data).then((r) => r.data);
}

// ── 14. Auth (Extended) ──────────────────────────────────────────────────────

export function changePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
  return apiClient
    .post<{ message: string }>("/auth/me/password", {
      current_password: currentPassword,
      new_password: newPassword,
    })
    .then((r) => r.data);
}

export function uploadAvatar(file: File): Promise<{ avatar_url: string }> {
  const fd = new FormData();
  fd.append("file", file);
  return apiClient
    .post<{ avatar_url: string }>("/auth/me/avatar", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((r) => r.data);
}

export function removeAvatar(): Promise<{ message: string }> {
  return apiClient.delete<{ message: string }>("/auth/me/avatar").then((r) => r.data);
}

export function getConnections(): Promise<ConnectionsResponse> {
  return apiClient.get<ConnectionsResponse>("/auth/connections").then((r) => r.data);
}

export function exportAccountData(): Promise<Blob> {
  return apiClient
    .post("/account/export", {}, { responseType: "blob" })
    .then((r) => r.data as Blob);
}

// ── 15. Health (unauthenticated) ──────────────────────────────────────────────

export async function fetchHealth(): Promise<{ payout_mode: string; status: string }> {
  const root = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000/api/v1").replace(
    "/api/v1",
    "",
  );
  const res = await fetch(`${root}/health`);
  return res.json() as Promise<{ payout_mode: string; status: string }>;
}

// ── 16. Chat / Conversations ─────────────────────────────────────────────────

export async function chatSend(
  message: string,
  businessId: string,
  conversationId?: string,
): Promise<ChatSendResponse> {
  const { data } = await apiClient.post<ChatSendResponse>("/chat/send", {
    message,
    business_id: businessId,
    ...(conversationId && { conversation_id: conversationId }),
  });
  return data;
}

export async function listConversations(
  businessId: string,
  limit = 20,
  offset = 0,
): Promise<ConversationsListResponse> {
  const { data } = await apiClient.get<ConversationsListResponse>("/chat/conversations", {
    params: { business_id: businessId, limit, offset },
  });
  return data;
}

export async function getConversation(conversationId: string): Promise<ConversationDetail> {
  const { data } = await apiClient.get<ConversationDetail>(`/chat/conversations/${conversationId}`);
  return data;
}

export async function confirmConversation(
  conversationId: string,
  slotOverrides?: Record<string, unknown>,
): Promise<ConfirmRunResponse> {
  const { data } = await apiClient.post<ConfirmRunResponse>(
    `/chat/conversations/${conversationId}/confirm`,
    slotOverrides ? { slot_overrides: slotOverrides } : {},
  );
  return data;
}

export async function abandonConversation(
  conversationId: string,
): Promise<AbandonConversationResponse> {
  const { data } = await apiClient.post<AbandonConversationResponse>(
    `/chat/conversations/${conversationId}/abandon`,
  );
  return data;
}

export async function deleteConversation(
  conversationId: string,
): Promise<{ deleted: boolean }> {
  const { data } = await apiClient.delete<{ deleted: boolean }>(
    `/chat/conversations/${conversationId}`,
  );
  return data;
}
