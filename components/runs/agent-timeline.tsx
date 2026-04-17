"use client";

import { useEffect, useRef, useState } from "react";
import { Check, X, Loader2, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { AGENT_LABELS } from "@/lib/event-types";
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
    <span className="tabular-nums font-mono text-xs text-brand">
      {(elapsed / 1000).toFixed(1)}s
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

  const lastCompletedIdx = steps.reduce((acc, s, i) => s.status === "completed" ? i : acc, -1);

  return (
    <div className={cn("space-y-0", className)}>
      {steps.map((step, idx) => {
        const isExpanded = expandedId === step.id;
        const hasSummary = step.output_summary && Object.keys(step.output_summary).length > 0;
        const isLast = idx === steps.length - 1;
        const isDone = step.status === "completed";
        const isRunning = step.status === "running";
        const isFailed = step.status === "failed";
        const isPending = !isDone && !isRunning && !isFailed;
        // connector below this node is brand-colored if this step AND next are completed
        const connectorFilled = isDone && idx <= lastCompletedIdx;

        return (
          <div key={step.id} className="flex gap-4">
            {/* Left: node + connector */}
            <div className="flex flex-col items-center">
              {/* Node */}
              <div className="relative shrink-0">
                {isRunning && (
                  <span className="absolute inset-0 animate-ping rounded-full bg-brand/25" />
                )}
                <div className={cn(
                  "relative flex h-8 w-8 items-center justify-center rounded-full text-xs font-black transition-all",
                  isDone && "bg-brand text-white shadow-sm shadow-brand/30",
                  isRunning && "bg-brand text-white ring-4 ring-brand/20",
                  isFailed && "bg-destructive text-white",
                  isPending && "border-2 border-border/60 bg-background text-muted-foreground/40",
                )}>
                  {isDone && <Check className="h-4 w-4" strokeWidth={2.5} />}
                  {isRunning && <Loader2 className="h-4 w-4 animate-spin" />}
                  {isFailed && <X className="h-4 w-4" strokeWidth={2.5} />}
                  {isPending && <span>{idx + 1}</span>}
                </div>
              </div>

              {/* Connector line below node */}
              {!isLast && (
                <div className={cn(
                  "mt-1 w-0.5 flex-1 min-h-6 rounded-full transition-colors",
                  connectorFilled ? "bg-brand/40" : "bg-border/40"
                )} />
              )}
            </div>

            {/* Right: content */}
            <div className={cn("flex-1 pb-5", isLast && "pb-1")}>
              <div
                className={cn(
                  "rounded-xl border px-4 py-3 transition-all",
                  isDone && "border-border/40 bg-card",
                  isRunning && "border-brand/30 bg-brand/5 shadow-sm",
                  isFailed && "border-destructive/20 bg-destructive/5",
                  isPending && "border-border/30 bg-muted/10",
                  hasSummary && "cursor-pointer",
                  hasSummary && isDone && "hover:border-border hover:bg-muted/10",
                )}
                onClick={() => {
                  if (hasSummary) setExpandedId(isExpanded ? null : step.id);
                }}
              >
                {/* Header row */}
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Agent label */}
                  <span className={cn(
                    "text-[10px] font-black uppercase tracking-wider",
                    isDone && "text-brand",
                    isRunning && "text-brand",
                    isFailed && "text-destructive",
                    isPending && "text-muted-foreground/50",
                  )}>
                    {AGENT_LABELS[step.agent_type] ?? step.agent_type}
                  </span>

                  <span className="text-muted-foreground/30 text-xs">·</span>

                  {/* Description */}
                  <span className={cn(
                    "text-sm font-semibold",
                    isDone && "text-foreground",
                    isRunning && "text-foreground",
                    isFailed && "text-destructive",
                    isPending && "text-muted-foreground/50",
                  )}>
                    {step.description ?? `Step ${step.step_order}`}
                  </span>

                  {/* Duration / timer */}
                  {isRunning && step.started_at && (
                    <LiveTimer startedAt={step.started_at} />
                  )}
                  {isDone && step.duration_ms !== null && (
                    <span className="ml-auto rounded-full border border-border/50 bg-muted/30 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                      {formatDuration(step.duration_ms)}
                    </span>
                  )}
                  {isFailed && (
                    <span className="ml-auto rounded-full border border-destructive/20 bg-destructive/5 px-2 py-0.5 text-[10px] font-semibold text-destructive">
                      {step.duration_ms !== null ? formatDuration(step.duration_ms) : "failed"}
                    </span>
                  )}

                  {hasSummary && (
                    <ChevronDown className={cn(
                      "h-3.5 w-3.5 text-muted-foreground transition-transform shrink-0",
                      !isDone && "hidden",
                      isExpanded && "rotate-180",
                    )} />
                  )}
                </div>

                {/* Error */}
                {isFailed && step.error_message && (
                  <p className="mt-1.5 text-xs text-destructive/80 leading-relaxed">
                    {step.error_message}
                  </p>
                )}

                {/* Expanded output */}
                {isExpanded && step.output_summary && (
                  <div className="mt-3 rounded-lg border border-border/50 bg-muted/20 px-3 py-2.5 space-y-1.5">
                    {Object.entries(step.output_summary).map(([key, value]) => (
                      <div key={key} className="flex gap-2 text-xs">
                        <span className="shrink-0 capitalize text-muted-foreground/70">
                          {key.replaceAll("_", " ")}:
                        </span>
                        <span className="break-all text-foreground/80">
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
          </div>
        );
      })}
    </div>
  );
}
