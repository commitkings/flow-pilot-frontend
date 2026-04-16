"use client";

import { useState } from "react";
import { CalendarClock, CalendarDays, RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, TextInput, SelectInput, TextareaInput } from "@/components/ui/form-fields";
import { useCreateScheduledRun } from "@/hooks/use-scheduled-runs";
import type { ScheduledRunType } from "@/lib/api-scheduled-runs";

/* ── Recurring frequency helpers ────────────────────────────────────────────── */

interface FrequencyOption {
  label: string;
  value: string;
  cron: string;
  nextRunFn: () => Date;
}

function nextMonday(): Date {
  const d = new Date();
  const day = d.getDay();
  const daysUntilMonday = day === 1 ? 7 : (8 - day) % 7 || 7;
  d.setDate(d.getDate() + daysUntilMonday);
  d.setHours(9, 0, 0, 0);
  return d;
}

function nextBiMonthly(): Date {
  const now = new Date();
  for (const day of [1, 15]) {
    const candidate = new Date(now.getFullYear(), now.getMonth(), day, 9, 0, 0);
    if (candidate > now) return candidate;
  }
  return new Date(now.getFullYear(), now.getMonth() + 1, 1, 9, 0, 0);
}

function nextMonthDay(day: number): Date {
  const d = new Date();
  d.setDate(day);
  d.setHours(9, 0, 0, 0);
  if (d <= new Date()) {
    d.setMonth(d.getMonth() + 1);
    d.setDate(day);
  }
  return d;
}

function nextQuarter(): Date {
  const d = new Date();
  const quarterMonths = [0, 3, 6, 9];
  const currentMonth = d.getMonth();
  const nextQuarterMonth = quarterMonths.find((m) => m > currentMonth) ?? 12;
  const year = nextQuarterMonth >= 12 ? d.getFullYear() + 1 : d.getFullYear();
  const month = nextQuarterMonth >= 12 ? 0 : nextQuarterMonth;
  return new Date(year, month, 1, 9, 0, 0);
}

const FREQUENCY_OPTIONS: FrequencyOption[] = [
  { label: "Weekly on Monday",       value: "weekly_monday", cron: "0 9 * * 1",       nextRunFn: nextMonday },
  { label: "Bi-monthly (1st & 15th)", value: "biweekly",    cron: "0 9 1,15 * *",    nextRunFn: nextBiMonthly },
  { label: "Monthly on the 1st",      value: "monthly_1",   cron: "0 9 1 * *",       nextRunFn: () => nextMonthDay(1) },
  { label: "Monthly on the 15th",     value: "monthly_15",  cron: "0 9 15 * *",      nextRunFn: () => nextMonthDay(15) },
  { label: "Quarterly (1st of quarter)", value: "quarterly", cron: "0 9 1 1,4,7,10 *", nextRunFn: nextQuarter },
];

const RECURRING_SELECT_OPTIONS = [
  ...FREQUENCY_OPTIONS.map((o) => ({ label: o.label, value: o.value })),
  { label: "Custom (cron expression)", value: "custom" },
];

function isValidCron(expr: string): boolean {
  const trimmed = expr.trim();
  if (!trimmed) return false;
  const parts = trimmed.split(/\s+/);
  if (parts.length !== 5) return false;
  return parts.every((p) => /^[0-9*,\-/]+$/.test(p));
}

