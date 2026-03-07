"use client";

import { useQuery } from "@tanstack/react-query";
import { listRuns, getRun, adaptRun } from "@/lib/api-client";

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
