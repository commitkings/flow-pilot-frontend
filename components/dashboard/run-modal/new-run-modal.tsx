"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Download, Plus, Rocket, Trash2, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { RightModal } from "@/components/modals/RightModal";
import {
  Field,
  TextInput,
  TextareaInput,
  DateRangeInput,
} from "@/components/ui/form-fields";
import { SelectInput } from "@/components/ui/form-fields";
import { institutions as fallbackInstitutions, naira } from "@/lib/mock-data";
import { createRun, listInstitutions } from "@/lib/api-client";
import type { CandidateInput } from "@/lib/api-types";
import { useAuth } from "@/context/auth-context";

type Recipient = {
  id: string;
  beneficiaryName: string;
  institution: string;
  accountNumber: string;
  amount: string;
  purpose: string;
};

function recipientRow(values: Partial<Recipient> = {}): Recipient {
  return {
    id: crypto.randomUUID(),
    beneficiaryName: values.beneficiaryName ?? "",
    institution: values.institution ?? "",
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
  const [institutions, setInstitutions] = useState<string[]>(fallbackInstitutions);
  const [objective, setObjective] = useState(
    "Reconcile all transactions from Feb 1 to Feb 14 and execute approved payroll payouts under risk threshold 0.35."
  );
  const [fromDate, setFromDate] = useState("2026-02-01");
  const [toDate, setToDate] = useState("2026-02-14");
  const [riskTolerance, setRiskTolerance] = useState(0.35);
  const [budgetCap, setBudgetCap] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [csvError, setCsvError] = useState<string | null>(null);
  const csvRef = useRef<HTMLInputElement>(null);

  // Load institutions from API, fall back to hardcoded list
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    listInstitutions()
      .then((res) => {
        if (!cancelled && res.data.length > 0) {
          setInstitutions(res.data.map((i) => i.institutionName));
        }
      })
      .catch(() => { /* keep fallback */ });
    return () => { cancelled = true; };
  }, [open]);

  const parseCsv = (text: string): Recipient[] => {
    const lines = text.split(/\r?\n/).filter((l) => l.trim());
    if (lines.length < 2) throw new Error("CSV must have a header row and at least one data row.");
    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/\s+/g, ""));
    const col = (cols: string[], key: string) => {
      const i = headers.indexOf(key);
      return i >= 0 ? (cols[i] ?? "").trim().replace(/^"|"$/g, "") : "";
    };
    return lines.slice(1).map((line) => {
      const cols = line.split(",");
      return recipientRow({
        beneficiaryName: col(cols, "beneficiaryname") || col(cols, "name"),
        institution: col(cols, "institution") || col(cols, "bank"),
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
      "beneficiaryName,institution,accountNumber,amount,purpose",
      "John Doe,GTBank,0123456789,50000,February Salary",
      "Jane Smith,Access Bank,9876543210,75000,Contractor Fee",
    ].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "recipients-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };
  const [recipients, setRecipients] = useState<Recipient[]>([
    recipientRow({
      beneficiaryName: "Chukwuemeka Adeyemi",
      institution: "GTBank",
      accountNumber: "054221789",
      amount: "450000",
      purpose: "February Salary",
    }),
    recipientRow({
      beneficiaryName: "Fatima Bello",
      institution: "Access Bank",
      accountNumber: "031998442",
      amount: "320000",
      purpose: "Contractor Fee",
    }),
  ]);

  const total = useMemo(
    () => recipients.reduce((acc, row) => acc + (Number(row.amount) || 0), 0),
    [recipients]
  );

  const hasInvalidField = recipients.some(
    (row) =>
      !row.beneficiaryName.trim() ||
      !row.institution.trim() ||
      !row.accountNumber.trim() ||
      !row.amount.trim() ||
      !row.purpose.trim()
  );

  const canSubmit =
    objective.trim().length > 0 &&
    fromDate &&
    toDate &&
    recipients.length > 0 &&
    !hasInvalidField;

  const closeAndReset = () => {
    setSubmitted(false);
    onClose();
  };

  const updateRow = (id: string, patch: Partial<Recipient>) =>
    setRecipients((prev) =>
      prev.map((row) => (row.id === id ? { ...row, ...patch } : row))
    );

  const removeRow = (id: string) =>
    setRecipients((prev) =>
      prev.length > 1 ? prev.filter((row) => row.id !== id) : prev
    );

  const onSubmit = async () => {
    setSubmitted(true);
    setSubmitError(null);
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const businessId = user?.memberships?.[0]?.business_id;
      if (!businessId) throw new Error("No business found on your account.");

      const candidates: CandidateInput[] = recipients.map((r) => ({
        institution_code: r.institution,
        beneficiary_name: r.beneficiaryName,
        account_number: r.accountNumber,
        amount: Number(r.amount),
        purpose: r.purpose,
      }));

      const result = await createRun({
        business_id: businessId,
        objective,
        risk_tolerance: riskTolerance,
        budget_cap: budgetCap ? Number(budgetCap) : undefined,
        candidates,
      });

      setSubmitting(false);
      closeAndReset();
      router.push(`/dashboard/runs/${result.run_id}`);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to create run.");
      setSubmitting(false);
    }
  };

  return (
    <RightModal
      open={open}
      onClose={closeAndReset}
      title="New Run"
      description="Describe your objective and configure run parameters."
      footer={
        <>
          <Button
            variant="ghost"
            onClick={closeAndReset}
            className="text-muted-foreground"
          >
            Cancel
          </Button>
          <div className="flex items-center gap-3">
            {submitError && (
              <p className="text-xs text-red-500">{submitError}</p>
            )}
            {submitted && !canSubmit && !submitError && (
              <p className="text-xs text-red-500">Fill all required fields.</p>
            )}
            <Button
              onClick={onSubmit}
              loading={submitting}
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
            Write in plain English. Be specific about dates, thresholds, and
            what you want to do.
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
              <span className="bg-emerald-600 px-2 py-1 text-center">
                Allow 0–0.35
              </span>
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
                  !row.accountNumber.trim() ||
                  !row.amount.trim() ||
                  !row.purpose.trim());

              return (
                <div
                  key={row.id}
                  className="group relative rounded-2xl p-4 border border-border bg-muted/20 transition-all hover:border-brand/30 hover:bg-muted/40"
                >
                  {/* Row header: Name + Delete Action */}
                  <div className="mb-4 flex items-center justify-between border-b border-border/50 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand/10 text-[10px] font-bold text-brand">
                        {recipients.indexOf(row) + 1}
                      </span>
                      <p className="text-sm font-bold text-foreground truncate max-w-[200px]">
                        {row.beneficiaryName || "New Recipient"}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeRow(row.id)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-600 focus:ring-2 focus:ring-red-200"
                      title="Remove recipient"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Responsive Grid Layout */}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-12">
                    {/* Name Field - Spans more space on large screens */}
                    <div className="lg:col-span-4">
                      <Field label="Beneficiary Name">
                        <TextInput
                          value={row.beneficiaryName}
                          onChange={(v) =>
                            updateRow(row.id, { beneficiaryName: v })
                          }
                          placeholder="Full name"
                          className={
                            invalid && !row.beneficiaryName.trim()
                              ? "border-red-500 bg-red-50/30"
                              : ""
                          }
                        />
                      </Field>
                    </div>

                    {/* Bank Selection */}
                    <div className="lg:col-span-3">
                      <Field label="Bank/Institution">
                        <SelectInput
                          value={row.institution}
                          onChange={(v) =>
                            updateRow(row.id, { institution: v })
                          }
                          placeholder="Select bank"
                          options={institutions}
                        />
                      </Field>
                    </div>

                    {/* Account Number */}
                    <div className="lg:col-span-2">
                      <Field label="Account No.">
                        <TextInput
                          value={row.accountNumber}
                          onChange={(v) =>
                            updateRow(row.id, { accountNumber: v })
                          }
                          placeholder="0000000000"
                          inputMode="numeric"
                          className={
                            invalid && !row.accountNumber.trim()
                              ? "border-red-500 bg-red-50/30"
                              : ""
                          }
                        />
                      </Field>
                    </div>

                    {/* Amount */}
                    <div className="lg:col-span-3">
                      <Field label="Amount (₦)">
                        <TextInput
                          value={row.amount}
                          onChange={(v) => updateRow(row.id, { amount: v })}
                          placeholder="0.00"
                          inputMode="decimal"
                          className={
                            invalid && !row.amount.trim()
                              ? "border-red-500 bg-red-50/30"
                              : ""
                          }
                        />
                      </Field>
                    </div>
                  </div>
                  <div className="col-span-full mt-3">
                    <Field label="Purpose">
                      <TextareaInput
                        value={row.purpose}
                        onChange={(v) => updateRow(row.id, { purpose: v })}
                        placeholder="e.g. February Salary"
                        className={`min-h-20 md:min-h-15 w-full resize-none ${invalid && !row.purpose.trim()
                            ? "border-red-500 bg-red-50/30"
                            : ""
                          }`}
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
