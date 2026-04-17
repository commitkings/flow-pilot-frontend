"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { listRecipients, createRecipient, updateRecipient, deleteRecipient } from "@/lib/api-client";
import type { CreateSavedRecipientPayload, UpdateSavedRecipientPayload } from "@/lib/api-types";

export function useVendors(search?: string) {
  return useQuery({
    queryKey: ["saved-recipients", search ?? ""],
    queryFn: () => listRecipients({ search, limit: 200 }),
    staleTime: 15_000,
  });
}

export function useCreateVendor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateSavedRecipientPayload) => createRecipient(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["saved-recipients"] });
      toast.success("Recipient added");
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to add recipient");
    },
  });
}

export function useUpdateVendor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ vendorId, payload }: { vendorId: string; payload: UpdateSavedRecipientPayload }) =>
      updateRecipient(vendorId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["saved-recipients"] });
      toast.success("Recipient updated");
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to update recipient");
    },
  });
}

export function useDeleteVendor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vendorId: string) => deleteRecipient(vendorId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["saved-recipients"] });
      toast.success("Recipient removed");
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to remove recipient");
    },
  });
}
