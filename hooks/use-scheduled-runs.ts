"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  listScheduledRuns,
  createScheduledRun,
  toggleScheduledRun,
  deleteScheduledRun,
  type CreateScheduledRunPayload,
} from "@/lib/api-scheduled-runs";

const QUERY_KEY = ["scheduled-runs"] as const;

export function useScheduledRuns() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: listScheduledRuns,
    staleTime: 30_000,
    retry: false,
  });
}

export function useCreateScheduledRun() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateScheduledRunPayload) =>
      createScheduledRun(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success("Scheduled run created successfully.");
    },
    onError: () => {
      toast.error("Failed to create scheduled run. Please try again.");
    },
  });
}

export function useToggleScheduledRun() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      toggleScheduledRun(id, is_active),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      const label =
        data.is_active
          ? "Scheduled run activated."
          : data.run_type === "one_time"
            ? "One-time run cancelled."
            : "Scheduled run paused.";
      toast.success(label);
    },
    onError: () => {
      toast.error("Failed to update scheduled run. Please try again.");
    },
  });
}

export function useDeleteScheduledRun() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteScheduledRun(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success("Scheduled run deleted.");
    },
    onError: () => {
      toast.error("Failed to delete scheduled run. Please try again.");
    },
  });
}
