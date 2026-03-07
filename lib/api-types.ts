/* ──────────────────────────────────────────────────────────────
   api-types.ts — TypeScript interfaces matching FlowPilot backend
   ────────────────────────────────────────────────────────────── */

// ── Auth / User ──────────────────────────────────────────────

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    display_name: string;
  };
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
  is_active: boolean;
  last_login_at: string | null;
  memberships: Membership[];
  has_completed_onboarding: boolean;
}

// ── Onboarding ───────────────────────────────────────────────

export interface OnboardingPayload {
  business_name: string;
  business_type?: string;
  monthly_txn_volume_range?: string;
  avg_monthly_payouts_range?: string;
  primary_bank?: string;
  primary_use_cases?: string[];
  risk_appetite?: "conservative" | "moderate" | "aggressive";
}

export interface OnboardingBusiness {
  id: string;
  business_name: string;
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
  | "failed"
  | "cancelled";

export interface PlanStep {
  step_id: string;
  agent_type: string;
  order: number;
  description: string;
  status: string;
}

export interface ApiRunRecord {
  run_id: string;
  objective: string;
  status: ApiRunStatus;
  created_at: string;
  current_step?: string | null;
  candidate_count?: number;
  // Detail-only fields (absent in list response)
  plan_steps?: PlanStep[];
  candidates?: Candidate[];
  error?: string | null;
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
  amount: number;
  currency?: string;
  purpose?: string;
}

export interface CreateRunPayload {
  business_id: string;
  objective: string;
  created_by?: string;
  constraints?: string;
  risk_tolerance?: number;
  budget_cap?: number;
  merchant_id?: string;
  candidates?: CandidateInput[];
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
  amount: number;
  currency: string;
  purpose: string | null;
  risk_score: number;
  risk_reasons: string[];
  risk_decision: string;
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
  report?: {
    summary: string;
    risk_overview?: Record<string, unknown>;
    execution_results?: Record<string, unknown>;
  };
  audit_trail?: AuditEntry[];
  entries?: AuditEntry[];
}

// ── Institutions ─────────────────────────────────────────────

export interface Institution {
  institutionCode: string;
  institutionName: string;
  isActive: boolean;
  lastSyncedAt: string | null;
}

export interface InstitutionsResponse {
  count: number;
  source: string;
  data: Institution[];
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
