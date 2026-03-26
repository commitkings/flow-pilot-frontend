"use client";

import { useState, useCallback, useEffect } from "react";
import { ChatMessageList } from "./ChatMessageList";
import { ChatInput } from "./ChatInput";
import { useChatSend } from "@/hooks/use-chat-mutations";
import { useConversation } from "@/hooks/use-chat-queries";
import type { ChatMessage, ChatSendResponse } from "@/lib/api-types";

interface ChatContainerProps {
  businessId?: string;
  /** External conversation ID to resume (controlled by parent) */
  conversationId?: string | null;
  onSlotChange?: (mergedSlots: Record<string, unknown>) => void;
  onShouldConfirmChange?: (shouldConfirm: boolean) => void;
  onConversationChange?: (conversationId: string | null) => void;
  onRunConfigReady?: (runConfig: ChatSendResponse["run_config"]) => void;
  onRunCreated?: (runId: string) => void;
}

export function ChatContainer({
  businessId,
  conversationId: externalConversationId,
  onSlotChange,
  onShouldConfirmChange,
  onConversationChange,
  onRunConfigReady,
  onRunCreated,
}: ChatContainerProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  // Internal conversation ID, synced with external prop
  const [internalConversationId, setInternalConversationId] = useState<string | undefined>(
    externalConversationId ?? undefined
  );

  // Sync only when parent prop changes to avoid internal/external ping-pong updates.
  useEffect(() => {
    const newId = externalConversationId ?? undefined;
    setInternalConversationId(newId);
    // Clear messages when starting fresh
    if (!newId) {
      setMessages([]);
    }
  }, [externalConversationId]);

  // Load existing conversation messages when resuming
  const { data: conversationData } = useConversation(
    internalConversationId && externalConversationId ? internalConversationId : undefined
  );

  // Populate messages when conversation data loads
  useEffect(() => {
    if (conversationData?.messages && conversationData.messages.length > 0) {
      setMessages(conversationData.messages);
      onSlotChange?.(conversationData.extracted_slots ?? {});
      onShouldConfirmChange?.(conversationData.status === "confirming");
      onRunConfigReady?.(conversationData.resolved_run_config ?? null);
    }
  }, [conversationData, onRunConfigReady, onShouldConfirmChange, onSlotChange]);

  // Notify parent when conversation changes
  useEffect(() => {
    onConversationChange?.(internalConversationId ?? null);
  }, [internalConversationId, onConversationChange]);

  const chatMutation = useChatSend({
    onSuccess: (response) => {
      // Update conversation ID if new
      if (response.conversation_id && response.conversation_id !== internalConversationId) {
        setInternalConversationId(response.conversation_id);
      }

      // Add assistant message to local state
      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        conversation_id: response.conversation_id,
        role: "assistant",
        content: response.response,
        intent: response.intent,
        confidence: response.confidence,
        extracted_slots: response.extracted_slots,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMessage]);

      // Notify parent of slot changes
      onSlotChange?.(response.merged_slots);
      onShouldConfirmChange?.(response.should_confirm);

      // Notify when run config is ready
      if (response.run_config) {
        onRunConfigReady?.(response.run_config);
      }

      if (response.run_created && response.run_id) {
        onShouldConfirmChange?.(false);
        onRunCreated?.(response.run_id);
      }
    },
  });

  const handleSendMessage = useCallback(
    (content: string) => {
      if (!businessId) return;

      // Add user message to local state immediately
      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        conversation_id: internalConversationId || "",
        role: "user",
        content,
        intent: null,
        confidence: null,
        extracted_slots: null,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMessage]);

      // Send to backend
      chatMutation.mutate({
        message: content,
        businessId,
        conversationId: internalConversationId,
      });
    },
    [businessId, internalConversationId, chatMutation]
  );

  return (
    <div className="flex flex-col h-full overflow-hidden rounded-2xl border border-border bg-card">
      <div className="flex items-center gap-2.5 border-b border-border px-4 py-3">
        <div className="relative flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand text-white text-[10px] font-black">
          AI
          <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-card" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground leading-none">FlowPilot AI</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Describe your payout in natural language</p>
        </div>
      </div>

      <ChatMessageList
        messages={messages}
        isLoading={chatMutation.isPending}
        onExampleClick={handleSendMessage}
      />

      <ChatInput
        onSend={handleSendMessage}
        disabled={chatMutation.isPending || !businessId}
        placeholder={!businessId ? "Loading..." : "Describe your payout run…"}
      />
    </div>
  );
}
