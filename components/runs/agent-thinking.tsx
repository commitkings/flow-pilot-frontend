"use client";

import { useEffect, useRef } from "react";
import { Brain, Zap, Play, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { AGENT_LABELS, AGENT_COLORS } from "@/lib/event-types";
import type {
  RunEvent,
  ReasoningPayload,
  StepProgressPayload,
  StepStartedPayload,
  StepCompletedPayload,
  StepFailedPayload,
} from "@/lib/event-types";

interface AgentThinkingProps {
  events: RunEvent[];
  className?: string;
}

function isReasoningEvent(e: RunEvent): e is RunEvent & { payload: ReasoningPayload } {
  return e.type === "reasoning";
}

function isProgressEvent(e: RunEvent): e is RunEvent & { payload: StepProgressPayload } {
  return e.type === "step_progress";
}

function isStepBoundary(e: RunEvent): boolean {
  return e.type === "step_started" || e.type === "step_completed" || e.type === "step_failed";
}

function isDisplayableEvent(e: RunEvent): boolean {
  return isReasoningEvent(e) || isProgressEvent(e) || isStepBoundary(e);
}

function AgentBadge({ agentType }: { agentType: string }) {
  const colors = AGENT_COLORS[agentType] ?? {
    bg: "bg-gray-100 dark:bg-gray-900/30",
    text: "text-gray-700 dark:text-gray-300",
  };
  const label = AGENT_LABELS[agentType] ?? agentType;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide shrink-0",
        colors.bg,
        colors.text,
      )}
    >
      {label}
    </span>
  );
}

function TokenBadge({ usage }: { usage: NonNullable<ReasoningPayload["token_usage"]> }) {
  const total = usage.prompt_tokens + usage.completion_tokens;
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
      <Zap className="h-2.5 w-2.5" />
      {total.toLocaleString()} tok · {(usage.duration_ms / 1000).toFixed(1)}s
    </span>
  );
}

function formatTime(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

export function AgentThinking({ events, className }: AgentThinkingProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const thinkingEvents = events.filter(isDisplayableEvent);

  // Auto-scroll to bottom on new events
  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [thinkingEvents.length]);

  if (thinkingEvents.length === 0) {
    return (
      <div className={cn("flex flex-col items-center justify-center py-10 text-sm text-muted-foreground gap-2", className)}>
        <Brain className="h-5 w-5 text-muted-foreground/40" />
        <span>No agent activity yet.</span>
      </div>
    );
  }

  return (
    <div
      ref={scrollRef}
      className={cn("space-y-2 overflow-y-auto", className)}
    >
      {thinkingEvents.map((event) => {
        if (isStepBoundary(event)) {
          const p = event.payload as StepStartedPayload | StepCompletedPayload | StepFailedPayload;
          const agentType = "agent_type" in p ? p.agent_type : "";
          const label = AGENT_LABELS[agentType] ?? agentType;

          if (event.type === "step_started") {
            return (
              <div key={event.seq} className="flex items-center gap-2 py-1">
                <div className="h-px flex-1 bg-border" />
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-blue-600 dark:text-blue-400">
                  <Play className="h-2.5 w-2.5" />
                  {label} started
                </div>
                <div className="h-px flex-1 bg-border" />
              </div>
            );
          }
          if (event.type === "step_completed") {
            const cp = p as StepCompletedPayload;
            return (
              <div key={event.seq} className="flex items-center gap-2 py-1">
                <div className="h-px flex-1 bg-border" />
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-2.5 w-2.5" />
                  {label} done
                  {cp.duration_ms > 0 && (
                    <span className="font-normal text-muted-foreground">
                      ({(cp.duration_ms / 1000).toFixed(1)}s)
                    </span>
                  )}
                </div>
                <div className="h-px flex-1 bg-border" />
              </div>
            );
          }
          if (event.type === "step_failed") {
            return (
              <div key={event.seq} className="flex items-center gap-2 py-1">
                <div className="h-px flex-1 bg-border" />
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-red-600 dark:text-red-400">
                  <XCircle className="h-2.5 w-2.5" />
                  {label} failed
                </div>
                <div className="h-px flex-1 bg-border" />
              </div>
            );
          }
        }

        if (isReasoningEvent(event)) {
          const p = event.payload;
          return (
            <div
              key={event.seq}
              className="rounded-lg border border-border bg-background px-3 py-2.5"
            >
              <div className="flex items-center gap-2 flex-wrap mb-1.5">
                <Brain className="h-3.5 w-3.5 text-violet-500" />
                <AgentBadge agentType={p.agent_type} />
                <span className="text-[10px] text-muted-foreground/60">
                  {formatTime(event.emitted_at)}
                </span>
                {p.token_usage && <TokenBadge usage={p.token_usage} />}
              </div>
              <p className="text-xs leading-relaxed text-foreground/80 whitespace-pre-wrap">
                {p.thinking}
              </p>
              {p.prompt_summary && (
                <p className="mt-1.5 text-[10px] text-muted-foreground/60 line-clamp-2">
                  Prompt: {p.prompt_summary}
                </p>
              )}
            </div>
          );
        }

        if (isProgressEvent(event)) {
          const p = event.payload;
          return (
            <div
              key={event.seq}
              className="flex items-start gap-2 rounded-lg bg-accent/30 px-3 py-2"
            >
              <Zap className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <AgentBadge agentType={p.agent_type} />
                  <span className="text-[10px] text-muted-foreground/60">
                    {formatTime(event.emitted_at)}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-foreground/80">{p.message}</p>
              </div>
            </div>
          );
        }

        return null;
      })}
    </div>
  );
}
