"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { listRuns, getRun, getRunReport, getRunSteps } from "@/lib/api-client";
import { adaptRun } from "@/utils/useHelper";
import type { RunEvent } from "@/lib/event-types";
import { LIVE_RUN_STATUSES } from "@/lib/event-types";

const ACTIVE_STATUSES = new Set(["planning", "running", "executing", "awaiting_approval"]);

export function useRuns() {
  return useQuery({
    queryKey: ["runs"],
    queryFn: () => listRuns().then((runs) => runs.map(adaptRun)),
    refetchInterval: (query) => {
      const runs = query.state.data;
      if (runs?.some((r) => ACTIVE_STATUSES.has(r.status))) return 5000;
      return false;
    },
  });
}

export function useRun(id: string) {
  return useQuery({
    queryKey: ["run", id],
    queryFn: () => getRun(id).then(adaptRun),
    enabled: !!id,
  });
}

export function useRunReport(id: string, enabled: boolean) {
  return useQuery({
    queryKey: ["run-report", id],
    queryFn: () => getRunReport(id),
    enabled: !!id && enabled,
  });
}

export function useRunSteps(runId: string, runStatus?: string) {
  const isActive = LIVE_RUN_STATUSES.has(runStatus ?? "");
  return useQuery({
    queryKey: ["run-steps", runId],
    queryFn: () => getRunSteps(runId).then((r) => r.steps),
    enabled: !!runId,
    refetchInterval: isActive ? 5000 : false,
  });
}

export function useInvalidateRunQueries(runId: string) {
  const qc = useQueryClient();
  return useCallback(
    (event: RunEvent) => {
      const statusChangingTypes = new Set([
        "run_completed",
        "run_failed",
        "step_completed",
        "step_failed",
        "approval_gate",
      ]);
      if (statusChangingTypes.has(event.type)) {
        qc.invalidateQueries({ queryKey: ["run", runId] });
        qc.invalidateQueries({ queryKey: ["run-steps", runId] });
      }
      if (event.type === "run_completed" || event.type === "run_failed") {
        qc.invalidateQueries({ queryKey: ["runs"] });
        qc.invalidateQueries({ queryKey: ["run-report", runId] });
      }
    },
    [qc, runId],
  );
}
