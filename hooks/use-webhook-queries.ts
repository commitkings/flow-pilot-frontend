"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  listWebhooks,
  createWebhook,
  deleteWebhook,
  toggleWebhook,
  listWebhookDeliveries,
  updateWebhook,
} from "@/lib/api-developer";
import type { CreateWebhookPayload, CreateWebhookResponse } from "@/lib/api-developer";

export function useWebhooks() {
  return useQuery({
    queryKey: ["webhooks"],
    queryFn: () => listWebhooks(),
    staleTime: 30_000,
  });
}

export function useCreateWebhook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateWebhookPayload) => createWebhook(payload),
    onSuccess: (data: CreateWebhookResponse) => {
      qc.invalidateQueries({ queryKey: ["webhooks"] });
      if (data.verified) {
        toast.success("Webhook verified and activated");
      } else {
        toast.warning("Webhook saved but endpoint did not respond — it is inactive until verified");
      }
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to create webhook");
    },
  });
}

export function useDeleteWebhook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteWebhook(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["webhooks"] });
      toast.success("Webhook deleted");
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to delete webhook");
    },
  });
}

export function useToggleWebhook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      toggleWebhook(id, is_active),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["webhooks"] });
      toast.success(data.is_active ? "Webhook enabled" : "Webhook disabled");
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to update webhook");
    },
  });
}

export function useWebhookDeliveries(webhookId: string | null) {
  return useQuery({
    queryKey: ["webhook-deliveries", webhookId],
    queryFn: () => listWebhookDeliveries(webhookId!),
    enabled: !!webhookId,
    staleTime: 30_000,
  });
}

export function useUpdateWebhook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: { id: string; url?: string; events?: string[]; is_active?: boolean }) =>
      updateWebhook(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["webhooks"] });
      toast.success("Webhook updated");
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to update webhook");
    },
  });
}
