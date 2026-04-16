/* ──────────────────────────────────────────────────────────────
   api-types.ts — TypeScript interfaces matching FlowPilot backend
   ────────────────────────────────────────────────────────────── */

// ── Auth / User ──────────────────────────────────────────────

export interface AuthResponse {
  token: string;
  /** When true, the user's org requires 2FA but they haven't set it up yet. */
  requires_2fa_setup?: boolean;
  user: {
    id: string;
    email: string;
    display_name: string;
  };
}

/** Returned by /auth/login when the user has 2FA enabled */
export interface MfaRequiredResponse {
  mfa_required: true;
  mfa_token: string;
}

export interface TwoFAStatus {
  totp_enabled: boolean;
  totp_enabled_at: string | null;
  grace_until: string | null;
  backup_codes_remaining: number;
}

export interface TwoFASetupResponse {
  secret: string;
  qr_code: string; // base64 PNG
  uri: string;
}

export interface Membership {
  business_id: string;
  role: string;
}

export interface User {
  id: string;
  email: string;
  display_name: string;
  avatar_url: string | null;
  first_name: string | null;
  last_name: string | null;
  job_title: string | null;
  phone: string | null;
  timezone: string | null;
  department: string | null;
  /** ISO date YYYY-MM-DD — read-only after registration */
  date_of_birth: string | null;
  is_active: boolean;
  has_taken_tour: boolean;
  email_verified: boolean;
  last_login_at: string | null;
  memberships: Membership[];
  has_completed_onboarding: boolean;
  /** Whether the user has TOTP enabled */
  totp_enabled: boolean;
  /** ISO timestamp deadline set by org enforcement — null if not under a grace period */
  totp_grace_until: string | null;
}

/** Convenience helper — returns the current user's role or null */
export function getUserRole(user: User | null): string | null {
  return user?.memberships?.[0]?.role ?? null;
}

/** Returns true if the user can create runs or approve payouts */
export function canManageRuns(user: User | null): boolean {
  const role = getUserRole(user);
  return role === "owner" || role === "approver";
}

/** Returns true if the user can modify organisation settings */
export function isOwner(user: User | null): boolean {
  return getUserRole(user) === "owner";
}

// ── Dashboard ─────────────────────────────────────────────────

export interface DashboardRecentRun {
  run_id: string;
  objective: string;
  status: string;
  candidate_count: number | null;
  created_at: string | null;
}

export interface DashboardStats {
  total_volume_disbursed: number;
  runs_this_month: number;
  pending_approvals: number;
  active_runs: number;
  total_runs: number;
  completed_runs: number;
  failed_runs: number;
  success_rate: number;
  recent_runs: DashboardRecentRun[];
}

// ── Onboarding ───────────────────────────────────────────────

export type AccountType = "individual" | "business";

export interface KycLimitInfo {
  account_type: AccountType;
  kyc_level: number;
  monthly_limit: number;
  single_limit: number;
  wallet_limit: number;
  at_max_level: boolean;
  support_email: string;
}

export interface IndividualKycSubmission {
  level_1_type: "nin" | "bvn" | null;
  level_1_status: "not_submitted" | "pending" | "verified" | "rejected";
  level_1_submitted_at: string | null;
  level_1_verified_at: string | null;
  level_2_address: string | null;
  level_2_status: "not_submitted" | "pending" | "verified" | "rejected";
  level_2_document_url: string | null;
  level_2_submitted_at: string | null;
  level_2_verified_at: string | null;
  level_3_status: "not_submitted" | "pending" | "verified" | "rejected";
  level_3_document_url: string | null;
  level_3_submitted_at: string | null;
  level_3_verified_at: string | null;
}

export interface OnboardingPayload {
  business_name: string;
  /** "individual" or "business" — determines KYC flow and team visibility */
  account_type?: AccountType;
  /** ISO date YYYY-MM-DD — required, must be 18+ */
  date_of_birth?: string;
  business_type?: string;
  monthly_txn_volume_range?: string;
  avg_monthly_payouts_range?: string;
  primary_bank?: string;
  primary_use_cases?: string[];
  risk_appetite?: "conservative" | "moderate" | "aggressive";
  // Step 3 financial setup
  interswitch_merchant_id?: string;
  merchant_state?: string;
  daily_payout_limit?: number;
  single_payout_cap?: number;
  risk_alert_threshold?: number;
  liquidity_alert_buffer?: number;
}

