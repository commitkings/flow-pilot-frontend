"use client";

import { useState } from "react";
import {
  CalendarClock,
  CalendarX2,
  Loader2,
  Pause,
  Play,
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

function ActiveBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${
        active
          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          : "bg-muted text-muted-foreground"
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${active ? "bg-emerald-500" : "bg-muted-foreground"}`}
      />
      {active ? "Active" : "Paused"}
    </span>
  );
}

function ScheduledRunRow({ run }: { run: ScheduledRun }) {
  const { mutate: toggle, isPending: toggling } = useToggleScheduledRun();
  const { mutate: remove, isPending: deleting } = useDeleteScheduledRun();

  return (
    <tr className="border-b border-border last:border-0 transition-colors hover:bg-muted/30">
      <td className="px-4 py-4 md:px-6">
        <p className="text-sm font-bold text-foreground">{run.name}</p>
      </td>
      <td className="hidden px-6 py-4 md:table-cell">
        <p
          className="max-w-[240px] truncate text-sm text-muted-foreground"
          title={run.objective}
        >
          {run.objective}
        </p>
      </td>
      <td className="px-4 py-4 md:px-6">
        <span className="text-sm text-foreground">{run.frequency_label}</span>
      </td>
      <td className="hidden px-6 py-4 text-sm text-muted-foreground lg:table-cell">
        {formatDatetime(run.next_run_at)}
      </td>
      <td className="hidden px-6 py-4 text-sm text-muted-foreground xl:table-cell">
        {formatDatetime(run.last_run_at)}
      </td>
      <td className="px-4 py-4 md:px-6">
        <ActiveBadge active={run.is_active} />
      </td>
      <td className="px-4 py-4 md:px-6">
        <div className="flex items-center gap-2">
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
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            disabled={deleting}
            onClick={() => remove(run.id)}
          >
            {deleting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
          </Button>
        </div>
      </td>
    </tr>
  );
}

export default function ScheduledRunsPage() {
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const { data: runs = [], isLoading, isError } = useScheduledRuns();

  const activeCount = runs.filter((r) => r.is_active).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Scheduled Runs"
        description="Automated recurring payout runs."
      >
        <Button
          className="gap-2 rounded-full bg-brand px-5 text-sm text-white hover:opacity-90"
          onClick={() => setScheduleOpen(true)}
        >
          <CalendarClock className="h-4 w-4" />
          New Scheduled Run
        </Button>
      </PageHeader>

      {/* Metric cards */}
      <div className="grid gap-4 sm:grid-cols-2">
        <MetricCard
          label="Total Scheduled"
          value={isLoading ? "…" : String(runs.length)}
          subtext="Configured automations"
          icon={<Zap className="h-4 w-4" />}
          accent="brand"
        />
        <MetricCard
          label="Active"
          value={isLoading ? "…" : String(activeCount)}
          subtext="Currently running on schedule"
          icon={<CalendarClock className="h-4 w-4" />}
          accent="green"
        />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-4 py-3 text-xs font-black uppercase tracking-wider text-muted-foreground md:px-6">
                  Name
                </th>
                <th className="hidden px-6 py-3 text-xs font-black uppercase tracking-wider text-muted-foreground md:table-cell">
                  Objective
                </th>
                <th className="px-4 py-3 text-xs font-black uppercase tracking-wider text-muted-foreground md:px-6">
                  Frequency
                </th>
                <th className="hidden px-6 py-3 text-xs font-black uppercase tracking-wider text-muted-foreground lg:table-cell">
                  Next Run
                </th>
                <th className="hidden px-6 py-3 text-xs font-black uppercase tracking-wider text-muted-foreground xl:table-cell">
                  Last Run
                </th>
                <th className="px-4 py-3 text-xs font-black uppercase tracking-wider text-muted-foreground md:px-6">
                  Status
                </th>
                <th className="px-4 py-3 text-xs font-black uppercase tracking-wider text-muted-foreground md:px-6">
                  Actions
                </th>
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
                  <td
                    colSpan={7}
                    className="py-12 text-center text-sm text-destructive"
                  >
                    Failed to load scheduled runs. Please refresh.
                  </td>
                </tr>
              ) : runs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
                        <CalendarX2 className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <p className="text-base font-black text-foreground">
                        No scheduled runs yet
                      </p>
                      <p className="max-w-xs text-sm text-muted-foreground">
                        Create your first scheduled run to automate recurring
                        payout workflows.
                      </p>
                      <Button
                        className="mt-1 gap-2 rounded-full bg-brand px-6 text-white hover:opacity-90"
                        onClick={() => setScheduleOpen(true)}
                      >
                        <CalendarClock className="h-4 w-4" />
                        New Scheduled Run
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

      <ScheduleRunModal
        open={scheduleOpen}
        onClose={() => setScheduleOpen(false)}
      />
    </div>
  );
}
