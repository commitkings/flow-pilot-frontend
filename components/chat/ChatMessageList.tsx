"use client";

import { useRef, useEffect } from "react";
import { ChatMessage } from "./ChatMessage";
import { ChatTypingIndicator } from "./ChatTypingIndicator";
import type { ChatMessage as ChatMessageType } from "@/lib/api-types";

interface ChatMessageListProps {
  messages: ChatMessageType[];
  isLoading?: boolean;
}

export function ChatMessageList({ messages, isLoading }: ChatMessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  return (
    <div className="flex-1 overflow-y-auto p-4">
      {messages.length === 0 && !isLoading && (
        <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
          <p className="text-lg font-medium mb-2">Start a conversation</p>
          <p className="text-sm max-w-sm">
            Describe your payout run in natural language. For example:
            &ldquo;Create a payout for merchants with low transaction
            volume&rdquo;
          </p>
        </div>
      )}

      {messages.map((msg) => (
        <ChatMessage
          key={msg.id}
          role={msg.role}
          content={msg.content}
          intent={msg.intent}
          confidence={msg.confidence}
          timestamp={msg.created_at}
        />
      ))}

      {isLoading && <ChatTypingIndicator />}

      <div ref={bottomRef} />
    </div>
  );
}
