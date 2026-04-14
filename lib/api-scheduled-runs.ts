/**
 * api-scheduled-runs.ts — Scheduled Runs API client
 */

import apiClient from "./axios";

export interface ScheduledRun {
  id: string;
  name: string;
  objective: string;
  cron_expression: string;
  frequency_label: string;
  next_run_at: string | null;
  last_run_at: string | null;
  is_active: boolean;
  created_at: string;
}

export interface CreateScheduledRunPayload {
  name: string;
  objective: string;
  cron_expression: string;
  frequency_label: string;
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