function formatDate(date: Date): string {
  return date.toLocaleString("en-NG", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/* ── Datetime-local input helpers ─────────────────────────────────────────── */

/** Minimum selectable datetime = now + 10 minutes, formatted for <input type="datetime-local"> */
function minDatetimeLocal(): string {
  const d = new Date(Date.now() + 10 * 60 * 1000);
  // datetime-local format: YYYY-MM-DDTHH:mm
  return d.toISOString().slice(0, 16);
}

/** Convert a datetime-local string (local time) to UTC ISO 8601 */
function localDatetimeToUTC(value: string): string {
  return new Date(value).toISOString();
}

/** Convert a datetime-local value to a readable label */
function formatDatetimeLocal(value: string): string {
  if (!value) return "";
  return formatDate(new Date(value));
}

/** True if the datetime-local value is at least 5 minutes in the future */
function isFuture(value: string): boolean {
  if (!value) return false;
  return new Date(value).getTime() > Date.now() + 5 * 60 * 1000;
}

/* ── Modal ────────────────────────────────────────────────────────────────── */

interface ScheduleRunModalProps {
  open: boolean;
  onClose: () => void;
  objectivePreset?: string;
}

export function ScheduleRunModal({ open, onClose, objectivePreset = "" }: ScheduleRunModalProps) {
  const [runType, setRunType] = useState<ScheduledRunType>("recurring");
  const [name, setName] = useState("");
  const [objective, setObjective] = useState(objectivePreset);

  // Recurring fields
  const [frequency, setFrequency] = useState("");
  const [customCron, setCustomCron] = useState("");

  // One-time fields
  const [runAt, setRunAt] = useState(""); // datetime-local string

  const { mutate: createScheduledRun, isPending } = useCreateScheduledRun();

  /* ── Derived state ── */
  const isCustom = frequency === "custom";
  const selectedOption = FREQUENCY_OPTIONS.find((o) => o.value === frequency);
  const customCronValid = isCustom ? isValidCron(customCron) : true;

  const nextRunPreview: string | null = (() => {
    if (runType === "one_time") {
      return runAt ? formatDatetimeLocal(runAt) : null;
    }
    if (selectedOption) return formatDate(selectedOption.nextRunFn());
    return null;
  })();

  const canSubmit: boolean = (() => {
    if (!name.trim() || !objective.trim() || isPending) return false;
    if (runType === "one_time") {
      return runAt.length > 0 && isFuture(runAt);
    }
    // recurring
    if (!frequency) return false;
    if (isCustom) return customCronValid;
    return true;
  })();

  /* ── Submit ── */
  const handleSubmit = () => {
    if (!canSubmit) return;

    let payload;
    if (runType === "one_time") {
      payload = {
        name: name.trim(),
        objective: objective.trim(),
        run_type: "one_time" as const,
        frequency_label: `One-time: ${formatDatetimeLocal(runAt)}`,
        run_at: localDatetimeToUTC(runAt),
      };
    } else {
      const cron_expression = isCustom ? customCron.trim() : selectedOption!.cron;
      const frequency_label = isCustom ? `Custom: ${customCron.trim()}` : selectedOption!.label;
      payload = {
        name: name.trim(),
        objective: objective.trim(),
        run_type: "recurring" as const,
        cron_expression,
        frequency_label,
      };
    }

    createScheduledRun(payload, {
      onSuccess: () => {
        resetForm();
        onClose();
      },
    });
  };

  const resetForm = () => {
    setRunType("recurring");
    setName("");
    setObjective(objectivePreset);
    setFrequency("");
    setCustomCron("");
    setRunAt("");
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) { resetForm(); onClose(); } }}
    >
      <div className="relative flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-border/60 bg-card shadow-2xl">

        {/* Header */}
        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-border bg-card px-6 py-5">
          <div>
            <h2 className="text-xl font-black tracking-tight text-foreground">Schedule a Payout</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Set up a one-time or recurring automated payout.
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
            onClick={() => { resetForm(); onClose(); }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">

          {/* Run type toggle */}
          <div>
            <p className="mb-2 text-xs font-black uppercase tracking-wider text-muted-foreground">
              Schedule Type
            </p>
            <div className="grid grid-cols-2 gap-2">
              <RunTypeButton
                active={runType === "one_time"}
                icon={<CalendarDays className="h-4 w-4" />}
                label="One-time"
                description="Runs once on a date you pick"
                onClick={() => setRunType("one_time")}
              />
              <RunTypeButton
                active={runType === "recurring"}
                icon={<RefreshCw className="h-4 w-4" />}
                label="Recurring"
                description="Repeats on a schedule"
                onClick={() => setRunType("recurring")}
              />
            </div>
          </div>

          {/* Common fields */}
          <Field label="Schedule Name">
            <TextInput
              value={name}
              onChange={setName}
              placeholder={runType === "one_time" ? "e.g. April Bonus Run" : "e.g. Monthly Payroll"}
            />
          </Field>

          <Field label="Objective">
            <TextareaInput
              value={objective}
              onChange={setObjective}
              placeholder="Describe what this payout run should do…"
            />
          </Field>

          {/* One-time: date/time picker */}
          {runType === "one_time" && (
            <Field label="Run Date & Time">
              <div className="space-y-1.5">
                <input
                  type="datetime-local"
                  value={runAt}
                  min={minDatetimeLocal()}
                  onChange={(e) => setRunAt(e.target.value)}
                  className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 [color-scheme:light] dark:[color-scheme:dark]"
                />
                {runAt && !isFuture(runAt) && (
                  <p className="px-1 text-[11px] font-semibold text-destructive">
                    Please choose a time at least 5 minutes from now.
                  </p>
                )}
                <p className="px-1 text-[11px] text-muted-foreground">
                  Time is in your local timezone. The run fires automatically at this moment.
                </p>
              </div>
            </Field>
          )}

          {/* Recurring: frequency select */}
          {runType === "recurring" && (
            <>
              <Field label="Frequency">
                <SelectInput
                  value={frequency}
                  onChange={(val) => {
                    setFrequency(val);
                    if (val !== "custom") setCustomCron("");
                  }}
                  placeholder="Select frequency…"
                  options={RECURRING_SELECT_OPTIONS}
                />
              </Field>

              {isCustom && (
                <Field label="Cron Expression">
                  <div className="space-y-1.5">
                    <TextInput
                      value={customCron}
                      onChange={setCustomCron}
                      placeholder="e.g. 0 9 * * 1  (Mondays at 9am)"
                    />
                    <p className="px-1 text-[11px] text-muted-foreground">
                      5 fields: minute hour day month weekday.{" "}
                      {customCron.trim() && !customCronValid && (
                        <span className="font-semibold text-destructive">Invalid expression.</span>
                      )}
                      {customCronValid && customCron.trim() && (
                        <span className="font-semibold text-emerald-500">Looks valid.</span>
                      )}
                    </p>
                  </div>
                </Field>
              )}
            </>
          )}

          {/* Next run preview */}
          {nextRunPreview && (
            <div className="flex items-start gap-3 rounded-2xl border border-border/60 bg-muted/40 px-4 py-3">
              <CalendarClock className="h-4 w-4 shrink-0 text-brand mt-0.5" />
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground/70">
                  {runType === "one_time" ? "Scheduled for" : "Next run"}
                </p>
                <p className="text-sm font-semibold text-foreground">{nextRunPreview}</p>
                {runType === "one_time" && (
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    This run will fire once and not repeat.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Credit notice */}
          <div className="rounded-xl border border-border bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
            Each run (including reruns) consumes <strong>1 AI credit</strong> when it executes.
            Make sure your credit balance is topped up before the scheduled date.
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 flex items-center justify-between border-t border-border bg-card px-6 py-4">
          <Button
            variant="outline"
            className="rounded-full px-6"
            onClick={() => { resetForm(); onClose(); }}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            className="gap-2 rounded-full bg-brand px-6 text-white hover:opacity-90 disabled:opacity-50"
            onClick={handleSubmit}
            disabled={!canSubmit}
          >
            {isPending ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Scheduling…
              </>
            ) : (
              <>
                <CalendarClock className="h-4 w-4" />
                {runType === "one_time" ? "Schedule One-time Run" : "Schedule Recurring Run"}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ── Run type button ─────────────────────────────────────────────────────── */

function RunTypeButton({
  active,
  icon,
  label,
  description,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-start gap-1 rounded-xl border px-4 py-3 text-left transition-all ${
        active
          ? "border-brand bg-brand/5 ring-2 ring-brand/20"
          : "border-border hover:border-brand/40 hover:bg-muted/40"
      }`}
    >
      <div className={`flex items-center gap-2 font-bold text-sm ${active ? "text-brand" : "text-foreground"}`}>
        {icon}
        {label}
      </div>
      <p className="text-[11px] text-muted-foreground leading-snug">{description}</p>
    </button>
  );
}
