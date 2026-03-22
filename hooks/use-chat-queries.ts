"use client";

import { useQuery } from "@tanstack/react-query";
import { listConversations, getConversation } from "@/lib/api-client";
import type { ConversationsListResponse, ConversationDetail } from "@/lib/api-types";

export function useConversations(
  businessId: string | undefined,
  limit = 20,
  offset = 0,
) {
  return useQuery<ConversationsListResponse>({
    queryKey: ["conversations", businessId, limit, offset],
    queryFn: () => listConversations(businessId!, limit, offset),
    enabled: !!businessId,
    staleTime: 30_000,
  });
}

export function useConversation(conversationId: string | undefined) {
  return useQuery<ConversationDetail>({
    queryKey: ["conversation", conversationId],
    queryFn: () => getConversation(conversationId!),
    enabled: !!conversationId,
    staleTime: 10_000,
  });
}
