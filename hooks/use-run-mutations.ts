"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createRun, rerunPayout } from "@/lib/api-client";
import type { RerunPayload } from "@/lib/api-client";
import { ApiError, type CreateRunPayload } from "@/lib/api-types";

export function useCreateRun(onSuccess: (runId: string) => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateRunPayload) => createRun(payload),
    onSuccess: (run) => {
      queryClient.invalidateQueries({ queryKey: ["runs"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      onSuccess(run.run_id);
    },
    onError: (err) => {
      const message =
        err instanceof ApiError ? err.message : "Failed to create run. Please try again.";
      toast.error(message);
    },
  });
}

export function useRerunPayout(runId: string, onSuccess?: () => void) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: RerunPayload) => rerunPayout(runId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["run", runId] });
      queryClient.invalidateQueries({ queryKey: ["run-candidates", runId] });
      queryClient.invalidateQueries({ queryKey: ["runs"] });
      toast.success("Payout updated and resubmitted for analysis.");
      onSuccess?.();
    },
    onError: (err) => {
      const message =
        err instanceof ApiError ? err.message : "Failed to rerun payout. Please try again.";
      toast.error(message);
    },
  });
}

