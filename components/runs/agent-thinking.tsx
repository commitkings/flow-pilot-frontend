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

const AGENT_THINKING_LABELS: Record<string, string> = {
  planner: "Generating execution plan...",
  reconciliation: "Analyzing transactions...",
  risk: "Evaluating risk factors...",
  execution: "Processing payouts...",
  audit: "Compiling audit report...",
};

function humanizeThinking(raw: string, agentType: string): string {
  const trimmed = raw.trim();
  if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) return trimmed;

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    return AGENT_THINKING_LABELS[agentType] ?? "Processing...";
  }

  if (agentType === "planner" && parsed.plan_steps) {
    const steps = parsed.plan_steps as Array<{ description?: string; agent_type?: string }>;
    const lines = steps.map(
      (s, i) => `${i + 1}. ${s.description ?? s.agent_type ?? "Step"}`
    );
    const summary = parsed.summary ? `${parsed.summary}\n\n` : "";
    return `${summary}${lines.join("\n")}`;
  }

  if (agentType === "risk") {
    const parts: string[] = [];
    if (parsed.risk_score !== undefined) {
      const decision = parsed.risk_decision ?? "pending";
      parts.push(`Risk score: ${parsed.risk_score} — ${decision}`);
    }
    if (Array.isArray(parsed.risk_reasons) && parsed.risk_reasons.length > 0) {
      for (const reason of parsed.risk_reasons as string[]) {
        parts.push(`• ${reason}`);
      }
    }
    if (Array.isArray(parsed.candidates)) {
      const c = parsed.candidates as Array<{ beneficiary_name?: string; risk_score?: number; risk_decision?: string }>;
      for (const cand of c) {
        const name = cand.beneficiary_name ?? "Candidate";
        const score = cand.risk_score !== undefined ? ` — score: ${cand.risk_score}` : "";
        const dec = cand.risk_decision ? ` (${cand.risk_decision})` : "";
        parts.push(`${name}${score}${dec}`);
      }
    }
    return parts.length > 0 ? parts.join("\n") : "Risk analysis completed.";
  }

  if (agentType === "audit" && typeof parsed.executive_summary === "string") {
    return parsed.executive_summary;
  }

  if (typeof parsed.summary === "string") return parsed.summary;
  if (typeof parsed.executive_summary === "string") return parsed.executive_summary;
  if (typeof parsed.description === "string") return parsed.description;

  return AGENT_THINKING_LABELS[agentType] ?? "Processing completed.";
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
            const sp = p as StepStartedPayload;
            return (
              <div key={event.seq} className="py-1 space-y-0.5">
                <div className="flex items-center gap-2">
                  <div className="h-px flex-1 bg-border" />
                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-blue-600 dark:text-blue-400">
                    <Play className="h-2.5 w-2.5" />
                    {label} started
                  </div>
                  <div className="h-px flex-1 bg-border" />
                </div>
                {sp.description && (
                  <p className="text-center text-[10px] text-muted-foreground/60">
                    {sp.description}
                  </p>
                )}
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
                {humanizeThinking(p.thinking, p.agent_type)}
              </p>
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
