"use client";

import { useQuery } from "@tanstack/react-query";
import { listConversations, getConversation } from "@/lib/api-client";
import type { ConversationsListResponse, ConversationDetail } from "@/lib/api-types";

const TRANSIENT_STATUSES = new Set(["awaiting_approval", "executing", "confirming"]);

export function useConversations(
  businessId: string | undefined,
  limit = 20,
  offset = 0,
) {
  return useQuery<ConversationsListResponse>({
    queryKey: ["conversations", businessId, limit, offset],
    queryFn: () => listConversations(businessId!, limit, offset),
    enabled: !!businessId,
    staleTime: 10_000,
    refetchInterval: (query) => {
      const convos = query.state.data?.conversations;
      if (convos?.some((c) => TRANSIENT_STATUSES.has(c.status))) return 5000;
      return false;
    },
  });
}

export function useConversation(conversationId: string | undefined) {
  return useQuery<ConversationDetail>({
    queryKey: ["conversation", conversationId],
    queryFn: () => getConversation(conversationId!),
    enabled: !!conversationId,
    staleTime: 5_000,
    refetchInterval: (query) => {
      const conv = query.state.data;
      if (conv && TRANSIENT_STATUSES.has(conv.status)) return 5000;
      return false;
    },
  });
}
