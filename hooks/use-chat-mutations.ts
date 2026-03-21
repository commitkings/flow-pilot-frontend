"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  chatSend,
  confirmConversation,
  abandonConversation,
  deleteConversation,
} from "@/lib/api-client";
import {
  ApiError,
  type ChatSendResponse,
  type ConfirmRunResponse,
} from "@/lib/api-types";

interface UseChatSendOptions {
  onSuccess?: (response: ChatSendResponse) => void;
}

export function useChatSend(options?: UseChatSendOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      message,
      businessId,
      conversationId,
    }: {
      message: string;
      businessId: string;
      conversationId?: string;
    }) => chatSend(message, businessId, conversationId),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      if (response.conversation_id) {
        queryClient.invalidateQueries({
          queryKey: ["conversation", response.conversation_id],
        });
      }
      options?.onSuccess?.(response);
    },
    onError: (err) => {
      const message =
        err instanceof ApiError
          ? err.message
          : "Failed to send message. Please try again.";
      toast.error(message);
    },
  });
}

interface UseConfirmRunOptions {
  onSuccess?: (response: ConfirmRunResponse) => void;
}

export function useConfirmRun(options?: UseConfirmRunOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      conversationId,
      slotOverrides,
    }: {
      conversationId: string;
      slotOverrides?: Record<string, unknown>;
    }) => confirmConversation(conversationId, slotOverrides),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      queryClient.invalidateQueries({ queryKey: ["runs"] });
      toast.success("Run created successfully!");
      options?.onSuccess?.(response);
    },
    onError: (err) => {
      const message =
        err instanceof ApiError
          ? err.message
          : "Failed to create run. Please try again.";
      toast.error(message);
    },
  });
}

export function useAbandonConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (conversationId: string) => abandonConversation(conversationId),
    onSuccess: (_, conversationId) => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      queryClient.invalidateQueries({
        queryKey: ["conversation", conversationId],
      });
      toast.success("Conversation abandoned");
    },
    onError: (err) => {
      const message =
        err instanceof ApiError
          ? err.message
          : "Failed to abandon conversation.";
      toast.error(message);
    },
  });
}

export function useDeleteConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (conversationId: string) => deleteConversation(conversationId),
    onSuccess: (_, conversationId) => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      queryClient.removeQueries({
        queryKey: ["conversation", conversationId],
      });
      toast.success("Conversation deleted");
    },
    onError: (err) => {
      const message =
        err instanceof ApiError
          ? err.message
          : "Failed to delete conversation.";
      toast.error(message);
    },
  });
}
