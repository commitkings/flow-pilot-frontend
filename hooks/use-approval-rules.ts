"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  listApprovalRules,
  createApprovalRule,
  updateApprovalRule,
  deleteApprovalRule,
} from "@/lib/api-developer";
import type { ApprovalRule, CreateApprovalRulePayload } from "@/lib/api-developer";

export function useApprovalRules() {
  return useQuery({
    queryKey: ["approval-rules"],
    queryFn: () => listApprovalRules(),
    staleTime: 30_000,
  });
}

export function useCreateApprovalRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateApprovalRulePayload) => createApprovalRule(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["approval-rules"] });
      toast.success("Approval rule created");
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to create approval rule");
    },
  });
}

export function useUpdateApprovalRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<ApprovalRule> }) =>
      updateApprovalRule(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["approval-rules"] });
      toast.success("Approval rule updated");
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to update approval rule");
    },
  });
}

export function useDeleteApprovalRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteApprovalRule(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["approval-rules"] });
      toast.success("Approval rule deleted");
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to delete approval rule");
    },
  });
}
