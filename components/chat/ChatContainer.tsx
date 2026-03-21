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
}

export function ChatContainer({
  businessId,
  conversationId: externalConversationId,
  onSlotChange,
  onShouldConfirmChange,
  onConversationChange,
  onRunConfigReady,
}: ChatContainerProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  // Internal conversation ID, synced with external prop
  const [internalConversationId, setInternalConversationId] = useState<string | undefined>(
    externalConversationId ?? undefined
  );

  // Sync internal state when external prop changes (e.g., user selects from sidebar)
  useEffect(() => {
    const newId = externalConversationId ?? undefined;
    if (newId !== internalConversationId) {
      setInternalConversationId(newId);
      // Clear messages when starting fresh
      if (!newId) {
        setMessages([]);
      }
    }
  }, [externalConversationId, internalConversationId]);

  // Load existing conversation messages when resuming
  const { data: conversationData } = useConversation(
    internalConversationId && externalConversationId ? internalConversationId : undefined
  );

  // Populate messages when conversation data loads
  useEffect(() => {
    if (conversationData?.messages && conversationData.messages.length > 0) {
      setMessages(conversationData.messages);
      // Also update parent with merged slots from loaded conversation
      if (conversationData.merged_slots) {
        onSlotChange?.(conversationData.merged_slots);
      }
    }
  }, [conversationData, onSlotChange]);

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
    <div className="flex flex-col h-full border rounded-lg overflow-hidden bg-card">
      <div className="p-3 border-b bg-muted/30">
        <h3 className="font-medium text-sm">Chat with FlowPilot</h3>
        <p className="text-xs text-muted-foreground">
          Describe your payout run in natural language
        </p>
      </div>
      
      <ChatMessageList
        messages={messages}
        isLoading={chatMutation.isPending}
      />
      
      <ChatInput
        onSend={handleSendMessage}
        disabled={chatMutation.isPending || !businessId}
        placeholder={!businessId ? "Loading..." : "Type your message..."}
      />
    </div>
  );
}
