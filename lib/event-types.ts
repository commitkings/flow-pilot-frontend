/* ──────────────────────────────────────────────────────────────
   event-types.ts — TypeScript types for SSE run events
   ────────────────────────────────────────────────────────────── */

// ── Event type enum ───────────────────────────────────────────

export type RunEventType =
  | "run_started"
  | "step_started"
  | "step_progress"
  | "step_completed"
  | "step_failed"
  | "reasoning"
  | "approval_gate"
  | "run_completed"
  | "run_failed";

// ── Per-type payloads ─────────────────────────────────────────

export interface RunStartedPayload {
  objective: string;
}

export interface StepStartedPayload {
  step_name: string;
  agent_type: string;
  description: string;
}

export interface StepProgressPayload {
  agent_type: string;
  message: string;
  detail?: Record<string, unknown>;
}

export interface StepCompletedPayload {
  step_name: string;
  agent_type: string;
  duration_ms: number;
  summary: string;
}

export interface StepFailedPayload {
  step_name: string;
  agent_type: string;
  error: string;
  duration_ms: number;
}

export interface ReasoningPayload {
  agent_type: string;
  thinking: string;
  prompt_summary?: string;
  token_usage?: {
    model: string;
    prompt_tokens: number;
    completion_tokens: number;
    duration_ms: number;
  };
}

export interface ApprovalGatePayload {
  candidates_count: number;
  message: string;
}

export interface RunCompletedPayload {
  summary: string;
}

export interface RunFailedPayload {
  error: string;
}

// ── Unified event envelope ────────────────────────────────────

export type RunEventPayload =
  | RunStartedPayload
  | StepStartedPayload
  | StepProgressPayload
  | StepCompletedPayload
  | StepFailedPayload
  | ReasoningPayload
  | ApprovalGatePayload
  | RunCompletedPayload
  | RunFailedPayload;

export interface RunEvent {
  seq: number;
  type: RunEventType;
  step_id: string | null;
  payload: RunEventPayload;
  emitted_at: string | null;
}

// ── Step summary/detail (from REST endpoints) ─────────────────

export interface StepSummary {
  id: string;
  agent_type: string;
  step_order: number;
  description: string | null;
  status: string;
  progress_pct: number | null;
  duration_ms: number | null;
  started_at: string | null;
  completed_at: string | null;
  output_summary: Record<string, unknown> | null;
  error_message: string | null;
}

export interface StepDetail extends StepSummary {
  input_data: Record<string, unknown> | null;
  output_data: Record<string, unknown> | null;
  audit_entries: Array<{
    id: string;
    action: string;
    detail: Record<string, unknown>;
    created_at: string | null;
  }>;
}

// ── Helpers ───────────────────────────────────────────────────

export const TERMINAL_EVENT_TYPES: ReadonlySet<RunEventType> = new Set([
  "run_completed",
  "run_failed",
]);

export const LIVE_RUN_STATUSES: ReadonlySet<string> = new Set([
  "planning",
  "reconciling",
  "scoring",
  "executing",
]);

/** Agent type display labels */
export const AGENT_LABELS: Record<string, string> = {
  planner: "Planner",
  reconciliation: "Reconciliation",
  risk: "Risk Scoring",
  execution: "Execution",
  audit: "Audit",
};

/** Agent badge colors (Tailwind classes) */
export const AGENT_COLORS: Record<string, { bg: string; text: string }> = {
  planner: { bg: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-700 dark:text-blue-300" },
  reconciliation: { bg: "bg-violet-100 dark:bg-violet-900/30", text: "text-violet-700 dark:text-violet-300" },
  risk: { bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-700 dark:text-amber-300" },
  execution: { bg: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-700 dark:text-emerald-300" },
  audit: { bg: "bg-slate-100 dark:bg-slate-900/30", text: "text-slate-700 dark:text-slate-300" },
};
