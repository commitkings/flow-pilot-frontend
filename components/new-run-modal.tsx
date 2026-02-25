"use client";

import { useMemo, useState } from "react";
import { Rocket, Plus, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { institutions, naira } from "@/lib/mock-data";

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
    institution: values.institution ?? institutions[0],
    accountNumber: values.accountNumber ?? "",
    amount: values.amount ?? "",
    purpose: values.purpose ?? "",
  };
}

export function NewRunModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [objective, setObjective] = useState(
    "Reconcile all transactions from Feb 1 to Feb 14 and execute approved payroll payouts under risk threshold 0.35."
  );
  const [fromDate, setFromDate] = useState("2026-02-01");
  const [toDate, setToDate] = useState("2026-02-14");
  const [riskTolerance, setRiskTolerance] = useState(0.35);
  const [budgetCap, setBudgetCap] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
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
      row.beneficiaryName.trim().length === 0 ||
      row.institution.trim().length === 0 ||
      row.accountNumber.trim().length === 0 ||
      row.amount.trim().length === 0 ||
      row.purpose.trim().length === 0
  );

  const canSubmit =
    objective.trim().length > 0 && fromDate && toDate && recipients.length > 0 && !hasInvalidField;

  const closeAndResetValidation = () => {
    setSubmitted(false);
    onClose();
  };

  const updateRow = (id: string, patch: Partial<Recipient>) => {
    setRecipients((prev) => prev.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  };

  const removeRow = (id: string) => {
    setRecipients((prev) => (prev.length > 1 ? prev.filter((row) => row.id !== id) : prev));
  };

  const onSubmit = async () => {
    setSubmitted(true);
    if (!canSubmit) return;

    setSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 900));
    const newRunId = crypto.randomUUID();
    setSubmitting(false);
    closeAndResetValidation();
    router.push(`/dashboard/runs/${newRunId}`);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-[900px] overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-start justify-between border-b border-slate-200 bg-white px-6 py-5">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">Start a New Run.</h2>
            <p className="mt-1 text-sm text-slate-600">
              Describe your objective and configure the run parameters. Agents will handle the rest.
            </p>
          </div>
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={closeAndResetValidation}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="space-y-6 px-6 py-6">
          <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Objective</label>
                <textarea
                  value={objective}
                  onChange={(event) => setObjective(event.target.value)}
                  rows={4}
                  placeholder="e.g. Reconcile all transactions from Feb 1 to Feb 14 and execute approved payroll payouts under risk threshold 0.35."
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm italic text-slate-700 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
                <p className="mt-1 text-xs text-slate-500">
                  Write in plain English. Be specific about dates, thresholds, and what you want to do.
                </p>
              </div>

              <div>
                <p className="mb-1.5 text-sm font-medium text-slate-700">Transaction Date Range</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs text-slate-500">From</label>
                    <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="h-11 rounded-xl" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-slate-500">To</label>
                    <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="h-11 rounded-xl" />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-700">Risk Tolerance</label>
                  <span className="rounded-full bg-blue-100 px-2 py-1 text-sm font-semibold text-blue-700">
                    {riskTolerance.toFixed(2)}
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={riskTolerance}
                  onChange={(event) => setRiskTolerance(Number(event.target.value))}
                  className="w-full"
                />
                <div className="mt-2 overflow-hidden rounded-full border border-slate-200">
                  <div className="grid grid-cols-3 text-[10px] font-medium text-white">
                    <span className="bg-emerald-600 px-2 py-1">Allow (0.0-0.35)</span>
                    <span className="bg-amber-500 px-2 py-1">Review (0.35-0.65)</span>
                    <span className="bg-red-600 px-2 py-1">Block (0.65-1.0)</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Budget Cap (Optional)</label>
                <div className="flex h-11 overflow-hidden rounded-xl border border-slate-300 bg-white focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100">
                  <span className="inline-flex items-center border-r border-slate-300 px-3 text-sm text-slate-600">₦</span>
                  <input
                    value={budgetCap}
                    onChange={(event) => setBudgetCap(event.target.value)}
                    className="w-full px-3 text-sm outline-none"
                    placeholder="Maximum total amount"
                  />
                </div>
                <p className="mt-1 text-xs text-slate-500">Maximum total amount that can be disbursed in this run.</p>
              </div>

              <div className="rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-600">
                Current recipients total: <span className="font-semibold text-slate-900">{naira(total)}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-base font-semibold text-slate-900">Payout Recipients.</h3>
            <p className="mt-1 text-sm text-slate-600">
              Add the people or businesses you want to pay. Agents will verify and score each one.
            </p>

            <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full min-w-[860px] text-left text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="px-3 py-2 font-medium">Beneficiary Name</th>
                    <th className="px-3 py-2 font-medium">Bank / Institution</th>
                    <th className="px-3 py-2 font-medium">Account Number</th>
                    <th className="px-3 py-2 font-medium">Amount (₦)</th>
                    <th className="px-3 py-2 font-medium">Purpose</th>
                    <th className="w-12 px-3 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {recipients.map((row) => {
                    const invalid = submitted && (
                      row.beneficiaryName.trim().length === 0 ||
                      row.accountNumber.trim().length === 0 ||
                      row.amount.trim().length === 0 ||
                      row.purpose.trim().length === 0
                    );
                    return (
                      <tr key={row.id} className="border-t border-slate-200">
                        <td className="px-3 py-2 align-top">
                          <Input
                            value={row.beneficiaryName}
                            onChange={(e) => updateRow(row.id, { beneficiaryName: e.target.value })}
                            className={`h-10 rounded-lg ${invalid && row.beneficiaryName.trim().length === 0 ? "border-red-400" : ""}`}
                          />
                        </td>
                        <td className="px-3 py-2 align-top">
                          <select
                            value={row.institution}
                            onChange={(e) => updateRow(row.id, { institution: e.target.value })}
                            className="h-10 w-full rounded-lg border border-slate-300 px-2 text-sm outline-none focus:border-blue-600"
                          >
                            {institutions.map((institution) => (
                              <option key={institution} value={institution}>
                                {institution}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-2 align-top">
                          <Input
                            value={row.accountNumber}
                            onChange={(e) => updateRow(row.id, { accountNumber: e.target.value })}
                            className={`h-10 rounded-lg ${invalid && row.accountNumber.trim().length === 0 ? "border-red-400" : ""}`}
                          />
                        </td>
                        <td className="px-3 py-2 align-top">
                          <Input
                            value={row.amount}
                            onChange={(e) => updateRow(row.id, { amount: e.target.value })}
                            className={`h-10 rounded-lg ${invalid && row.amount.trim().length === 0 ? "border-red-400" : ""}`}
                          />
                        </td>
                        <td className="px-3 py-2 align-top">
                          <Input
                            value={row.purpose}
                            onChange={(e) => updateRow(row.id, { purpose: e.target.value })}
                            className={`h-10 rounded-lg ${invalid && row.purpose.trim().length === 0 ? "border-red-400" : ""}`}
                          />
                        </td>
                        <td className="px-3 py-2 align-top">
                          <Button variant="ghost" size="icon" className="h-10 w-10" onClick={() => removeRow(row.id)}>
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <button
              type="button"
              onClick={() => setRecipients((prev) => [...prev, recipientRow()])}
              className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-blue-300 text-sm font-medium text-blue-700 hover:bg-blue-50"
            >
              <Plus className="h-4 w-4" />
              Add Recipient
            </button>
          </div>

          {submitted && !canSubmit && (
            <p className="text-sm text-red-600">Fill all required fields. At least one valid recipient is required.</p>
          )}
        </div>

        <div className="sticky bottom-0 flex items-center justify-between border-t border-slate-200 bg-white px-6 py-4">
          <Button variant="ghost" onClick={closeAndResetValidation} className="rounded-xl text-slate-600 hover:bg-slate-100">
            Cancel
          </Button>
          <Button
            onClick={onSubmit}
            disabled={submitting}
            className="rounded-xl bg-blue-600 text-white hover:bg-blue-700"
          >
            {submitting ? "Starting..." : (
              <>
                <Rocket className="h-4 w-4" />
                Start Run
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