export interface OnboardingBusiness {
  id: string;
  business_name: string;
  account_type: AccountType;
  business_type: string;
}

export interface OnboardingConfig {
  onboarding_step: string;
  onboarding_completed_at: string;
  monthly_txn_volume_range: string | null;
  avg_monthly_payouts_range: string | null;
  primary_bank: string | null;
  primary_use_cases: string[] | null;
  risk_appetite: string | null;
}

export interface OnboardingMembership {
  business_id: string;
  user_id: string;
  role: string;
}

export interface OnboardingResponse {
  business: OnboardingBusiness;
  config: OnboardingConfig;
  membership: OnboardingMembership;
}

// ── Runs ─────────────────────────────────────────────────────

export type ApiRunStatus =
  | "pending"
  | "planning"
  | "reconciling"
  | "scoring"
  | "forecasting"
  | "awaiting_approval"
  | "executing"
  | "completed"
  | "completed_with_errors"
  | "failed"
  | "cancelled";

export interface PlanStep {
  step_id: string;
  agent_type: string;
  order: number;
  description: string;
  status: string;
}

export interface AssignedTo {
  id: string;
  name: string;
  email: string;
}

export interface ApiRunRecord {
  run_id: string;
  objective: string;
  status: ApiRunStatus;
  created_at: string;
  risk_tolerance?: number | null;
  budget_cap?: number | null;
  assigned_to_id?: string | null;
  assigned_to?: AssignedTo | null;
  created_by?: string | null;
  created_by_user?: AssignedTo | null;
  approved_by?: string | null;
  approved_by_user?: AssignedTo | null;
  approved_at?: string | null;
  current_step?: string | null;
  candidate_count?: number;
  // Detail-only fields (absent in list response)
  plan_steps?: PlanStep[];
  candidates?: Candidate[];
  error?: string | null;
  // Monetization
  platform_fee_rate?: number | null;
  platform_fee_amount?: number | null;
}

export interface RunStatusResponse {
  run_id: string;
  status: ApiRunStatus;
  current_step: string;
  error: string | null;
  transactions_count: number;
  candidates_count: number;
  has_audit_report: boolean;
}

export interface CandidateInput {
  institution_code: string;
  beneficiary_name: string;
  account_number: string;
  beneficiary_email?: string | null;
  amount: number;
  currency?: string;
  purpose?: string;
}

export interface CreateRunPayload {
  business_id: string;
  objective: string;
  created_by?: string;
  constraints?: string;
  date_from?: string;
  date_to?: string;
  risk_tolerance?: number;
  budget_cap?: number;
  merchant_id?: string;
  candidates?: CandidateInput[];
  assigned_approver_id?: string;
}

// ── Candidates ───────────────────────────────────────────────

export interface UploadCandidatesResponse {
  run_id: string;
  candidates_added: number;
  parse_errors: string[] | null;
  total_rows_parsed: number;
}

export type CandidateApprovalStatus =
  | "pending"
  | "approved"
  | "rejected";

