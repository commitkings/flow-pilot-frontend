"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { approveCandidates, rejectCandidates } from "@/lib/api-client";
import { ApiError } from "@/lib/api-types";

export function useApproveCandidates(runId: string, onSuccess?: () => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (candidateIds: string[]) => approveCandidates(runId, candidateIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["run-candidates", runId] });
      queryClient.invalidateQueries({ queryKey: ["run", runId] });
      onSuccess?.();
    },
    onError: (err) => {
      const message =
        err instanceof ApiError ? err.message : "Approval failed. Please try again.";
      toast.error(message);
    },
  });
}

export function useRejectCandidates(runId: string, onSuccess?: () => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      candidateIds,
      reason,
    }: {
      candidateIds: string[];
      reason?: string;
    }) => rejectCandidates(runId, candidateIds, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["run-candidates", runId] });
      queryClient.invalidateQueries({ queryKey: ["run", runId] });
      onSuccess?.();
    },
    onError: (err) => {
      const message =
        err instanceof ApiError ? err.message : "Rejection failed. Please try again.";
      toast.error(message);
    },
  });
}
