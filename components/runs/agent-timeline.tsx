"use client";

import { useEffect, useRef, useState } from "react";
import { Check, X, CircleDot, Loader2, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { AGENT_LABELS, AGENT_COLORS } from "@/lib/event-types";
import type { StepSummary } from "@/lib/event-types";

interface AgentTimelineProps {
  steps: StepSummary[];
  className?: string;
}

function formatDuration(ms: number | null): string {
  if (ms === null) return "";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function LiveTimer({ startedAt }: { startedAt: string }) {
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef(new Date(startedAt).getTime());

  useEffect(() => {
    startRef.current = new Date(startedAt).getTime();
    const tick = () => setElapsed(Date.now() - startRef.current);
    tick();
    const id = setInterval(tick, 100);
    return () => clearInterval(id);
  }, [startedAt]);

  return (
    <span className="tabular-nums text-xs text-muted-foreground">
      {(elapsed / 1000).toFixed(1)}s
    </span>
  );
}

function StepIcon({ status }: { status: string }) {
  switch (status) {
    case "completed":
      return (
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40">
          <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
        </div>
      );
    case "failed":
      return (
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/40">
          <X className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
        </div>
      );
    case "running":
      return (
        <div className="relative flex h-7 w-7 items-center justify-center">
          <span className="absolute inset-0 animate-ping rounded-full bg-blue-400/30" />
          <div className="relative flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/40">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-600 dark:text-blue-400" />
          </div>
        </div>
      );
    default:
      return (
        <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-border bg-background">
          <CircleDot className="h-3 w-3 text-muted-foreground/40" />
        </div>
      );
  }
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
        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
        colors.bg,
        colors.text,
      )}
    >
      {label}
    </span>
  );
}

export function AgentTimeline({ steps, className }: AgentTimelineProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (steps.length === 0) {
    return (
      <div className={cn("flex items-center justify-center py-10 text-sm text-muted-foreground", className)}>
        No pipeline steps yet.
      </div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      {/* Vertical line */}
      <div className="absolute left-[13px] top-0 bottom-0 w-px bg-border" />

      <div className="space-y-1">
        {steps.map((step, idx) => {
          const isExpanded = expandedId === step.id;
          const isLast = idx === steps.length - 1;
          const hasSummary =
            step.output_summary && Object.keys(step.output_summary).length > 0;

          return (
            <div key={step.id} className="relative pl-10">
              {/* Icon */}
              <div className="absolute left-0 top-1">
                <StepIcon status={step.status} />
              </div>

              {/* Content */}
              <div
                className={cn(
                  "rounded-lg border border-transparent px-3 py-2 transition-colors",
                  hasSummary && "cursor-pointer hover:border-border hover:bg-accent/50",
                )}
                onClick={() => {
                  if (hasSummary) setExpandedId(isExpanded ? null : step.id);
                }}
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <AgentBadge agentType={step.agent_type} />
                  <span className="text-sm font-medium text-foreground">
                    {step.description ?? `Step ${step.step_order}`}
                  </span>
                  {step.status === "running" && step.started_at && (
                    <LiveTimer startedAt={step.started_at} />
                  )}
                  {step.status === "completed" && step.duration_ms !== null && (
                    <span className="rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                      {formatDuration(step.duration_ms)}
                    </span>
                  )}
                  {step.status === "failed" && (
                    <span className="rounded-full bg-red-50 px-1.5 py-0.5 text-[10px] font-semibold text-red-700 dark:bg-red-900/30 dark:text-red-400">
                      {step.duration_ms !== null ? formatDuration(step.duration_ms) : "error"}
                    </span>
                  )}
                  {hasSummary && (
                    <ChevronDown
                      className={cn(
                        "ml-auto h-3.5 w-3.5 text-muted-foreground transition-transform",
                        isExpanded && "rotate-180",
                      )}
                    />
                  )}
                </div>

                {/* Error message */}
                {step.status === "failed" && step.error_message && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                    {step.error_message}
                  </p>
                )}

                {/* Expanded summary */}
                {isExpanded && step.output_summary && (
                  <div className="mt-2 rounded-md bg-muted/50 p-3 text-xs space-y-1">
                    {Object.entries(step.output_summary).map(([key, value]) => (
                      <div key={key} className="flex gap-2">
                        <span className="text-muted-foreground/70 shrink-0">
                          {key.replaceAll("_", " ")}:
                        </span>
                        <span className="text-foreground/80 break-all">
                          {Array.isArray(value)
                            ? value.join(", ")
                            : typeof value === "object" && value !== null
                              ? Object.entries(value).map(([k, v]) => `${k}: ${v}`).join(", ")
                              : String(value ?? "—")}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
