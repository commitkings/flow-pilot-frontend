"use client";

import { useMemo, useRef, useState } from "react";
import { ArrowLeft, Download, Plus, Rocket, Trash2, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Field, TextInput, TextareaInput, DateRangeInput, SelectInput } from "@/components/ui/form-fields";
import { naira } from "@/lib/mock-data";
import { useInstitutions } from "@/hooks/use-institutions";
import type { Institution } from "@/lib/api-types";
import { useAuth } from "@/context/auth-context";
import { useCreateRun } from "@/hooks/use-run-mutations";

type Recipient = {
  id: string;
  beneficiaryName: string;
  institutionCode: string;
  accountNumber: string;
  amount: string;
  purpose: string;
};

type InstitutionOption = { label: string; value: string; aliases: string[] };

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

function emptyRow(values: Partial<Recipient> = {}): Recipient {
  return {
    id: crypto.randomUUID(),
    beneficiaryName: values.beneficiaryName ?? "",
    institutionCode: values.institutionCode ?? "",
    accountNumber: values.accountNumber ?? "",
    amount: values.amount ?? "",
    purpose: values.purpose ?? "",
  };
}

export default function NewRunPage() {
  const router = useRouter();
  const { user } = useAuth();

  const { data: institutionsData, isLoading: loadingInstitutions, isError: institutionsIsError } = useInstitutions(true);
  const institutionOptions = useMemo(
    () => buildInstitutionOptions(institutionsData?.data ?? []),
    [institutionsData]
  );
  const institutionsError = institutionsIsError ? "Unable to load institutions." : null;

  const [objective, setObjective] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [riskTolerance, setRiskTolerance] = useState(0.35);
  const [budgetCap, setBudgetCap] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [csvError, setCsvError] = useState<string | null>(null);
  const [recipients, setRecipients] = useState<Recipient[]>([emptyRow()]);
  const csvRef = useRef<HTMLInputElement>(null);

  const createRun = useCreateRun((runId) => router.push(`/dashboard/runs/${runId}`));

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
      const raw = col(cols, "institution_code") || col(cols, "institution") || col(cols, "bank");
      const code = resolveCode(raw, institutionOptions);
      if (!raw) throw new Error(`Row ${idx + 2}: missing institution.`);
      if (!code) throw new Error(`Row ${idx + 2}: unknown institution '${raw}'.`);
      return emptyRow({
        beneficiaryName: col(cols, "beneficiaryname") || col(cols, "name"),
        institutionCode: code,
        accountNumber: col(cols, "accountnumber") || col(cols, "account"),
        amount: col(cols, "amount"),
        purpose: col(cols, "purpose"),
      });
    });
  };

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvError(null);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = parseCsv(evt.target?.result as string);
        if (!parsed.length) throw new Error("No valid recipients found.");
        setRecipients((prev) => [...prev, ...parsed]);
      } catch (err) {
        setCsvError(err instanceof Error ? err.message : "Failed to parse CSV.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const downloadTemplate = () => {
    const csv = ["beneficiaryName,institution_code,accountNumber,amount,purpose", "John Doe,058,0123456789,50000,February Salary"].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "recipients-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const total = useMemo(() => recipients.reduce((acc, r) => acc + (Number(r.amount) || 0), 0), [recipients]);

  const hasInvalidField = recipients.some(
    (r) => !r.beneficiaryName.trim() || !r.institutionCode.trim() || !r.accountNumber.trim() || !r.amount.trim() || !r.purpose.trim()
  );

  const canSubmit =
    objective.trim().length > 0 && fromDate && toDate &&
    recipients.length > 0 && institutionOptions.length > 0 &&
    !loadingInstitutions && !institutionsError && !hasInvalidField;

  const updateRow = (id: string, patch: Partial<Recipient>) =>
    setRecipients((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  const removeRow = (id: string) =>
    setRecipients((prev) => (prev.length > 1 ? prev.filter((r) => r.id !== id) : prev));

  const onSubmit = () => {
    setSubmitted(true);
    setSubmitError(null);
    if (!canSubmit) return;
    const businessId = user?.memberships?.[0]?.business_id;
    if (!businessId) { setSubmitError("No business found on your account."); return; }
    createRun.mutate({
      business_id: businessId,
      created_by: user?.id,
      objective: objective.trim(),
      date_from: fromDate,
      date_to: toDate,
      risk_tolerance: riskTolerance,
      budget_cap: budgetCap ? Number(budgetCap) : undefined,
      candidates: recipients.map((r) => ({
        institution_code: r.institutionCode,
        beneficiary_name: r.beneficiaryName,
        account_number: r.accountNumber,
        amount: Number(r.amount),
        purpose: r.purpose || undefined,
      })),
    });
  };

  return (
    <div className="mx-auto max-w-2xl space-y-10">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">New Run</h1>
          <p className="text-sm text-muted-foreground">Configure your objective and payout recipients.</p>
        </div>
      </div>

      {/* Run Configuration */}
      <section className="space-y-5">
        <h2 className="text-xs font-black uppercase tracking-wider text-muted-foreground">Run Configuration</h2>

        <Field label="Objective">
          <TextareaInput
            value={objective}
            onChange={setObjective}
            placeholder="e.g. Reconcile all payroll transactions from Feb 1–14 and execute approved payouts under risk threshold 0.35."
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
          <TextInput
            value={budgetCap}
            onChange={setBudgetCap}
            placeholder="₦ Maximum total"
            inputMode="decimal"
          />
        </Field>
      </section>

      {/* Payout Recipients */}
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
          <p className="rounded-lg bg-destructive/5 px-4 py-3 text-xs text-destructive">
            {csvError}
          </p>
        )}

        <div className="space-y-6">
          {recipients.map((row, index) => {
            const invalid = submitted && (!row.beneficiaryName.trim() || !row.institutionCode.trim() || !row.accountNumber.trim() || !row.amount.trim() || !row.purpose.trim());
            return (
              <div key={row.id} className="space-y-3">
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
                    <SelectInput
                      value={row.institutionCode}
                      onChange={(v) => updateRow(row.id, { institutionCode: v })}
                      placeholder={loadingInstitutions ? "Loading banks…" : "Select bank"}
                      options={institutionOptions}
                    />
                  </Field>

                  <Field label="Account No.">
                    <TextInput
                      value={row.accountNumber}
                      onChange={(v) => updateRow(row.id, { accountNumber: v })}
                      placeholder="0000000000"
                      inputMode="numeric"
                      className={invalid && !row.accountNumber.trim() ? "border-destructive" : ""}
                    />
                  </Field>

                  <Field label="Amount (₦)">
                    <TextInput
                      value={row.amount}
                      onChange={(v) => updateRow(row.id, { amount: v })}
                      placeholder="0.00"
                      inputMode="decimal"
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
                </div>

                {index < recipients.length - 1 && <hr className="border-border" />}
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => setRecipients((prev) => [...prev, emptyRow()])}
          className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-brand/30 text-sm font-semibold text-brand transition-colors hover:bg-brand/5 hover:border-brand/50"
        >
          <Plus className="h-4 w-4" />
          Add Recipient
        </button>
      </section>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 pb-8">
        <div className="text-sm text-muted-foreground">
          Total: <span className="font-black text-foreground">{naira(total)}</span>
          <span className="ml-2 text-muted-foreground/60">· {recipients.length} recipient{recipients.length !== 1 ? "s" : ""}</span>
        </div>
        <div className="flex items-center gap-3">
          {(submitError || (submitted && !canSubmit)) && (
            <p className="text-xs text-destructive">{submitError ?? "Fill all required fields."}</p>
          )}
          <Button
            onClick={onSubmit}
            loading={createRun.isPending}
            className="gap-2 rounded-full bg-brand px-8 text-white hover:opacity-90"
          >
            <Rocket className="h-4 w-4" />
            Start Run
          </Button>
        </div>
      </div>
    </div>
  );
}
