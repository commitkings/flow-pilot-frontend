"use client";

import { cn } from "@/lib/utils";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  intent?: string | null;
  confidence?: number | null;
  timestamp?: string;
}

export function ChatMessage({
  role,
  content,
  intent,
  confidence,
  timestamp,
}: ChatMessageProps) {
  const isUser = role === "user";

  return (
    <div
      className={cn(
        "flex w-full mb-4",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-3",
          isUser
            ? "bg-primary text-primary-foreground rounded-br-md"
            : "bg-muted text-foreground rounded-bl-md"
        )}
      >
        <p className="text-sm whitespace-pre-wrap">{content}</p>
        
        {/* Intent badge for assistant messages */}
        {!isUser && intent && (
          <div className="mt-2 flex items-center gap-2 text-xs">
            <span className="bg-background/50 text-muted-foreground px-2 py-0.5 rounded-full">
              {intent}
            </span>
            {confidence !== null && confidence !== undefined && (
              <span className="text-muted-foreground">
                {Math.round(confidence * 100)}% confident
              </span>
            )}
          </div>
        )}
        
        {/* Timestamp */}
        {timestamp && (
          <p
            className={cn(
              "text-[10px] mt-1",
              isUser ? "text-primary-foreground/70" : "text-muted-foreground"
            )}
          >
            {new Date(timestamp).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        )}
      </div>
    </div>
  );
}
