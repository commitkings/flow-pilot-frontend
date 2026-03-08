"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { createRun } from "@/lib/api-client";
import { ApiError, type CreateRunPayload } from "@/lib/api-types";

export function useCreateRun(onSuccess: (runId: string) => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateRunPayload) => createRun(payload),
    onSuccess: (run) => {
      queryClient.invalidateQueries({ queryKey: ["runs"] });
      onSuccess(run.run_id);
    },
    onError: (err) => {
      const message =
        err instanceof ApiError ? err.message : "Failed to create run. Please try again.";
      toast.error(message);
    },
  });
}