export interface Candidate {
  id: string;
  run_id: string;
  institution_code: string;
  beneficiary_name: string;
  account_number: string;
  beneficiary_email: string | null;
  amount: number;
  currency: string;
  purpose: string | null;
  risk_score: number | null;
  risk_reasons: string[] | null;
  risk_decision: string | null;
  lookup_status: "pending" | "success" | "failed" | "mismatch";
  lookup_account_name: string | null;
  lookup_match_score: number | null;
  approval_status: CandidateApprovalStatus;
  execution_status: string;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CandidatesResponse {
  run_id: string;
  total: number;
  candidates: Candidate[];
  status: ApiRunStatus;
}

// ── Actions ──────────────────────────────────────────────────

export interface ApproveRejectPayload {
  candidate_ids: string[];
  reason?: string;
}

export interface ApproveResponse {
  run_id: string;
  status: string;
  approved_count: number;
  current_step: string;
}

export interface RejectResponse {
  run_id: string;
  rejected_count: number;
  remaining_approved: number;
}

// ── Audit ────────────────────────────────────────────────────

export interface AuditEntry {
  id: number;
  run_id: string;
  step_id: string | null;
  agent_type: string;
  action: string;
  detail: Record<string, unknown>;
  created_at: string;
}

export interface AuditReport {
  run_id: string;
  report?: Record<string, unknown>;
  audit_trail?: AuditEntry[];
  entries?: AuditEntry[];
}

// ── Institutions ─────────────────────────────────────────────

export interface Institution {
  institutionCode: string;
  institutionName: string;
  shortName?: string | null;
  nipCode?: string | null;
  cbnCode?: string | null;
  institutionType?: string | null;
  isActive: boolean;
  lastSyncedAt: string | null;
}

export interface InstitutionsResponse {
  total: number;
  count?: number;
  source?: string;
  limit?: number;
  offset?: number;
  data: Institution[];
}

// ── Transactions ─────────────────────────────────────────────

export interface TransactionRow {
  id: string;
  run_id: string;
  reference: string;
  channel: string;
  amount: number;
  currency: string;
  direction: string;
  status: string;
  narration: string;
  counterparty_name: string;
  counterparty_bank: string;
  date: string | null;
  settlement_date: string | null;
  anomaly: string;
  anomaly_count: number;
  record_type?: "reconciled" | "payout";
}

export interface TransactionSummary {
  total_transactions: number;
  total_volume: number;
  anomaly_count: number;
  failed_count: number;
}

export interface TransactionsResponse {
  transactions: TransactionRow[];
  total: number;
  limit: number;
  offset: number;
  summary: TransactionSummary;
}

// ── Approvals Queue ──────────────────────────────────────────

export interface ApprovalCandidate {
  id: string;
  run_id: string;
  institution_code: string;
  beneficiary_name: string;
  account_number: string;
  amount: number;
  currency: string;
  purpose: string | null;
  risk_score: number | null;
  risk_reasons: string[] | null;
  risk_decision: string | null;
  approval_status: string;
  execution_status: string;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
  run_objective?: string;
  run_status?: string;
}

export interface ApprovalsQueueResponse {
  approvals: ApprovalCandidate[];
  total: number;
  limit: number;
  offset: number;
}

// ── Audit (Global) ───────────────────────────────────────────

export interface AuditListResponse {
  entries: AuditEntry[];
  total: number;
  limit: number;
  offset: number;
}

// ── Notifications ────────────────────────────────────────────

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  resource_type?: string | null;
  resource_id?: string | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export interface NotificationsResponse {
  notifications: Notification[];
  total: number;
  unread_count: number;
  limit: number;
  offset: number;
}

// ── Team ─────────────────────────────────────────────────────

export interface TeamMember {
  id: string;
  user_id: string;
  role: string;
  is_active: boolean;
  is_pending?: boolean;
  joined_at: string | null;
  created_at: string;
  user: {
    display_name: string | null;
    email: string | null;
    avatar_url: string | null;
  } | null;
}

export interface TeamMembersResponse {
  members: TeamMember[];
  total: number;
  limit: number;
  offset: number;
}

export interface InviteMemberPayload {
  email: string;
  role?: string;
}

// ── Org Profile ──────────────────────────────────────────────

export interface OrgProfile {
  id: string;
  business_name: string;
  account_type: AccountType;
  kyc_level: number;
  business_type: string | null;
  rc_number: string | null;
  tax_id: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  website: string | null;
  phone: string | null;
  interswitch_merchant_id: string | null;
  logo_url: string | null;
  kyc_status: "not_submitted" | "pending" | "verified";
  is_active: boolean;
  virtual_account_number: string | null;
  virtual_account_bank: string | null;
  virtual_account_name: string | null;
  config: OrgConfig | null;
}

// ── KYC ──────────────────────────────────────────────────────

export type KycBusinessType =
  | "limited_company"
  | "ngo"
  | "sole_proprietorship"
  | "partnership"
  | "mda";

export interface KycSubmission {
  status: "pending" | "verified" | "rejected";
  business_type: KycBusinessType | null;
  registration_number: string | null;
  tin_number: string | null;
  // LLC / Sole Prop
  director_name: string | null;
  // NGO
  trustee_name: string | null;
  scuml_number: string | null;
  // Partnership
  partner_names: string | null;  // JSON string
  // MDA
  authorized_officer_name: string | null;
  // Timestamps
  submitted_at: string | null;
  verified_at: string | null;
  // Presence flags (backwards compat)
  has_cac_certificate: boolean;
  has_tin_document: boolean;
  has_director_id: boolean;
  has_proof_of_address: boolean;
  // Presigned document URLs (null if not uploaded)
  cac_certificate_url: string | null;
  tin_document_url: string | null;
  proof_of_address_url: string | null;
  director_id_url: string | null;
  trustee_id_url: string | null;
  partner_id_url: string | null;
  scuml_letter_url: string | null;
  mda_letter_url: string | null;
  authorized_officer_id_url: string | null;
}

export interface KycStatusResponse {
  kyc_status: "not_submitted" | "pending" | "verified";
  limit_info: KycLimitInfo | null;
  submission: KycSubmission | null;
  individual_submission?: IndividualKycSubmission | null;
}

export interface OrgConfig {
  monthly_txn_volume_range: string | null;
  avg_monthly_payouts_range: string | null;
  primary_bank: string | null;
  primary_use_cases: string[] | null;
  risk_appetite: string | null;
  default_risk_tolerance: number | null;
  default_budget_cap: number | null;
  // Financial setup
  merchant_state: string | null;
  daily_payout_limit: number | null;
  single_payout_cap: number | null;
  risk_alert_threshold: number | null;
  liquidity_alert_buffer: number | null;
  preferences: Record<string, unknown> | null;
  require_2fa: boolean;
}

// ── Connections ──────────────────────────────────────────────

export interface ConnectionStatus {
  provider: string;
  connected: boolean;
  email: string | null;
}

export interface ConnectionsResponse {
  connections: ConnectionStatus[];
}

// ── Chat / Conversations ─────────────────────────────────────

export interface ChatSendRequest {
  message: string;
  conversation_id?: string;
  business_id: string;
}

export interface ChatSendResponse {
  conversation_id: string;
  response: string;
  intent: string;
  confidence: number;
  extracted_slots: Record<string, unknown>;
  merged_slots: Record<string, unknown>;
  should_confirm: boolean;
  conversation_status: "gathering" | "confirming" | "executing" | "completed" | "abandoned";
  run_config: CreateRunPayload | null;
  run_created: boolean;
  run_id: string | null;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  intent: string | null;
  confidence: number | null;
  extracted_slots: Record<string, unknown> | null;
  created_at: string;
}

export interface ConversationSummary {
  id: string;
  title: string | null;
  status: "gathering" | "confirming" | "awaiting_approval" | "executing" | "completed" | "abandoned";
  current_intent: string | null;
  message_count: number;
  created_at: string;
  updated_at: string;
}

export interface ConversationDetail extends ConversationSummary {
  extracted_slots: Record<string, unknown>;
  resolved_run_config: CreateRunPayload | null;
  run_id: string | null;
  messages: ChatMessage[];
}

export interface ConversationsListResponse {
  conversations: ConversationSummary[];
  total: number;
  limit: number;
  offset: number;
}

export interface ConfirmRunRequest {
  slot_overrides?: Record<string, unknown>;
}

export interface ConfirmRunResponse {
  conversation_id: string;
  run_id: string;
  status: string;
  objective: string;
}

export interface AbandonConversationResponse {
  conversation_id: string;
  status: string;
}

// ── Invitations ──────────────────────────────────────────────

export interface InviteDetails {
  status: "pending" | "accepted" | "expired";
  business_name: string | null;
  invited_email: string;
  role: string;
  inviter_name: string | null;
  expires_at?: string;
}

export interface RegisterViaInvitePayload {
  token: string;
  first_name: string;
  last_name: string;
  password: string;
  date_of_birth?: string;
}

export interface RegisterViaInviteResponse extends AuthResponse {
  /** When true, the user must complete 2FA setup before using the app. */
  requires_2fa_setup: boolean;
}

export interface InviteResult {
  status: "added" | "invited";
  /** Present when status === "added" */
  member?: TeamMember;
  /** Present when status === "invited" */
  invite_id?: string;
  invited_email?: string;
}

// ── Errors ───────────────────────────────────────────────────

export interface ApiErrorBody {
  detail: string;
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: ApiErrorBody,
  ) {
    super(body.detail);
    this.name = "ApiError";
  }
}
