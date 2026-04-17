/**
 * api-scheduled-runs.ts — Scheduled Runs API client
 */

import apiClient from "./axios";
import type { CandidateInput } from "./api-types";

export type ScheduledRunType = "recurring" | "one_time";

export interface ScheduledRun {
  id: string;
  name: string;
  objective: string;
  run_type: ScheduledRunType;
  cron_expression: string | null;
  frequency_label: string;
  next_run_at: string | null;
  last_run_at: string | null;
  last_reminded_at: string | null;
  is_active: boolean;
  created_at: string;
}

export interface CreateScheduledRunPayload {
  name: string;
  objective: string;
  run_type: ScheduledRunType;
  /** Required for recurring runs */
  cron_expression?: string;
  frequency_label: string;
  /** Required for one_time runs — ISO 8601 UTC string */
  run_at?: string;
  /** Full payout run fields */
  business_id?: string;
  date_from?: string;
  date_to?: string;
  risk_tolerance?: number;
  budget_cap?: number;
  assigned_approver_id?: string;
  candidates?: CandidateInput[];
}

export function listScheduledRuns(): Promise<ScheduledRun[]> {
  return apiClient
    .get<{ scheduled_runs: ScheduledRun[] }>("/runs/scheduled")
    .then((r) => r.data.scheduled_runs);
}

export function createScheduledRun(
  payload: CreateScheduledRunPayload,
): Promise<ScheduledRun> {
  return apiClient
    .post<ScheduledRun>("/runs/scheduled", payload)
    .then((r) => r.data);
}

export function toggleScheduledRun(
  id: string,
  is_active: boolean,
): Promise<ScheduledRun> {
  return apiClient
    .patch<ScheduledRun>(`/runs/scheduled/${id}`, { is_active })
    .then((r) => r.data);
}

export function deleteScheduledRun(id: string): Promise<{ status: string }> {
  return apiClient
    .delete<{ status: string }>(`/runs/scheduled/${id}`)
    .then((r) => r.data);
}

export interface UpdateScheduledRunPayload {
  name?: string;
  objective?: string;
  is_active?: boolean;
  cron_expression?: string;
  frequency_label?: string;
  run_at?: string;
}

export function updateScheduledRun(
  id: string,
  payload: UpdateScheduledRunPayload,
): Promise<ScheduledRun> {
  return apiClient
    .patch<ScheduledRun>(`/runs/scheduled/${id}`, payload)
    .then((r) => r.data);
}
