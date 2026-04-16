"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft, CalendarClock, CalendarDays, Download, Plus, RefreshCw, Rocket, Trash2, Upload,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Field, TextInput, TextareaInput, DateRangeInput, BankSelectInput, NumericInput, AmountInput, SelectInput,
} from "@/components/ui/form-fields";
import { naira } from "@/lib/mock-data";
import { useInstitutions } from "@/hooks/use-institutions";
import type { Institution } from "@/lib/api-types";
import { useAuth } from "@/context/auth-context";
import { useCreateScheduledRun } from "@/hooks/use-scheduled-runs";
import { useTeamMembers } from "@/hooks/use-team-queries";
import { useKycStatus } from "@/hooks/use-kyc-queries";
import { useCredits } from "@/hooks/use-credits";
import type { ScheduledRunType } from "@/lib/api-scheduled-runs";
import Link from "next/link";

/* ── Types ────────────────────────────────────────────────────────────────── */

type Recipient = {
  id: string;
  beneficiaryName: string;
  institutionCode: string;
  accountNumber: string;
  beneficiaryEmail: string;
  amount: string;
  purpose: string;
};

type InstitutionOption = { label: string; value: string; aliases: string[] };

/* ── Helpers ──────────────────────────────────────────────────────────────── */

function normalizeKey(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

function buildInstitutionOptions(institutions: Institution[]): InstitutionOption[] {
  return institutions.map((inst) => ({
    label: inst.shortName?.trim() || inst.institutionName,
    value: inst.institutionCode,
    aliases: [inst.institutionCode, inst.institutionName, inst.shortName, inst.nipCode, inst.cbnCode]
      .filter((a): a is string => Boolean(a?.trim()))
      .map(normalizeKey),
  }));
}

function resolveCode(raw: string, options: InstitutionOption[]) {
  const key = normalizeKey(raw);
  return options.find((o) => o.aliases.includes(key))?.value ?? null;
}

function createClientId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `id_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function emptyRow(values: Partial<Recipient> = {}): Recipient {
  return {
    id: createClientId(),
    beneficiaryName: values.beneficiaryName ?? "",
    institutionCode: values.institutionCode ?? "",
    accountNumber: values.accountNumber ?? "",
    beneficiaryEmail: values.beneficiaryEmail ?? "",
    amount: values.amount ?? "",
    purpose: values.purpose ?? "",
  };
}

/* ── Scheduling helpers ───────────────────────────────────────────────────── */

interface FrequencyOption { label: string; value: string; cron: string; nextRunFn: () => Date }

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
  if (d <= new Date()) { d.setMonth(d.getMonth() + 1); d.setDate(day); }
  return d;
}

function nextQuarter(): Date {
  const d = new Date();
  const quarterMonths = [0, 3, 6, 9];
  const nextQM = quarterMonths.find((m) => m > d.getMonth()) ?? 12;
  const year = nextQM >= 12 ? d.getFullYear() + 1 : d.getFullYear();
  return new Date(year, nextQM >= 12 ? 0 : nextQM, 1, 9, 0, 0);
}

const FREQUENCY_OPTIONS: FrequencyOption[] = [
  { label: "Weekly on Monday",          value: "weekly_monday", cron: "0 9 * * 1",        nextRunFn: nextMonday },
  { label: "Bi-monthly (1st & 15th)",   value: "biweekly",      cron: "0 9 1,15 * *",     nextRunFn: nextBiMonthly },
  { label: "Monthly on the 1st",         value: "monthly_1",     cron: "0 9 1 * *",        nextRunFn: () => nextMonthDay(1) },
  { label: "Monthly on the 15th",        value: "monthly_15",    cron: "0 9 15 * *",       nextRunFn: () => nextMonthDay(15) },
  { label: "Quarterly (1st of quarter)", value: "quarterly",     cron: "0 9 1 1,4,7,10 *", nextRunFn: nextQuarter },
];

const RECURRING_SELECT_OPTIONS = [
  ...FREQUENCY_OPTIONS.map((o) => ({ label: o.label, value: o.value })),
  { label: "Custom (cron expression)", value: "custom" },
];

function isValidCron(expr: string): boolean {
  const parts = expr.trim().split(/\s+/);
  return parts.length === 5 && parts.every((p) => /^[0-9*,\-/]+$/.test(p));
}

function minDatetimeLocal(): string {
  return new Date(Date.now() + 10 * 60 * 1000).toISOString().slice(0, 16);
}

function localDatetimeToUTC(value: string): string {
  return new Date(value).toISOString();
}

function isFuture(value: string): boolean {
  return Boolean(value) && new Date(value).getTime() > Date.now() + 5 * 60 * 1000;
}

function formatDatetimeLocal(value: string): string {
  if (!value) return "";
  return new Date(value).toLocaleString("en-NG", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit", hour12: true,
  });
}

function formatDate(date: Date): string {
  return date.toLocaleString("en-NG", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit", hour12: true,
  });
}

/* ── Page ─────────────────────────────────────────────────────────────────── */

export default function NewScheduledRunPage() {
  const router = useRouter();
  const { user } = useAuth();
  const businessId = user?.memberships?.[0]?.business_id;
  const role = user?.memberships?.[0]?.role;

  const { data: kycData } = useKycStatus();
  const { data: credits } = useCredits();
  const kycStatus = kycData?.kyc_status;
  const accountType = kycData?.limit_info?.account_type ?? "business";
  const isIndividual = accountType === "individual";

  // Analysts cannot create runs
  useEffect(() => {
    if (user && role === "analyst") router.replace("/dashboard/runs");
  }, [user, role, router]);

  // KYC gate
  if (kycData && kycStatus !== "verified") {
    return (
      <div className="mx-auto max-w-lg py-24 text-center space-y-5">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 mx-auto">
          <svg className="h-8 w-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-foreground">Verification Required</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {kycStatus === "pending"
            ? (isIndividual
                ? "Your identity is under review. You'll be able to create payouts once verification is complete."
                : "Your business documents are under review. You'll be able to create payouts once verification is complete.")
            : (isIndividual
                ? "Verify your identity (BVN or NIN) to start sending payouts."
                : "Complete business verification (KYC) before creating payouts.")}
        </p>
        <Link
          href="/dashboard/kyc"
          className="inline-flex items-center gap-2 rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:opacity-90"
        >
          {kycStatus === "pending" ? "Check Verification Status" : isIndividual ? "Verify Identity" : "Complete KYC"}
        </Link>
      </div>
    );
  }

  /* ── Scheduling state ── */
  const [runType, setRunType] = useState<ScheduledRunType>("recurring");
  const [scheduleName, setScheduleName] = useState("");
  const [frequency, setFrequency] = useState("");
  const [customCron, setCustomCron] = useState("");
  const [runAt, setRunAt] = useState("");

  /* ── Payout state ── */
  const { data: institutionsData, isLoading: loadingInstitutions, isError: institutionsIsError } = useInstitutions({ enabled: true });
  const institutionOptions = useMemo(() => buildInstitutionOptions(institutionsData?.data ?? []), [institutionsData]);
  const institutionsError = institutionsIsError ? "Unable to load institutions." : null;

  const [objective, setObjective] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [riskTolerance, setRiskTolerance] = useState(0.35);
  const [budgetCap, setBudgetCap] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [csvError, setCsvError] = useState<string | null>(null);
  const [csvDuplicateWarning, setCsvDuplicateWarning] = useState<string | null>(null);
  const [recipients, setRecipients] = useState<Recipient[]>([emptyRow()]);
  const [assignedApproverId, setAssignedApproverId] = useState("");

  const { data: teamData } = useTeamMembers();
  const currentUserId = user?.id;
  const approvalCapableMembers = (teamData?.members ?? []).filter(
    (m) => (m.role === "owner" || m.role === "approver") && m.is_active && !m.is_pending
  );
  const assignableMembers = approvalCapableMembers.length > 1
    ? approvalCapableMembers.filter((m) => m.user_id !== currentUserId)
    : approvalCapableMembers;
  const showReviewerSelect = approvalCapableMembers.length > 1;

  const csvRef = useRef<HTMLInputElement>(null);
  const { mutate: createScheduledRun, isPending } = useCreateScheduledRun();

  /* ── Derived scheduling state ── */
  const isCustom = frequency === "custom";
  const selectedOption = FREQUENCY_OPTIONS.find((o) => o.value === frequency);
  const customCronValid = isCustom ? isValidCron(customCron) : true;

  const nextRunPreview: string | null = (() => {
    if (runType === "one_time") return runAt ? formatDatetimeLocal(runAt) : null;
    if (selectedOption) return formatDate(selectedOption.nextRunFn());
    return null;
  })();

  /* ── CSV helpers ── */
  const parseCsv = (text: string): Recipient[] => {
    if (institutionOptions.length === 0) throw new Error("Institutions must finish loading before CSV import.");
    const lines = text.split(/\r?\n/).filter((l) => l.trim());
    if (lines.length < 2) throw new Error("CSV must have a header row and at least one data row.");
    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/\s+/g, ""));
    const col = (cols: string[], key: string) => {
      const i = headers.indexOf(key);
      return i >= 0 ? (cols[i] ?? "").trim().replace(/^"|"$/g, "") : "";
    };
    return lines.slice(1).map((line, idx) => {
      const cols = line.split(",");
      const raw = col(cols, "bank_name") || col(cols, "institution_code") || col(cols, "institution") || col(cols, "bank");
      const code = resolveCode(raw, institutionOptions);
      if (!raw) throw new Error(`Row ${idx + 2}: missing bank_name or institution_code.`);
      if (!code) throw new Error(`Row ${idx + 2}: unknown bank '${raw}'.`);
      return emptyRow({
        beneficiaryName: col(cols, "beneficiaryname") || col(cols, "name"),
        institutionCode: code,
        accountNumber: col(cols, "accountnumber") || col(cols, "account"),
        beneficiaryEmail: col(cols, "beneficiaryemail") || col(cols, "email"),
        amount: col(cols, "amount"),
        purpose: col(cols, "purpose"),
      });
    });
  };

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvError(null);
    setCsvDuplicateWarning(null);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = parseCsv(evt.target?.result as string);
        if (!parsed.length) throw new Error("No valid recipients found.");

        setRecipients((prev) => {
          const isOnlyBlankRow =
            prev.length === 1 &&
            !prev[0].beneficiaryName && !prev[0].institutionCode &&
            !prev[0].accountNumber && !prev[0].amount &&
            !prev[0].purpose && !prev[0].beneficiaryEmail;

          const existing = isOnlyBlankRow ? [] : prev;
          const existingKeys = new Set(existing.map((r) => `${r.institutionCode}:${r.accountNumber}`));
          const csvKeys = new Set<string>();
          const internalDupes: string[] = [];
          const externalDupes: string[] = [];

          for (const row of parsed) {
            const key = `${row.institutionCode}:${row.accountNumber}`;
            if (csvKeys.has(key)) internalDupes.push(row.accountNumber || key);
            else csvKeys.add(key);
            if (existingKeys.has(key)) externalDupes.push(row.accountNumber || key);
          }

          const warnings: string[] = [];
          if (internalDupes.length) warnings.push(`${internalDupes.length} duplicate(s) within the CSV (${internalDupes.slice(0, 3).join(", ")}${internalDupes.length > 3 ? "…" : ""})`);
          if (externalDupes.length) warnings.push(`${externalDupes.length} already in the list (${externalDupes.slice(0, 3).join(", ")}${externalDupes.length > 3 ? "…" : ""})`);
          if (warnings.length) setCsvDuplicateWarning("Duplicates detected — " + warnings.join("; ") + ". They were still added; remove any you don't need.");

          return isOnlyBlankRow ? parsed : [...prev, ...parsed];
        });
      } catch (err) {
        setCsvError(err instanceof Error ? err.message : "Failed to parse CSV.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const downloadTemplate = () => {
    const csv = [
      "beneficiaryName,bank_name,accountNumber,beneficiaryEmail,amount,purpose",
      "John Doe,Access Bank,0123456789,john.doe@example.com,50000,February Salary",
      "Jane Smith,GTBank,0987654321,,75000,Consultant Fee",
    ].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "beneficiaries-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const total = useMemo(() => recipients.reduce((acc, r) => acc + (Number(r.amount.replace(/,/g, "")) || 0), 0), [recipients]);

  const hasInvalidField = recipients.some(
    (r) => !r.beneficiaryName.trim() || !r.institutionCode.trim() || !r.accountNumber.trim() || !r.amount.trim() || !r.purpose.trim()
  );

  const scheduleValid = runType === "one_time"
    ? runAt.length > 0 && isFuture(runAt)
    : Boolean(frequency) && (isCustom ? customCronValid : true);

  const canSubmit =
    scheduleName.trim().length > 0 &&
    objective.trim().length > 0 &&
    fromDate && toDate &&
    recipients.length > 0 &&
    institutionOptions.length > 0 &&
    !loadingInstitutions && !institutionsError && !hasInvalidField &&
    scheduleValid && !isPending;

  const updateRow = (id: string, patch: Partial<Recipient>) =>
    setRecipients((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const removeRow = (id: string) =>
    setRecipients((prev) => (prev.length > 1 ? prev.filter((r) => r.id !== id) : prev));

  const onSubmit = () => {
    setSubmitted(true);
    setSubmitError(null);
    if (!canSubmit) return;
    if (!businessId) { setSubmitError("No business found on your account."); return; }

    const candidates = recipients.map((r) => ({
      institution_code: r.institutionCode,
      beneficiary_name: r.beneficiaryName,
      account_number: r.accountNumber,
      beneficiary_email: r.beneficiaryEmail?.trim() || undefined,
      amount: Number(r.amount.replace(/,/g, "")),
      purpose: r.purpose || undefined,
    }));

    const basePayload = {
      name: scheduleName.trim(),
      objective: objective.trim(),
      business_id: businessId,
      date_from: fromDate,
      date_to: toDate,
      risk_tolerance: riskTolerance,
      budget_cap: budgetCap ? Number(budgetCap.replace(/,/g, "")) : undefined,
      assigned_approver_id: assignedApproverId || undefined,
      candidates,
    };

    if (runType === "one_time") {
      createScheduledRun({
        ...basePayload,
        run_type: "one_time",
        frequency_label: `One-time: ${formatDatetimeLocal(runAt)}`,
        run_at: localDatetimeToUTC(runAt),
      }, { onSuccess: () => router.push("/dashboard/runs/scheduled") });
    } else {
      const cron_expression = isCustom ? customCron.trim() : selectedOption!.cron;
      const frequency_label = isCustom ? `Custom: ${customCron.trim()}` : selectedOption!.label;
      createScheduledRun({
        ...basePayload,
        run_type: "recurring",
        cron_expression,
        frequency_label,
      }, { onSuccess: () => router.push("/dashboard/runs/scheduled") });
    }
  };

  /* ── Render ── */
  return (
    <div className="mx-auto max-w-2xl space-y-10">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-xl font-black tracking-tight text-foreground md:text-2xl">Schedule a Payout</h1>
          <p className="hidden text-sm text-muted-foreground sm:block">Set up a one-time or recurring automated payout run.</p>
        </div>
      </div>

      {/* ── Schedule Section ── */}
      <section className="space-y-5">
        <h2 className="text-xs font-black uppercase tracking-wider text-muted-foreground">Schedule</h2>

        {/* Run type toggle */}
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

        <Field label="Schedule Name">
          <TextInput
            value={scheduleName}
            onChange={setScheduleName}
            placeholder={runType === "one_time" ? "e.g. April Bonus Run" : "e.g. Monthly Payroll"}
            className={submitted && !scheduleName.trim() ? "border-destructive" : ""}
          />
        </Field>

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

        {runType === "recurring" && (
          <>
            <Field label="Frequency">
              <SelectInput
                value={frequency}
                onChange={(val) => { setFrequency(val); if (val !== "custom") setCustomCron(""); }}
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
                    {customCron.trim() && !customCronValid && <span className="font-semibold text-destructive">Invalid expression.</span>}
                    {customCronValid && customCron.trim() && <span className="font-semibold text-emerald-500">Looks valid.</span>}
                  </p>
                </div>
              </Field>
            )}
          </>
        )}

        {nextRunPreview && (
          <div className="flex items-start gap-3 rounded-2xl border border-border/60 bg-muted/40 px-4 py-3">
            <CalendarClock className="h-4 w-4 shrink-0 text-brand mt-0.5" />
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground/70">
                {runType === "one_time" ? "Scheduled for" : "Next run"}
              </p>
              <p className="text-sm font-semibold text-foreground">{nextRunPreview}</p>
              {runType === "one_time" && (
                <p className="mt-0.5 text-[11px] text-muted-foreground">This run will fire once and not repeat.</p>
              )}
            </div>
          </div>
        )}
      </section>

      {/* ── Run Configuration ── */}
      <section className="space-y-5">
        <h2 className="text-xs font-black uppercase tracking-wider text-muted-foreground">Payout Configuration</h2>

        <Field label="Objective">
          <TextareaInput
            value={objective}
            onChange={setObjective}
            placeholder="e.g. Reconcile all payroll transactions and execute approved payouts under risk threshold 0.35."
            className="min-h-28 text-sm resize-none"
          />
          <p className="text-xs text-muted-foreground/60">Be specific about dates, thresholds, and intent.</p>
        </Field>

        <Field label="Transaction Date Range">
          <DateRangeInput from={fromDate} to={toDate} onFromChange={setFromDate} onToChange={setToDate} />
        </Field>

        <Field label="Risk Tolerance">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">Threshold</span>
            <span className="rounded-full bg-brand/10 px-2.5 py-0.5 text-xs font-black text-brand">
              {riskTolerance.toFixed(2)}
            </span>
          </div>
          <input
            type="range" min={0} max={1} step={0.01}
            value={riskTolerance}
            onChange={(e) => setRiskTolerance(Number(e.target.value))}
            className="w-full accent-brand"
          />
          <div className="mt-2 grid grid-cols-3 overflow-hidden rounded-lg text-[10px] font-bold text-white">
            <span className="bg-emerald-600 px-2 py-1.5 text-center">Low 0–0.35</span>
            <span className="bg-amber-500 px-2 py-1.5 text-center">Review</span>
            <span className="bg-red-500 px-2 py-1.5 text-center">Block</span>
          </div>
        </Field>

        <Field label="Budget Cap (Optional)">
          <AmountInput value={budgetCap} onChange={setBudgetCap} placeholder="e.g. 5,000,000" />
        </Field>

        {showReviewerSelect && (
          <Field label="Assign Reviewer">
            <select
              value={assignedApproverId}
              onChange={(e) => setAssignedApproverId(e.target.value)}
              className="flex h-10 w-full items-center rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
            >
              <option value="">Auto-assign</option>
              {assignableMembers.map((m) => (
                <option key={m.user_id} value={m.user_id}>
                  {m.user?.display_name || m.user?.email || m.user_id} ({m.role})
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground/60">
              Select who will review this run. Leave blank for automatic assignment.
            </p>
          </Field>
        )}
      </section>

      {/* ── Payout Recipients ── */}
      <section className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xs font-black uppercase tracking-wider text-muted-foreground">Payout Recipients</h2>
            <p className="mt-0.5 text-xs text-muted-foreground/60">
              {loadingInstitutions ? "Loading institutions…" : institutionsError ?? "Each recipient will be verified and risk-scored."}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={downloadTemplate}
              className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:border-brand/40 hover:text-brand"
            >
              <Download className="h-3 w-3" />
              Template
            </button>
            <button
              type="button"
              onClick={() => csvRef.current?.click()}
              className="flex items-center gap-1.5 rounded-full bg-brand/10 px-3 py-1.5 text-xs font-semibold text-brand transition-colors hover:bg-brand/20"
            >
              <Upload className="h-3 w-3" />
              Upload CSV
            </button>
            <input ref={csvRef} type="file" accept=".csv,text/csv" onChange={handleCsvUpload} className="sr-only" />
          </div>
        </div>

        {csvError && (
          <p className="rounded-lg bg-destructive/5 px-4 py-3 text-xs text-destructive">{csvError}</p>
        )}

        {csvDuplicateWarning && (
          <p className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-xs text-amber-800">
            ⚠ {csvDuplicateWarning}
          </p>
        )}

        <div className="space-y-4">
          {recipients.map((row, index) => {
            const invalid = submitted && (!row.beneficiaryName.trim() || !row.institutionCode.trim() || !row.accountNumber.trim() || !row.amount.trim() || !row.purpose.trim());
            return (
              <div key={row.id} className="relative rounded-2xl border border-border bg-card p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand/10 text-[10px] font-black text-brand">
                      {index + 1}
                    </span>
                    <span className="text-sm font-semibold text-foreground">
                      {row.beneficiaryName || "New Recipient"}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeRow(row.id)}
                    className="text-muted-foreground/40 hover:text-destructive transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Beneficiary Name" className="sm:col-span-2">
                    <TextInput
                      value={row.beneficiaryName}
                      onChange={(v) => updateRow(row.id, { beneficiaryName: v })}
                      placeholder="Full legal name"
                      className={invalid && !row.beneficiaryName.trim() ? "border-destructive" : ""}
                    />
                  </Field>

                  <Field label="Bank / Institution" className="sm:col-span-2">
                    <BankSelectInput
                      value={row.institutionCode}
                      onChange={(v) => updateRow(row.id, { institutionCode: v })}
                      placeholder={loadingInstitutions ? "Loading banks…" : "Search bank…"}
                      options={institutionOptions}
                    />
                  </Field>

                  <Field label="Account No.">
                    <NumericInput
                      value={row.accountNumber}
                      onChange={(v) => updateRow(row.id, { accountNumber: v })}
                      placeholder="0000000000"
                      className={invalid && !row.accountNumber.trim() ? "border-destructive" : ""}
                    />
                  </Field>

                  <Field label="Amount (₦)">
                    <AmountInput
                      value={row.amount}
                      onChange={(v) => updateRow(row.id, { amount: v })}
                      placeholder="e.g. 50,000"
                      className={invalid && !row.amount.trim() ? "border-destructive" : ""}
                    />
                  </Field>

                  <Field label="Purpose" className="sm:col-span-2">
                    <TextareaInput
                      value={row.purpose}
                      onChange={(v) => updateRow(row.id, { purpose: v })}
                      placeholder="e.g. February Salary"
                      className={`min-h-14 resize-none ${invalid && !row.purpose.trim() ? "border-destructive" : ""}`}
                    />
                  </Field>

                  <div className="sm:col-span-2 space-y-2">
                    <label className="block text-[11px] font-black uppercase tracking-wider text-muted-foreground/80">
                      Email <span className="font-normal normal-case tracking-normal text-muted-foreground/50">(optional — beneficiary gets payment notification)</span>
                    </label>
                    <TextInput
                      value={row.beneficiaryEmail}
                      onChange={(v) => updateRow(row.id, { beneficiaryEmail: v })}
                      placeholder="beneficiary@example.com"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {recipients.length > 0 && total > 0 && (
          <div className="flex items-center justify-between rounded-xl border border-border bg-muted/40 px-4 py-2.5">
            <span className="text-xs text-muted-foreground">{recipients.length} recipient{recipients.length !== 1 ? "s" : ""}</span>
            <span className="text-sm font-black text-foreground">{naira(total)}</span>
          </div>
        )}

        <button
          type="button"
          onClick={() => setRecipients((prev) => [...prev, emptyRow()])}
          className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-brand/30 text-sm font-semibold text-brand transition-colors hover:bg-brand/5 hover:border-brand/50"
        >
          <Plus className="h-4 w-4" />
          Add Recipient
        </button>
      </section>

      {/* Credit usage notice */}
      {credits != null && (
        <div className={`flex items-center justify-between rounded-xl border px-4 py-2.5 text-xs ${
          credits.balance === 0
            ? "border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300"
            : "border-border bg-muted/40 text-muted-foreground"
        }`}>
          <span>
            Each run execution uses <span className="font-semibold">1 AI credit</span>.
            {credits.balance === 0
              ? " You have no credits remaining."
              : ` You have ${credits.balance} credit${credits.balance !== 1 ? "s" : ""} remaining.`}
          </span>
          {credits.balance === 0 && (
            <a href="/dashboard/wallet" className="font-semibold text-brand hover:underline ml-2 shrink-0">Buy credits</a>
          )}
        </div>
      )}

      {/* Amount breakdown */}
      {total > 0 && (() => {
        const fee = Math.ceil(total * 0.002 * 100) / 100;
        const grandTotal = total + fee;
        return (
          <div className="rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm space-y-1">
            <div className="flex items-center justify-between text-muted-foreground">
              <span>{recipients.length} recipient{recipients.length !== 1 ? "s" : ""}</span>
              <span>{naira(total)}</span>
            </div>
            <div className="flex items-center justify-between text-muted-foreground">
              <span>Platform fee (0.2%)</span>
              <span>{naira(fee)}</span>
            </div>
            <div className="flex items-center justify-between border-t border-border pt-1 font-black text-foreground">
              <span>Total deduction</span>
              <span>{naira(grandTotal)}</span>
            </div>
          </div>
        );
      })()}

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 pb-8">
        <div className="text-sm text-muted-foreground">
          {total > 0
            ? <><span className="font-black text-foreground">{recipients.length}</span> recipient{recipients.length !== 1 ? "s" : ""}</>
            : <span>No amounts entered yet</span>
          }
        </div>
        <div className="flex items-center gap-3">
          {(submitError || (submitted && !canSubmit)) && (
            <p className="text-xs text-destructive">{submitError ?? "Fill all required fields."}</p>
          )}
          <Button
            onClick={onSubmit}
            loading={isPending}
            className="gap-2 rounded-full bg-brand px-8 text-white hover:opacity-90"
          >
            <Rocket className="h-4 w-4" />
            {runType === "one_time" ? "Schedule One-time Payout" : "Schedule Recurring Payout"}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ── Run type button ────────────────────────────────────────────────────────── */

function RunTypeButton({ active, icon, label, description, onClick }: {
  active: boolean; icon: React.ReactNode; label: string; description: string; onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-start gap-1 rounded-xl border px-4 py-3 text-left transition-all ${
        active ? "border-brand bg-brand/5 ring-2 ring-brand/20" : "border-border hover:border-brand/40 hover:bg-muted/40"
      }`}
    >
      <div className={`flex items-center gap-2 font-bold text-sm ${active ? "text-brand" : "text-foreground"}`}>
        {icon} {label}
      </div>
      <p className="text-[11px] text-muted-foreground leading-snug">{description}</p>
    </button>
  );
}
