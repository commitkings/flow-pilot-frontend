"use client";

import { useState } from "react";
import {
  Bell,
  CalendarClock,
  CalendarDays,
  CalendarX2,
  CheckCircle2,
  Loader2,
  Pause,
  Play,
  RefreshCw,
  Trash2,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { PageHeader } from "@/components/ui/page-header";
import {
  useScheduledRuns,
  useToggleScheduledRun,
  useDeleteScheduledRun,
} from "@/hooks/use-scheduled-runs";
import { ScheduleRunModal } from "@/components/runs/ScheduleRunModal";
import type { ScheduledRun } from "@/lib/api-scheduled-runs";

/* ── Formatting helpers ──────────────────────────────────────────────────── */

function formatDatetime(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-NG", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/* ── Row state helpers ───────────────────────────────────────────────────── */

/**
 * Derive the display state of a scheduled run row.
 *
 * - one_time + is_active + next_run_at in the future → "pending"
 * - one_time + is_active + next_run_at in the past (about to fire) → "pending"
 * - one_time + !is_active + last_run_at set → "completed"
 * - one_time + !is_active + no last_run_at → "cancelled"
 * - recurring + is_active → "active"
 * - recurring + !is_active → "paused"
 */
type RowState = "active" | "paused" | "pending" | "completed" | "cancelled";

function getRowState(run: ScheduledRun): RowState {
  if (run.run_type === "one_time") {
    if (run.is_active) return "pending";
    if (run.last_run_at) return "completed";
    return "cancelled";
  }
  return run.is_active ? "active" : "paused";
}

/* ── Status badge ────────────────────────────────────────────────────────── */

function StatusBadge({ state }: { state: RowState }) {
  const config: Record<RowState, { label: string; classes: string; dot: string }> = {
    active:    { label: "Active",    classes: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400", dot: "bg-emerald-500" },
    paused:    { label: "Paused",    classes: "bg-muted text-muted-foreground", dot: "bg-muted-foreground" },
    pending:   { label: "Pending",   classes: "bg-amber-500/10 text-amber-600 dark:text-amber-400", dot: "bg-amber-500 animate-pulse" },
    completed: { label: "Completed", classes: "bg-brand/10 text-brand", dot: "bg-brand" },
    cancelled: { label: "Cancelled", classes: "bg-muted text-muted-foreground", dot: "bg-muted-foreground" },
  };
  const { label, classes, dot } = config[state];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${classes}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  );
}

/* ── Run type badge ──────────────────────────────────────────────────────── */

function RunTypeBadge({ runType }: { runType: "recurring" | "one_time" }) {
  if (runType === "one_time") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:border-amber-800/40 dark:bg-amber-900/20 dark:text-amber-300">
        <CalendarDays className="h-2.5 w-2.5" />
        One-time
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-[10px] font-bold text-sky-700 dark:border-sky-800/40 dark:bg-sky-900/20 dark:text-sky-300">
      <RefreshCw className="h-2.5 w-2.5" />
      Recurring
    </span>
  );
}

/* ── Row ─────────────────────────────────────────────────────────────────── */

function ScheduledRunRow({ run }: { run: ScheduledRun }) {
  const { mutate: toggle, isPending: toggling } = useToggleScheduledRun();
  const { mutate: remove, isPending: deleting } = useDeleteScheduledRun();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const rowState = getRowState(run);
  const isOneTime = run.run_type === "one_time";
  const isDone = rowState === "completed" || rowState === "cancelled";

  return (
    <tr className="border-b border-border last:border-0 transition-colors hover:bg-muted/30">
      {/* Name + type badge */}
      <td className="px-4 py-4 md:px-6">
        <div className="flex flex-col gap-1">
          <p className="text-sm font-bold text-foreground">{run.name}</p>
          <RunTypeBadge runType={run.run_type} />
        </div>
      </td>

      {/* Objective */}
      <td className="hidden px-6 py-4 md:table-cell">
        <p className="max-w-[220px] truncate text-sm text-muted-foreground" title={run.objective}>
          {run.objective}
        </p>
      </td>

      {/* Frequency / label */}
      <td className="px-4 py-4 md:px-6">
        <span className="text-sm text-foreground">{run.frequency_label}</span>
      </td>

      {/* Next run / scheduled date */}
      <td className="hidden px-6 py-4 text-sm text-muted-foreground lg:table-cell">
        <div className="flex flex-col gap-1">
          {isDone ? (
            <span className="text-muted-foreground/60 italic">
              {rowState === "completed" ? "Executed" : "Cancelled"}
            </span>
          ) : (
            <span>{formatDatetime(run.next_run_at)}</span>
          )}
          {/* Reminder badge */}
          {!isDone && run.last_reminded_at && run.next_run_at &&
            run.last_reminded_at === run.next_run_at && (
            <span className="inline-flex w-fit items-center gap-1 rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-bold text-violet-600 dark:bg-violet-950/40 dark:text-violet-400">
              <Bell className="h-2.5 w-2.5" />
              Reminder sent
            </span>
          )}
        </div>
      </td>

      {/* Last run */}
      <td className="hidden px-6 py-4 text-sm text-muted-foreground xl:table-cell">
        {run.last_run_at ? (
          <div className="flex flex-col gap-0.5">
            <span>{formatDatetime(run.last_run_at)}</span>
            {isOneTime && rowState === "completed" && (
              <span className="inline-flex w-fit items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400">
                <CheckCircle2 className="h-2.5 w-2.5" />
                Executed
              </span>
            )}
          </div>
        ) : "—"}
      </td>

      {/* Status */}
      <td className="px-4 py-4 md:px-6">
        <StatusBadge state={rowState} />
      </td>

      {/* Actions */}
      <td className="px-4 py-4 md:px-6">
        <div className="flex items-center gap-2">
          {/* Completed/executed one-time runs: no toggle, just delete */}
          {!isDone && (
            <>
              {isOneTime ? (
                /* One-time pending: Cancel button (deactivates without deleting) */
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5 rounded-full px-3 text-xs border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-400"
                  disabled={toggling}
                  onClick={() => toggle({ id: run.id, is_active: false })}
                >
                  {toggling ? <Loader2 className="h-3 w-3 animate-spin" /> : <Pause className="h-3 w-3" />}
                  Cancel
                </Button>
              ) : (
                /* Recurring: Pause/Resume */
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5 rounded-full px-3 text-xs"
                  disabled={toggling}
                  onClick={() => toggle({ id: run.id, is_active: !run.is_active })}
                >
                  {toggling ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : run.is_active ? (
                    <Pause className="h-3 w-3" />
                  ) : (
                    <Play className="h-3 w-3" />
                  )}
                  {run.is_active ? "Pause" : "Resume"}
                </Button>
              )}
            </>
          )}

          {/* Delete with inline confirmation */}
          {confirmDelete ? (
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-destructive font-medium">Remove?</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 rounded-full px-2 text-xs text-destructive hover:bg-destructive/10"
                disabled={deleting}
                onClick={() => { remove(run.id); setConfirmDelete(false); }}
              >
                {deleting ? <Loader2 className="h-3 w-3 animate-spin" /> : "Yes"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 rounded-full px-2 text-xs"
                onClick={() => setConfirmDelete(false)}
              >
                No
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              disabled={deleting}
              onClick={() => setConfirmDelete(true)}
              title="Delete this scheduled run"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </td>
    </tr>
  );
}

/* ── Page ────────────────────────────────────────────────────────────────── */

export default function ScheduledRunsPage() {
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const { data: runs = [], isLoading, isError } = useScheduledRuns();

  const activeCount  = runs.filter((r) => r.run_type === "recurring" && r.is_active).length;
  const pendingCount = runs.filter((r) => r.run_type === "one_time" && r.is_active).length;

  return (
    <div className="space-y-6">
      <PageHeader title="Scheduled Payouts" description="One-time and recurring automated payouts.">
        <Button
          className="gap-2 rounded-full bg-brand px-5 text-sm text-white hover:opacity-90"
          onClick={() => setScheduleOpen(true)}
        >
          <CalendarClock className="h-4 w-4" />
          New Scheduled Payout
        </Button>
      </PageHeader>

      {/* Metric cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard
          label="Total Schedules"
          value={isLoading ? "…" : String(runs.length)}
          subtext="All configured automations"
          icon={<Zap className="h-4 w-4" />}
          accent="brand"
        />
        <MetricCard
          label="Active Recurring"
          value={isLoading ? "…" : String(activeCount)}
          subtext="Currently on schedule"
          icon={<CalendarClock className="h-4 w-4" />}
          accent="green"
        />
        <MetricCard
          label="Pending One-time"
          value={isLoading ? "…" : String(pendingCount)}
          subtext="Awaiting their scheduled date"
          icon={<CalendarDays className="h-4 w-4" />}
          accent="amber"
        />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                {[
                  { label: "Name",          classes: "px-4 md:px-6" },
                  { label: "Objective",     classes: "hidden px-6 md:table-cell" },
                  { label: "Frequency / Label", classes: "px-4 md:px-6" },
                  { label: "Next / Scheduled", classes: "hidden px-6 lg:table-cell" },
                  { label: "Last Executed", classes: "hidden px-6 xl:table-cell" },
                  { label: "Status",        classes: "px-4 md:px-6" },
                  { label: "Actions",       classes: "px-4 md:px-6" },
                ].map(({ label, classes }) => (
                  <th key={label} className={`${classes} py-3 text-xs font-black uppercase tracking-wider text-muted-foreground`}>
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-sm text-destructive">
                    Failed to load scheduled payouts. Please refresh.
                  </td>
                </tr>
              ) : runs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
                        <CalendarX2 className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <p className="text-base font-black text-foreground">No scheduled payouts yet</p>
                      <p className="max-w-xs text-sm text-muted-foreground">
                        Create a one-time or recurring payout to automate your workflows.
                      </p>
                      <Button
                        className="mt-1 gap-2 rounded-full bg-brand px-6 text-white hover:opacity-90"
                        onClick={() => setScheduleOpen(true)}
                      >
                        <CalendarClock className="h-4 w-4" />
                        New Scheduled Payout
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : (
                runs.map((run) => <ScheduledRunRow key={run.id} run={run} />)
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ScheduleRunModal open={scheduleOpen} onClose={() => setScheduleOpen(false)} />
    </div>
  );
}
