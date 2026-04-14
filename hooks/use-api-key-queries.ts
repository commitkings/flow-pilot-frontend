"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  listApiKeys,
  createApiKey,
  revokeApiKey,
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
      toast.success("API key created — copy it now before navigating away");
      return data;
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to create API key");
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
