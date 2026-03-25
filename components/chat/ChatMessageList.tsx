"use client";

import { useRef, useEffect } from "react";
import { ChatMessage } from "./ChatMessage";
import { ChatTypingIndicator } from "./ChatTypingIndicator";
import type { ChatMessage as ChatMessageType } from "@/lib/api-types";

const EXAMPLES = [
  "Pay salaries for February with a ₦5M budget cap",
  "Process vendor payments Jan 15–31, low risk",
  "Reconcile payroll with 0.3 risk threshold",
];

interface ChatMessageListProps {
  messages: ChatMessageType[];
  isLoading?: boolean;
  onExampleClick?: (text: string) => void;
}

export function ChatMessageList({ messages, isLoading, onExampleClick }: ChatMessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  return (
    <div className="flex-1 overflow-y-auto p-4">
      {messages.length === 0 && !isLoading && (
        <div className="flex h-full flex-col items-center justify-center gap-5 text-center">
          <div>
            <p className="text-sm font-semibold text-foreground">Describe your payout run</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Type naturally — the AI will extract the parameters for you.
            </p>
          </div>
          <div className="flex w-full max-w-sm flex-col gap-2">
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => onExampleClick?.(ex)}
                className="rounded-xl border border-border bg-muted/40 px-4 py-2.5 text-left text-xs font-medium text-muted-foreground transition-colors hover:border-brand/30 hover:bg-brand/5 hover:text-foreground"
              >
                &ldquo;{ex}&rdquo;
              </button>
            ))}
          </div>
        </div>
      )}

      {messages.map((msg) => (
        <ChatMessage
          key={msg.id}
          role={msg.role}
          content={msg.content}
          timestamp={msg.created_at}
        />
      ))}

      {isLoading && <ChatTypingIndicator />}

      <div ref={bottomRef} />
    </div>
  );
}
