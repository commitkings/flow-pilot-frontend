"use client";

import { useQuery } from "@tanstack/react-query";
import { listCandidates, adaptCandidate } from "@/lib/api-client";

export function useCandidates(runId: string, approvalStatus?: string) {
  return useQuery({
    queryKey: ["run-candidates", runId, approvalStatus],
    queryFn: () =>
      listCandidates(runId, approvalStatus).then((res) =>
        res.candidates.map(adaptCandidate)
      ),
    enabled: !!runId,
  });
}
