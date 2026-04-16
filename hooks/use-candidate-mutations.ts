"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  approveCandidates,
  assignApprover,
  rejectCandidates,
  updateCandidate,
} from "@/lib/api-client";
import type { UpdateCandidatePayload, AssignApproverResponse } from "@/lib/api-client";
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

export function useUpdateCandidate(runId: string, onSuccess?: () => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      candidateId,
      payload,
    }: {
      candidateId: string;
      payload: UpdateCandidatePayload;
    }) => updateCandidate(runId, candidateId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["run-candidates", runId] });
      toast.success("Candidate updated.");
      onSuccess?.();
    },
    onError: (err) => {
      const message =
        err instanceof ApiError ? err.message : "Failed to update candidate. Please try again.";
      toast.error(message);
    },
  });
}

export function useAssignApprover(runId: string, onSuccess?: (data: AssignApproverResponse) => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => assignApprover(runId, userId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["run", runId] });
      toast.success(`Approver assigned to ${data.assigned_to_name}.`);
      onSuccess?.(data);
    },
    onError: (err) => {
      const message =
        err instanceof ApiError ? err.message : "Failed to assign approver. Please try again.";
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
