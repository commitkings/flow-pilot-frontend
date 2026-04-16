/**
 * api-developer.ts — FlowPilot Developer API endpoints
 *
 * Covers: Webhooks, API Keys, and Org Approval Rules.
 * All HTTP calls go through the shared Axios instance in lib/axios.ts.
 */

import apiClient from "./axios";

// ── Webhooks ──────────────────────────────────────────────────────────────────

export interface Webhook {
  id: string;
  url: string;
  events: string[];
  is_active: boolean;
  secret: string | null;   // only present on creation, null when listing
  created_at: string;
  last_triggered_at: string | null;
  failure_count: number;
}

export interface CreateWebhookResponse extends Webhook {
  /** True if the test ping to the endpoint succeeded. is_active mirrors this. */
  verified: boolean;
  /** Set when verified=false, explaining why the webhook is inactive. */
  verification_message?: string;
}

export type CreateWebhookPayload = {
  url: string;
  events: string[];
};

export function listWebhooks(): Promise<{ webhooks: Webhook[] }> {
  return apiClient.get<{ webhooks: Webhook[] }>("/developer/webhooks").then((r) => r.data);
}

export function createWebhook(payload: CreateWebhookPayload): Promise<CreateWebhookResponse> {
  return apiClient.post<CreateWebhookResponse>("/developer/webhooks", payload).then((r) => r.data);
}

export function deleteWebhook(id: string): Promise<{ status: string }> {
  return apiClient.delete<{ status: string }>(`/developer/webhooks/${id}`).then((r) => r.data);
}

export function toggleWebhook(id: string, is_active: boolean): Promise<Webhook> {
  return apiClient.patch<Webhook>(`/developer/webhooks/${id}`, { is_active }).then((r) => r.data);
}

export interface WebhookDelivery {
  id: string;
  webhook_id: string;
  event_name: string;
  delivery_id: string;
  status_code: number | null;
  success: boolean;
  error_message: string | null;
  delivered_at: string;
}

export interface WebhookDeliveriesResponse {
  deliveries: WebhookDelivery[];
  total: number;
}

export function listWebhookDeliveries(webhookId: string): Promise<WebhookDeliveriesResponse> {
  return apiClient.get<WebhookDeliveriesResponse>(`/developer/webhooks/${webhookId}/deliveries`).then((r) => r.data);
}

export function updateWebhook(id: string, payload: { url?: string; events?: string[]; is_active?: boolean }): Promise<Webhook> {
  return apiClient.patch<Webhook>(`/developer/webhooks/${id}`, payload).then((r) => r.data);
}

// ── API Keys ──────────────────────────────────────────────────────────────────

export interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  scopes: string[];
  created_at: string;
  last_used_at: string | null;
  expires_at: string | null;
}

export interface CreateApiKeyResponse extends ApiKey {
  raw_key: string;
}

export type CreateApiKeyPayload = {
  name: string;
  scopes: string[];
  expires_in_days?: number;
};

export function listApiKeys(): Promise<{ keys: ApiKey[] }> {
  return apiClient.get<{ keys: ApiKey[] }>("/developer/api-keys").then((r) => r.data);
}

export function createApiKey(payload: CreateApiKeyPayload): Promise<CreateApiKeyResponse> {
  return apiClient.post<CreateApiKeyResponse>("/developer/api-keys", payload).then((r) => r.data);
}

export function revokeApiKey(id: string): Promise<{ status: string }> {
  return apiClient.delete<{ status: string }>(`/developer/api-keys/${id}`).then((r) => r.data);
}

export function requestApiKeyReveal(keyId: string): Promise<{ sent: boolean }> {
  return apiClient
    .post<{ sent: boolean }>(`/developer/api-keys/${keyId}/request-reveal`)
    .then((r) => r.data);
}

export function verifyApiKeyRevealOtp(keyId: string, otp: string): Promise<{ raw_key: string }> {
  return apiClient
    .post<{ raw_key: string }>(`/developer/api-keys/${keyId}/verify-reveal-otp`, { otp })
    .then((r) => r.data);
}

// ── Approval Rules ────────────────────────────────────────────────────────────

export interface ApprovalRule {
  id: string;
  name: string;
  condition: "amount_above" | "risk_score_above" | "always";
  threshold: number;
  required_approvers: number;
  approver_roles: string[];
  is_active: boolean;
}

export type CreateApprovalRulePayload = Omit<ApprovalRule, "id">;

export function listApprovalRules(): Promise<{ rules: ApprovalRule[] }> {
  return apiClient.get<{ rules: ApprovalRule[] }>("/org/approval-rules").then((r) => r.data);
}

export function createApprovalRule(payload: CreateApprovalRulePayload): Promise<ApprovalRule> {
  return apiClient.post<ApprovalRule>("/org/approval-rules", payload).then((r) => r.data);
}

export function updateApprovalRule(
  id: string,
  payload: Partial<ApprovalRule>
): Promise<ApprovalRule> {
  return apiClient.patch<ApprovalRule>(`/org/approval-rules/${id}`, payload).then((r) => r.data);
}

export function deleteApprovalRule(id: string): Promise<{ status: string }> {
  return apiClient.delete<{ status: string }>(`/org/approval-rules/${id}`).then((r) => r.data);
}
