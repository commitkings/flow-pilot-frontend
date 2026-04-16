"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  listApiKeys,
  createApiKey,
  revokeApiKey,
  requestApiKeyReveal,
  verifyApiKeyRevealOtp,
} from "@/lib/api-developer";
import type { CreateApiKeyPayload, CreateApiKeyResponse } from "@/lib/api-developer";

export function useApiKeys() {
  return useQuery({
    queryKey: ["api-keys"],
    queryFn: () => listApiKeys(),
    staleTime: 30_000,
  });
}

export function useCreateApiKey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateApiKeyPayload) => createApiKey(payload),
    onSuccess: (data: CreateApiKeyResponse) => {
      qc.invalidateQueries({ queryKey: ["api-keys"] });
      toast.success("API key created — copy it now, or reveal it anytime via email OTP");
      return data;
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to create API key");
    },
  });
}

export function useRequestApiKeyReveal(onSuccess?: () => void) {
  return useMutation({
    mutationFn: (keyId: string) => requestApiKeyReveal(keyId),
    onSuccess: () => {
      toast.success("Reveal code sent to your email");
      onSuccess?.();
    },
    onError: (err) => {
      const msg = err instanceof Error ? err.message : "Failed to send reveal code";
      toast.error(msg);
    },
  });
}

export function useVerifyApiKeyRevealOtp(onSuccess?: (rawKey: string) => void) {
  return useMutation({
    mutationFn: ({ keyId, otp }: { keyId: string; otp: string }) =>
      verifyApiKeyRevealOtp(keyId, otp),
    onSuccess: (data) => onSuccess?.(data.raw_key),
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Invalid or expired code.");
    },
  });
}

export function useRevokeApiKey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => revokeApiKey(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["api-keys"] });
      toast.success("API key revoked");
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to revoke API key");
    },
  });
}
