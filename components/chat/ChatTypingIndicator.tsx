"use client";

export function ChatTypingIndicator() {
  return (
    <div className="flex justify-start mb-4">
      <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
        <div className="flex items-center gap-1">
          <span
            className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce"
            style={{ animationDelay: "0ms" }}
          />
          <span
            className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce"
            style={{ animationDelay: "150ms" }}
          />
          <span
            className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce"
            style={{ animationDelay: "300ms" }}
          />
        </div>
      </div>
    </div>
  );
}
