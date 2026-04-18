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
  MfaRequiredResponse,
  TwoFASetupResponse,
  TwoFAStatus,
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
  DashboardStats,
  InstitutionsResponse,
  InviteMemberPayload,
  NotificationsResponse,
  OnboardingPayload,
  OnboardingResponse,
  OrgProfile,
  RunStatusResponse,
  TeamMembersResponse,
  TransactionsResponse,
  NotificationPreferences,
  UploadCandidatesResponse,
  User,
} from "./api-types";
import type { StepSummary, StepDetail } from "./event-types";

// ── 1. Auth ──────────────────────────────────────────────────────────────────

/** URL to redirect the browser to for Google OAuth (no HTTP call needed) */
export function googleLoginUrl(): string {
  return `/api/proxy/auth/google/login`;
}

export function register(name: string, email: string, password: string): Promise<AuthResponse> {
  return apiClient.post<AuthResponse>("/auth/register", { name, email, password }).then((r) => r.data);
}

export function login(email: string, password: string): Promise<AuthResponse | MfaRequiredResponse> {
  return apiClient.post<AuthResponse | MfaRequiredResponse>("/auth/login", { email, password }).then((r) => r.data);
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

export function verifyEmail(code: string): Promise<{ message: string }> {
  return apiClient.post<{ message: string }>("/auth/verify-email", { code }).then((r) => r.data);
}

export function resendVerification(): Promise<{ message: string }> {
  return apiClient.post<{ message: string }>("/auth/resend-verification").then((r) => r.data);
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
  const base = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api/v1";
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

export interface UpdateCandidatePayload {
  amount?: number;
  beneficiary_name?: string;
  account_number?: string;
  institution_code?: string;
}

export function updateCandidate(
  runId: string,
  candidateId: string,
  payload: UpdateCandidatePayload,
): Promise<import("./api-types").Candidate> {
  return apiClient
    .patch<import("./api-types").Candidate>(`/runs/${runId}/candidates/${candidateId}`, payload)
    .then((r) => r.data);
}

export interface AssignApproverResponse {
  run_id: string;
  assigned_to_id: string;
  assigned_to_name: string;
  assigned_to_email: string;
}

export function assignApprover(runId: string, userId: string): Promise<AssignApproverResponse> {
  return apiClient
    .patch<AssignApproverResponse>(`/runs/${runId}/assign-approver`, { user_id: userId })
    .then((r) => r.data);
}

export function nudgeApprover(runId: string): Promise<{ ok: boolean; nudged_user: string }> {
  return apiClient.post(`/runs/${runId}/nudge`).then((r) => r.data);
}

export interface RerunPayload {
  objective: string;
  constraints?: string;
  date_from?: string;
  date_to?: string;
  risk_tolerance?: number;
  budget_cap?: number;
}

export function rerunPayout(runId: string, payload: RerunPayload): Promise<unknown> {
  return apiClient.post(`/runs/${runId}/rerun`, payload).then((r) => r.data);
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

export interface InstitutionFilters {
  search?: string;
  institution_type?: string;
  limit?: number;
  offset?: number;
}

export function listInstitutions(filters: InstitutionFilters = {}): Promise<InstitutionsResponse> {
  return apiClient.get<InstitutionsResponse>("/institutions", { params: filters }).then((r) => {
    const raw = r.data;
    return {
      ...raw,
      data: raw.data.map((inst) => ({
        ...inst,
        // API returns snake_case is_active; normalize to camelCase
        isActive: (inst as unknown as Record<string, unknown>).is_active as boolean ?? inst.isActive ?? false,
      })),
    };
  });
}

// ── 8. Transactions ──────────────────────────────────────────────────────────

export interface TransactionFilters {
  run_id?: string;
  status?: string;
  channel?: string;
  search?: string;
  from_date?: string;
  to_date?: string;
  include_payouts?: boolean;
  limit?: number;
  offset?: number;
}

export function listTransactions(filters: TransactionFilters = {}): Promise<TransactionsResponse> {
  return apiClient
    .get<TransactionsResponse>("/transactions", { params: filters })
    .then((r) => r.data);
}

export function exportTransactionsEmail(
  email: string,
  rows: import("./api-types").TransactionRow[],
  format: "csv" | "pdf" = "csv",
  pdfBase64?: string,
): Promise<{ message: string }> {
  return apiClient
    .post<{ message: string }>("/transactions/export-email", {
      email,
      rows,
      format,
      pdf_base64: pdfBase64 ?? null,
    })
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

export function exportAuditEmail(
  email: string,
  entries: import("./api-types").AuditEntry[],
  format: "csv" | "pdf" = "csv",
  pdfBase64?: string,
): Promise<{ message: string }> {
  return apiClient
    .post<{ message: string }>("/audit/export-email", {
      email,
      entries,
      format,
      pdf_base64: pdfBase64 ?? null,
    })
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

export function deleteMemberUser(memberId: string): Promise<{ status: string; message: string }> {
  return apiClient.delete<{ status: string; message: string }>(`/team/members/${memberId}/delete-user`).then((r) => r.data);
}

export function toggleMemberStatus(memberId: string, isActive: boolean): Promise<{ status: string; member: import("./api-types").TeamMember }> {
  return apiClient.patch(`/team/members/${memberId}/status`, { is_active: isActive }).then((r) => r.data);
}

export function revokeInvitation(inviteId: string): Promise<{ status: string }> {
  return apiClient.delete<{ status: string }>(`/team/invitations/${inviteId}`).then((r) => r.data);
}

export function resendInvitation(inviteId: string): Promise<{ status: string; invited_email: string }> {
  return apiClient.post<{ status: string; invited_email: string }>(`/team/invitations/${inviteId}/resend`, {}).then((r) => r.data);
}

export interface BulkImportResult {
  summary: { added: number; invited: number; skipped: number; failed: number; total: number };
  results: Array<{ line: number; email: string; status: string; role?: string; reason?: string }>;
}

export function importTeamMembers(file: File): Promise<BulkImportResult> {
  const fd = new FormData();
  fd.append("file", file);
  return apiClient
    .post<BulkImportResult>("/team/import", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((r) => r.data);
}

export function getTeamImportTemplateUrl(): string {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api/v1";
  return `${base}/team/import/template`;
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

export interface ActiveSessionsResponse {
  active_count: number;
  total_members: number;
  members: {
    user_id: string;
    display_name: string;
    email: string;
    role: string;
    is_online: boolean;
  }[];
}

export function getActiveSessions(): Promise<ActiveSessionsResponse> {
  return apiClient.get<ActiveSessionsResponse>("/org/sessions").then((r) => r.data);
}

export function uploadOrgLogo(file: File): Promise<{ logo_url: string }> {
  const fd = new FormData();
  fd.append("file", file);
  return apiClient
    .post<{ logo_url: string }>("/org/logo", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((r) => r.data);
}

// ── KYC ──────────────────────────────────────────────────────────────────────

export function getKycStatus(): Promise<import("./api-types").KycStatusResponse> {
  return apiClient.get("/kyc/status").then((r) => r.data);
}

export function submitKyc(formData: FormData): Promise<{ status: string; message: string; submitted_docs: string[] }> {
  return apiClient
    .post("/kyc/submit", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((r) => r.data);
}

export function submitIndividualKycLevel1(payload: { id_type: "nin" | "bvn"; id_value: string }): Promise<{ status: string; message: string }> {
  const fd = new FormData();
  fd.append("id_type", payload.id_type);
  fd.append("id_value", payload.id_value);
  return apiClient.post("/kyc/individual/level1", fd, { headers: { "Content-Type": "multipart/form-data" } }).then((r) => r.data);
}

export function submitIndividualKycLevel2(payload: { address: string; proof_of_address?: File }): Promise<{ status: string; message: string }> {
  const fd = new FormData();
  fd.append("address", payload.address);
  if (payload.proof_of_address) fd.append("proof_of_address", payload.proof_of_address);
  return apiClient.post("/kyc/individual/level2", fd, { headers: { "Content-Type": "multipart/form-data" } }).then((r) => r.data);
}

export function submitIndividualKycLevel3(
  { govId, selfie }: { govId: File; selfie: File }
): Promise<{ status: string; message: string }> {
  const fd = new FormData();
  fd.append("government_id", govId);
  fd.append("liveness_selfie", selfie);
  return apiClient.post("/kyc/individual/level3", fd, { headers: { "Content-Type": "multipart/form-data" } }).then((r) => r.data);
}

// ── 14. Auth (Extended) ──────────────────────────────────────────────────────

export function forgotPassword(email: string): Promise<{ message: string }> {
  return apiClient
    .post<{ message: string }>("/auth/forgot-password", { email })
    .then((r) => r.data);
}

export function resetPassword(
  token: string,
  new_password: string,
): Promise<{ message: string }> {
  return apiClient
    .post<{ message: string }>("/auth/reset-password", { token, new_password })
    .then((r) => r.data);
}

export function getInviteDetails(
  token: string,
): Promise<import("./api-types").InviteDetails> {
  return apiClient
    .get<import("./api-types").InviteDetails>(`/team/invite/${token}`)
    .then((r) => r.data);
}

export function registerViaInvite(
  payload: import("./api-types").RegisterViaInvitePayload,
): Promise<import("./api-types").RegisterViaInviteResponse> {
  return apiClient
    .post<import("./api-types").RegisterViaInviteResponse>("/auth/register-via-invite", payload)
    .then((r) => r.data);
}

export function acceptInviteToken(
  token: string,
): Promise<{ status: string; business_id: string; role: string }> {
  return apiClient
    .post<{ status: string; business_id: string; role: string }>(
      `/team/accept-invite/${token}`,
      {},
    )
    .then((r) => r.data);
}

export function changePassword(currentPassword: string, newPassword: string, totpCode?: string): Promise<{ message: string }> {
  return apiClient
    .post<{ message: string }>("/auth/me/password", {
      current_password: currentPassword,
      new_password: newPassword,
      ...(totpCode ? { totp_code: totpCode } : {}),
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

export function requestDeleteCode(): Promise<{ message: string }> {
  return apiClient.post<{ message: string }>("/account/request-delete-code").then((r) => r.data);
}

export function deleteAccount(params?: { totp_code?: string; delete_code?: string }): Promise<{ status: string; message: string }> {
  return apiClient
    .delete<{ status: string; message: string }>("/account/delete", { data: params ?? {} })
    .then((r) => r.data);
}

export function deleteSelfAccount(params?: { totp_code?: string; delete_code?: string }): Promise<{ status: string; message: string }> {
  return apiClient
    .delete<{ status: string; message: string }>("/account/delete-self", { data: params ?? {} })
    .then((r) => r.data);
}

export function importAccountData(file: File): Promise<{ status: string; restored: string[]; exported_at: string }> {
  const fd = new FormData();
  fd.append("file", file);
  return apiClient
    .post<{ status: string; restored: string[]; exported_at: string }>("/account/import", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then((r) => r.data);
}


export function getNotificationPreferences(): Promise<NotificationPreferences> {
  return apiClient.get<NotificationPreferences>("/account/notification-preferences").then((r) => r.data);
}

export function updateNotificationPreferences(
  prefs: Partial<NotificationPreferences>
): Promise<NotificationPreferences> {
  return apiClient
    .patch<NotificationPreferences>("/account/notification-preferences", prefs)
    .then((r) => r.data);
}

// ── 15. Two-Factor Authentication ────────────────────────────────────────────

export function get2FAStatus(): Promise<TwoFAStatus> {
  return apiClient.get<TwoFAStatus>("/auth/2fa/status").then((r) => r.data);
}

export function setup2FA(): Promise<TwoFASetupResponse> {
  return apiClient.post<TwoFASetupResponse>("/auth/2fa/setup").then((r) => r.data);
}

export function enable2FA(code: string): Promise<{ backup_codes: string[] }> {
  return apiClient.post<{ backup_codes: string[] }>("/auth/2fa/enable", { code }).then((r) => r.data);
}

export function disable2FA(password: string): Promise<{ message: string }> {
  return apiClient.post<{ message: string }>("/auth/2fa/disable", { password }).then((r) => r.data);
}

export function verifyMfa(mfa_token: string, code: string): Promise<AuthResponse> {
  return apiClient.post<AuthResponse>("/auth/2fa/verify", { mfa_token, code }).then((r) => r.data);
}

export function backupCodeLogin(mfa_token: string, backup_code: string): Promise<AuthResponse> {
  return apiClient.post<AuthResponse>("/auth/2fa/backup-login", { mfa_token, backup_code }).then((r) => r.data);
}

export function regenerateBackupCodes(): Promise<{ backup_codes: string[] }> {
  return apiClient.post<{ backup_codes: string[] }>("/auth/2fa/backup-codes/regenerate").then((r) => r.data);
}

export function setOrgRequire2FA(require: boolean): Promise<{ require_2fa: boolean }> {
  return apiClient.patch<{ require_2fa: boolean }>("/auth/2fa/org/require", { require }).then((r) => r.data);
}

// ── 16b. AI Credits ───────────────────────────────────────────────────────────

export interface CreditBalance {
  business_id: string;
  balance: number;
  bundles: { credits: number; price: number }[];
}

export interface CreditPurchasePayload {
  credits: number;
  reference: string;
}

export interface CreditPurchaseResult {
  balance: number;
  credits_added: number;
  amount_charged: number;
  reference: string;
  already_processed: boolean;
}

export interface CreditTransaction {
  id: string;
  type: "purchase" | "debit";
  credits: number;
  description: string | null;
  run_id: string | null;
  created_at: string;
}

export interface CreditTransactionList {
  transactions: CreditTransaction[];
  total: number;
}

export function getCredits(businessId: string): Promise<CreditBalance> {
  return apiClient.get<CreditBalance>("/credits", { params: { business_id: businessId } }).then((r) => r.data);
}

export function purchaseCredits(businessId: string, payload: CreditPurchasePayload): Promise<CreditPurchaseResult> {
  return apiClient.post<CreditPurchaseResult>("/credits/purchase", payload, { params: { business_id: businessId } }).then((r) => r.data);
}

export function listCreditTransactions(businessId: string, limit = 50, offset = 0): Promise<CreditTransactionList> {
  return apiClient.get<CreditTransactionList>("/credits/transactions", { params: { business_id: businessId, limit, offset } }).then((r) => r.data);
}

// ── 17. Dashboard ─────────────────────────────────────────────────────────────

export function getDashboardStats(): Promise<DashboardStats> {
  return apiClient.get<DashboardStats>("/dashboard/stats").then((r) => r.data);
}

// ── 18. Health (unauthenticated) ─────────────────────────────────────────────

export async function fetchHealth(): Promise<{ payout_mode: string; status: string }> {
  const root = (process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api/v1").replace(
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
    slotOverrides ? { overrides: slotOverrides } : {},
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

// ── 19. Saved Recipients ──────────────────────────────────────────────────────

export interface RecipientFilters {
  search?: string;
  limit?: number;
  offset?: number;
}

export function listRecipients(filters: RecipientFilters = {}): Promise<import("./api-types").SavedRecipientListResponse> {
  return apiClient.get("/recipients", { params: filters }).then((r) => r.data);
}

export function createRecipient(payload: import("./api-types").CreateSavedRecipientPayload): Promise<import("./api-types").SavedRecipient> {
  return apiClient.post("/recipients", payload).then((r) => r.data);
}

export function updateRecipient(recipientId: string, payload: import("./api-types").UpdateSavedRecipientPayload): Promise<import("./api-types").SavedRecipient> {
  return apiClient.patch(`/recipients/${recipientId}`, payload).then((r) => r.data);
}

export function deleteRecipient(recipientId: string): Promise<{ status: string }> {
  return apiClient.delete(`/recipients/${recipientId}`).then((r) => r.data);
}

// ── Receipt email ─────────────────────────────────────────────────────────────

export function sendReceiptEmail(
  runId: string,
  email: string,
  candidateId?: string,
): Promise<{ message: string }> {
  return apiClient
    .post<{ message: string }>(`/runs/${runId}/receipt/email`, {
      email,
      candidate_id: candidateId ?? null,
    })
    .then((r) => r.data);
}

// ── 20. Approval PIN ──────────────────────────────────────────────────────────

export function getApprovalPinStatus(): Promise<{ has_pin: boolean }> {
  return apiClient.get<{ has_pin: boolean }>("/auth/approval-pin/status").then((r) => r.data);
}

export function setupApprovalPin(pin: string): Promise<{ message: string }> {
  return apiClient.post<{ message: string }>("/auth/approval-pin/setup", { pin }).then((r) => r.data);
}

export function verifyApprovalPin(pin: string): Promise<{ message: string }> {
  return apiClient.post<{ message: string }>("/auth/approval-pin/verify", { pin }).then((r) => r.data);
}

export function removeApprovalPin(): Promise<{ message: string }> {
  return apiClient.delete<{ message: string }>("/auth/approval-pin/remove").then((r) => r.data);
}

export interface PinResetRequestResult {
  method: "email" | "totp";
  message: string;
}

export function requestApprovalPinReset(): Promise<PinResetRequestResult> {
  return apiClient.post<PinResetRequestResult>("/auth/approval-pin/reset-request").then((r) => r.data);
}

export function confirmApprovalPinReset(code: string, new_pin: string): Promise<{ message: string }> {
  return apiClient.post<{ message: string }>("/auth/approval-pin/reset-confirm", { code, new_pin }).then((r) => r.data);
}

