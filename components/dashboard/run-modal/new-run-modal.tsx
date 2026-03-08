"use client";

import { useMemo, useRef, useState } from "react";
import { Download, Plus, Rocket, Trash2, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { RightModal } from "@/components/modals/RightModal";
import {
  Field,
  TextInput,
  TextareaInput,
  DateRangeInput,
  SelectInput,
} from "@/components/ui/form-fields";
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

type InstitutionOption = {
  label: string;
  value: string;
  aliases: string[];
};

function normalizeInstitutionKey(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

function buildInstitutionOptions(institutions: Institution[]): InstitutionOption[] {
  return institutions.map((institution) => {
    const label = institution.shortName?.trim() || institution.institutionName;
    const aliases = [
      institution.institutionCode,
      institution.institutionName,
      institution.shortName,
      institution.nipCode,
      institution.cbnCode,
    ]
      .filter((alias): alias is string => Boolean(alias?.trim()))
      .map(normalizeInstitutionKey);

    return { label, value: institution.institutionCode, aliases };
  });
}

function resolveInstitutionCode(
  rawValue: string,
  institutionOptions: InstitutionOption[],
): string | null {
  const normalizedValue = normalizeInstitutionKey(rawValue);
  if (!normalizedValue) return null;
  const match = institutionOptions.find((option) => option.aliases.includes(normalizedValue));
  return match?.value ?? null;
}

function recipientRow(values: Partial<Recipient> = {}): Recipient {
  return {
    id: crypto.randomUUID(),
    beneficiaryName: values.beneficiaryName ?? "",
    institutionCode: values.institutionCode ?? "",
    accountNumber: values.accountNumber ?? "",
    amount: values.amount ?? "",
    purpose: values.purpose ?? "",
  };
}

export function NewRunModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const { user } = useAuth();

  const { data: institutionsData, isLoading: loadingInstitutions, isError: institutionsIsError } = useInstitutions(open);
  const institutionOptions = useMemo(
    () => buildInstitutionOptions(institutionsData?.data ?? []),
    [institutionsData],
  );
  const institutionsError = institutionsIsError ? "Unable to load institutions. Refresh and try again." : null;

  const [objective, setObjective] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [riskTolerance, setRiskTolerance] = useState(0.35);
  const [budgetCap, setBudgetCap] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [csvError, setCsvError] = useState<string | null>(null);
  const [recipients, setRecipients] = useState<Recipient[]>([recipientRow()]);
  const csvRef = useRef<HTMLInputElement>(null);

  const createRunMutation = useCreateRun((runId) => {
    closeAndReset();
    router.push(`/dashboard/runs/${runId}`);
  });

  const parseCsv = (text: string): Recipient[] => {
    if (institutionOptions.length === 0) {
      throw new Error("Institutions must finish loading before CSV import.");
    }
    const lines = text.split(/\r?\n/).filter((l) => l.trim());
    if (lines.length < 2) throw new Error("CSV must have a header row and at least one data row.");
    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/\s+/g, ""));
    const col = (cols: string[], key: string) => {
      const i = headers.indexOf(key);
      return i >= 0 ? (cols[i] ?? "").trim().replace(/^"|"$/g, "") : "";
    };
    return lines.slice(1).map((line, index) => {
      const cols = line.split(",");
      const rawInstitution =
        col(cols, "institution_code") || col(cols, "institution") || col(cols, "bank");
      const institutionCode = resolveInstitutionCode(rawInstitution, institutionOptions);
      if (!rawInstitution) throw new Error(`Row ${index + 2}: missing institution value.`);
      if (!institutionCode) {
        throw new Error(
          `Row ${index + 2}: unknown institution '${rawInstitution}'. Use a valid institution code.`,
        );
      }
      return recipientRow({
        beneficiaryName: col(cols, "beneficiaryname") || col(cols, "name"),
        institutionCode,
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
        if (parsed.length === 0) throw new Error("No valid recipients found in CSV.");
        setRecipients((prev) => [...prev, ...parsed]);
      } catch (err) {
        setCsvError(err instanceof Error ? err.message : "Failed to parse CSV.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const downloadTemplate = () => {
    const csv = [
      "beneficiaryName,institution_code,accountNumber,amount,purpose",
      "John Doe,058,0123456789,50000,February Salary",
      "Jane Smith,044,9876543210,75000,Contractor Fee",
    ].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "recipients-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const total = useMemo(
    () => recipients.reduce((acc, row) => acc + (Number(row.amount) || 0), 0),
    [recipients]
  );

  const hasInvalidField = recipients.some(
    (row) =>
      !row.beneficiaryName.trim() ||
      !row.institutionCode.trim() ||
      !row.accountNumber.trim() ||
      !row.amount.trim() ||
      !row.purpose.trim()
  );

  const canSubmit =
    objective.trim().length > 0 &&
    fromDate &&
    toDate &&
    recipients.length > 0 &&
    institutionOptions.length > 0 &&
    !loadingInstitutions &&
    !institutionsError &&
    !hasInvalidField;

  const closeAndReset = () => {
    setSubmitted(false);
    setSubmitError(null);
    setCsvError(null);
    onClose();
  };

  const updateRow = (id: string, patch: Partial<Recipient>) =>
    setRecipients((prev) => prev.map((row) => (row.id === id ? { ...row, ...patch } : row)));

  const removeRow = (id: string) =>
    setRecipients((prev) => (prev.length > 1 ? prev.filter((row) => row.id !== id) : prev));

  const onSubmit = () => {
    setSubmitted(true);
    setSubmitError(null);
    if (!canSubmit) return;

    const businessId = user?.memberships?.[0]?.business_id;
    if (!businessId) {
      setSubmitError("No business found on your account.");
      return;
    }

    createRunMutation.mutate({
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
    <RightModal
      open={open}
      onClose={closeAndReset}
      title="New Run"
      description="Describe your objective and configure run parameters."
      footer={
        <>
          <Button variant="ghost" onClick={closeAndReset} className="text-muted-foreground">
            Cancel
          </Button>
          <div className="flex items-center gap-3">
            {submitError && <p className="text-xs text-red-500">{submitError}</p>}
            {institutionsError && !submitError && (
              <p className="text-xs text-red-500">{institutionsError}</p>
            )}
            {submitted && !canSubmit && !submitError && (
              <p className="text-xs text-red-500">Fill all required fields.</p>
            )}
            <Button
              onClick={onSubmit}
              loading={createRunMutation.isPending}
              className="rounded-xl bg-brand text-white hover:opacity-90"
            >
              <Rocket className="h-4 w-4" />
              Start Run
            </Button>
          </div>
        </>
      }
    >
      <div className="space-y-4 md:space-y-5">
        {/* Objective */}
        <Field label="Objective">
          <TextareaInput
            value={objective}
            onChange={setObjective}
            placeholder="e.g. Reconcile all transactions from Feb 1 to Feb 14..."
            className="min-h-20 text-xs italic md:min-h-24 md:text-sm"
          />
          <p className="text-[10px] text-muted-foreground md:text-xs">
            Write in plain English. Be specific about dates, thresholds, and what you want to do.
          </p>
        </Field>

        {/* Date range */}
        <Field label="Transaction Date Range">
          <DateRangeInput
            from={fromDate}
            to={toDate}
            onFromChange={setFromDate}
            onToChange={setToDate}
          />
        </Field>

        {/* Risk + Budget */}
        <div className="space-y-4 bg-muted/30 py-4 md:rounded-2xl md:border md:border-border md:p-4">
          <Field label="Risk Tolerance">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Threshold</span>
              <span className="rounded-full bg-brand-muted px-2 py-0.5 text-xs font-black text-brand">
                {riskTolerance.toFixed(2)}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={riskTolerance}
              onChange={(e) => setRiskTolerance(Number(e.target.value))}
              className="mt-2 w-full accent-brand"
            />
            <div className="mt-2 grid grid-cols-3 overflow-hidden rounded-full border border-border text-[10px] font-bold text-white">
              <span className="bg-emerald-600 px-2 py-1 text-center">Allow 0–0.35</span>
              <span className="bg-amber-500 px-2 py-1 text-center">Review</span>
              <span className="bg-red-500 px-2 py-1 text-center">Block</span>
            </div>
          </Field>

          <Field label="Budget Cap (Optional)">
            <TextInput
              value={budgetCap}
              onChange={setBudgetCap}
              placeholder="₦ Maximum total amount"
              inputMode="decimal"
              className="h-11 rounded-xl"
            />
          </Field>

          <div className="rounded-xl border border-border bg-background px-3 py-2.5 text-xs text-muted-foreground">
            Recipients total:{" "}
            <span className="font-black text-foreground">{naira(total)}</span>
          </div>
        </div>

        {/* Recipients */}
        <div>
          <div className="mb-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="text-[16px] font-semibold text-foreground">Payout Recipients</h1>
                <p className="text-[12px] text-muted-foreground">
                  Agents will verify and risk-score each recipient.
                </p>
                {loadingInstitutions && (
                  <p className="mt-1 text-[11px] text-muted-foreground">Loading institutions...</p>
                )}
                {institutionsError && (
                  <p className="mt-1 text-[11px] text-red-500">{institutionsError}</p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={downloadTemplate}
                  className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-[11px] font-bold text-muted-foreground transition-colors hover:border-brand/40 hover:text-brand"
                >
                  <Download className="h-3 w-3" />
                  Template
                </button>
                <button
                  type="button"
                  onClick={() => csvRef.current?.click()}
                  className="flex items-center gap-1.5 rounded-full bg-brand/10 px-3 py-1.5 text-[11px] font-bold text-brand transition-colors hover:bg-brand/20"
                >
                  <Upload className="h-3 w-3" />
                  Upload CSV
                </button>
                <input
                  ref={csvRef}
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleCsvUpload}
                  className="sr-only"
                />
              </div>
            </div>
            {csvError && (
              <p className="mt-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[11px] text-red-600">
                {csvError}
              </p>
            )}
          </div>

          <div className="space-y-4">
            {recipients.map((row) => {
              const invalid =
                submitted &&
                (!row.beneficiaryName.trim() ||
                  !row.institutionCode.trim() ||
                  !row.accountNumber.trim() ||
                  !row.amount.trim() ||
                  !row.purpose.trim());

              return (
                <div
                  key={row.id}
                  className="group relative rounded-2xl border border-border bg-muted/20 p-4 transition-all hover:border-brand/30 hover:bg-muted/40"
                >
                  <div className="mb-4 flex items-center justify-between border-b border-border/50 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand/10 text-[10px] font-bold text-brand">
                        {recipients.indexOf(row) + 1}
                      </span>
                      <p className="max-w-50 truncate text-sm font-bold text-foreground">
                        {row.beneficiaryName || "New Recipient"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeRow(row.id)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-600"
                      title="Remove recipient"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="space-y-3">
                    <Field label="Beneficiary Name">
                      <TextInput
                        value={row.beneficiaryName}
                        onChange={(v) => updateRow(row.id, { beneficiaryName: v })}
                        placeholder="Full name"
                        className={invalid && !row.beneficiaryName.trim() ? "border-red-500 bg-red-50/30" : ""}
                      />
                    </Field>

                    <Field label="Bank / Institution">
                      <SelectInput
                        value={row.institutionCode}
                        onChange={(v) => updateRow(row.id, { institutionCode: v })}
                        placeholder={loadingInstitutions ? "Loading banks..." : "Select bank"}
                        options={institutionOptions}
                      />
                    </Field>

                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Account No.">
                        <TextInput
                          value={row.accountNumber}
                          onChange={(v) => updateRow(row.id, { accountNumber: v })}
                          placeholder="0000000000"
                          inputMode="numeric"
                          className={invalid && !row.accountNumber.trim() ? "border-red-500 bg-red-50/30" : ""}
                        />
                      </Field>

                      <Field label="Amount (₦)">
                        <TextInput
                          value={row.amount}
                          onChange={(v) => updateRow(row.id, { amount: v })}
                          placeholder="0.00"
                          inputMode="decimal"
                          className={invalid && !row.amount.trim() ? "border-red-500 bg-red-50/30" : ""}
                        />
                      </Field>
                    </div>

                    <Field label="Purpose">
                      <TextareaInput
                        value={row.purpose}
                        onChange={(v) => updateRow(row.id, { purpose: v })}
                        placeholder="e.g. February Salary"
                        className={`min-h-16 w-full resize-none ${invalid && !row.purpose.trim() ? "border-red-500 bg-red-50/30" : ""}`}
                      />
                    </Field>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => setRecipients((prev) => [...prev, recipientRow()])}
            className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-brand/40 text-xs font-bold text-brand transition-colors hover:bg-brand-muted md:h-11 md:text-sm"
          >
            <Plus className="h-4 w-4" />
            Add Recipient
          </button>
        </div>
      </div>
    </RightModal>
  );
}
