"use client";

import { useQuery } from "@tanstack/react-query";
import { listRuns, getRun, getRunReport } from "@/lib/api-client";
import { adaptRun } from "@/utils/useHelper";

export function useRuns() {
  return useQuery({
    queryKey: ["runs"],
    queryFn: () => listRuns().then((runs) => runs.map(adaptRun)),
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
