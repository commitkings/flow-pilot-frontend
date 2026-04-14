"use client";

import { useState } from "react";
import { CalendarClock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, TextInput, SelectInput, TextareaInput } from "@/components/ui/form-fields";
import { useCreateScheduledRun } from "@/hooks/use-scheduled-runs";

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

function nextBiweeklyMonday(): Date {
  const first = nextMonday();
  first.setDate(first.getDate() + 14);
  return first;
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
  const nextQuarterMonth =
    quarterMonths.find((m) => m > currentMonth) ?? 0 + 12;
  const year =
    nextQuarterMonth >= 12 ? d.getFullYear() + 1 : d.getFullYear();
  const month = nextQuarterMonth >= 12 ? 0 : nextQuarterMonth;
  return new Date(year, month, 1, 9, 0, 0);
}

const FREQUENCY_OPTIONS: FrequencyOption[] = [
  {
    label: "Weekly on Monday",
    value: "weekly_monday",
    cron: "0 9 * * 1",
    nextRunFn: nextMonday,
  },
  {
    label: "Bi-weekly (every 2 weeks)",
    value: "biweekly",
    cron: "0 9 */14 * *",
    nextRunFn: nextBiweeklyMonday,
  },
  {
    label: "Monthly on the 1st",
    value: "monthly_1",
    cron: "0 9 1 * *",
    nextRunFn: () => nextMonthDay(1),
  },
  {
    label: "Monthly on the 15th",
    value: "monthly_15",
    cron: "0 9 15 * *",
    nextRunFn: () => nextMonthDay(15),
  },
  {
    label: "Quarterly (1st of quarter)",
    value: "quarterly",
    cron: "0 9 1 1,4,7,10 *",
    nextRunFn: nextQuarter,
  },
];

const SELECT_OPTIONS = FREQUENCY_OPTIONS.map((o) => ({
  label: o.label,
  value: o.value,
}));

function formatNextRun(date: Date): string {
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

interface ScheduleRunModalProps {
  open: boolean;
  onClose: () => void;
  objectivePreset?: string;
}

export function ScheduleRunModal({
  open,
  onClose,
  objectivePreset = "",
}: ScheduleRunModalProps) {
  const [name, setName] = useState("");
  const [objective, setObjective] = useState(objectivePreset);
  const [frequency, setFrequency] = useState("");

  const { mutate: createScheduledRun, isPending } = useCreateScheduledRun();

  const selectedOption = FREQUENCY_OPTIONS.find((o) => o.value === frequency);
  const nextRun = selectedOption ? formatNextRun(selectedOption.nextRunFn()) : null;

  const canSubmit =
    name.trim().length > 0 &&
    objective.trim().length > 0 &&
    frequency.length > 0 &&
    !isPending;

  const handleSubmit = () => {
    if (!canSubmit || !selectedOption) return;
    createScheduledRun(
      {
        name: name.trim(),
        objective: objective.trim(),
        cron_expression: selectedOption.cron,
        frequency_label: selectedOption.label,
      },
      {
        onSuccess: () => {
          setName("");
          setObjective(objectivePreset);
          setFrequency("");
          onClose();
        },
      },
    );
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-border/60 bg-card shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-border bg-card px-6 py-5">
          <div>
            <h2 className="text-xl font-black tracking-tight text-foreground">
              Schedule a Run
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Set up a recurring automated payout run.
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="space-y-5">
            <Field label="Schedule Name">
              <TextInput
                value={name}
                onChange={setName}
                placeholder="e.g. Monthly Payroll"
              />
            </Field>

            <Field label="Objective">
              <TextareaInput
                value={objective}
                onChange={setObjective}
                placeholder="Describe what this run should do..."
              />
            </Field>

            <Field label="Frequency">
              <SelectInput
                value={frequency}
                onChange={setFrequency}
                placeholder="Select frequency..."
                options={SELECT_OPTIONS}
              />
            </Field>

            {nextRun && (
              <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-muted/40 px-4 py-3">
                <CalendarClock className="h-4 w-4 shrink-0 text-brand" />
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground/70">
                    Next run
                  </p>
                  <p className="text-sm font-semibold text-foreground">
                    {nextRun}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 flex items-center justify-between border-t border-border bg-card px-6 py-4">
          <Button
            variant="outline"
            className="rounded-full px-6"
            onClick={onClose}
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
                Scheduling...
              </>
            ) : (
              <>
                <CalendarClock className="h-4 w-4" />
                Schedule Run
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
