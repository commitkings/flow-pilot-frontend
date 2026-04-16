"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getApprovalPinStatus,
  setupApprovalPin,
  verifyApprovalPin,
  removeApprovalPin,
} from "@/lib/api-client";
import { ApiError } from "@/lib/api-types";

export function useApprovalPinStatus() {
  return useQuery({
    queryKey: ["approval-pin-status"],
    queryFn: getApprovalPinStatus,
    staleTime: 60_000,
  });
}

export function useSetupApprovalPin(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (pin: string) => setupApprovalPin(pin),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["approval-pin-status"] });
      toast.success("Approval PIN set successfully.");
      onSuccess?.();
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : "Failed to set PIN.");
    },
  });
}

export function useVerifyApprovalPin(onSuccess?: () => void, onError?: () => void) {
  return useMutation({
    mutationFn: (pin: string) => verifyApprovalPin(pin),
    onSuccess: () => onSuccess?.(),
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : "Incorrect PIN.");
      onError?.();
    },
  });
}

export function useRemoveApprovalPin(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => removeApprovalPin(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["approval-pin-status"] });
      toast.success("Approval PIN removed.");
      onSuccess?.();
    },
    onError: (err) => {
      toast.error(err instanceof ApiError ? err.message : "Failed to remove PIN.");
    },
  });
}
