"use client";

import { useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Check, Download, Loader2, Mail, Printer, Send, X } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useRun } from "@/hooks/use-run-queries";
import { useCandidates } from "@/hooks/use-candidate-queries";
import { useOrgProfile } from "@/hooks/use-settings-queries";
import { sendReceiptEmail } from "@/lib/api-client";
import { toast } from "sonner";
import type { PayoutCandidate } from "@/lib/mock-data";

/* ── Helpers ──────────────────────────────────────────────────── */

function formatCurrency(value: number): string {
  return `₦${value.toLocaleString("en-NG", { minimumFractionDigits: 2 })}`;
}

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const d = new Date(value);
  if (!Number.isFinite(d.getTime())) return "—";
  return d.toLocaleString("en-NG", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZoneName: "short",
  });
}

function maskAccount(acct: string): string {
  if (acct.length <= 4) return acct;
  return `${acct.slice(0, 3)}****${acct.slice(-3)}`;
}

function candidateStatus(c: PayoutCandidate): "paid" | "failed" | "held" | "pending" {
  if (c.executionStatus === "success") return "paid";
  if (c.executionStatus === "failed") return "failed";
  if (c.decision === "block" || c.approvalStatus === "blocked") return "held";
  return "pending";
}

function candidateStatusLabel(s: ReturnType<typeof candidateStatus>): string {
  return { paid: "Paid", failed: "Failed", held: "Held Back", pending: "Pending" }[s];
}

const STATUS_PILL: Record<ReturnType<typeof candidateStatus>, string> = {
  paid: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  failed: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  held: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  pending: "bg-muted text-muted-foreground",
};

/* ── Main Page ────────────────────────────────────────────────── */

export default function ReceiptPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data: run, isLoading: loadingRun } = useRun(id);
  const { data: candidates = [], isLoading: loadingCandidates } = useCandidates(id);
  const { data: org, isLoading: loadingOrg } = useOrgProfile();

  // For per-beneficiary print: null = full receipt, set = single beneficiary
  const [printCandidate, setPrintCandidate] = useState<PayoutCandidate | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  // Email receipt
  const [emailValue, setEmailValue] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const { mutate: sendEmail, isPending: sendingEmail } = useMutation({
    mutationFn: ({ email }: { email: string }) => sendReceiptEmail(id, email),
    onSuccess: () => {
      setEmailSent(true);
      toast.success("Receipt sent!", { description: `Sent to ${emailValue}` });
      setTimeout(() => setEmailSent(false), 4000);
    },
    onError: (err: Error) => {
      toast.error("Failed to send", { description: err.message });
    },
  });

  const isLoading = loadingRun || loadingCandidates || loadingOrg;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!run) {
    return (
      <div className="flex flex-col items-center gap-4 py-20">
        <p className="text-sm text-destructive">Payout not found.</p>
        <Button variant="outline" className="rounded-full gap-1.5" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />Go Back
        </Button>
      </div>
    );
  }

  const isCompleted = run.status === "completed" || run.status === "completed_with_errors";

  if (!isCompleted) {
    return (
      <div className="flex flex-col items-center gap-4 py-20">
        <p className="text-sm text-muted-foreground">
          Receipts are only available for completed payouts.
        </p>
        <Button variant="outline" className="rounded-full gap-1.5" onClick={() => router.push(`/dashboard/runs/${id}`)}>
          <ArrowLeft className="h-4 w-4" />Back to Payout
        </Button>
      </div>
    );
  }

  const successfulCandidates = candidates.filter((c) => c.executionStatus === "success");
  const payoutTotal = successfulCandidates.reduce((sum, c) => sum + (c.amount ?? 0), 0);
  const platformFeeAmount =
    run.platformFeeAmount != null
      ? run.platformFeeAmount
      : Math.ceil(payoutTotal * 0.002 * 100) / 100;
  const platformFeeRate = run.platformFeeRate != null ? run.platformFeeRate : 0.002;
  const totalDeducted = payoutTotal + platformFeeAmount;
  const receiptDate = run.approvedAt ?? run.startedAt;
  const orgName = org?.business_name ?? "—";

  function handlePrint(candidate?: PayoutCandidate) {
    setPrintCandidate(candidate ?? null);
    // Let React re-render with updated state before printing
    setTimeout(() => window.print(), 80);
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* ── Screen-only controls ── */}
      <div className="flex flex-col gap-3 mb-6 print:hidden">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-muted-foreground"
            onClick={() => router.push(`/dashboard/runs/${id}`)}
          >
            <ArrowLeft className="h-4 w-4" />Back to Payout
          </Button>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded-full gap-1.5"
              onClick={() => handlePrint()}
            >
              <Printer className="h-4 w-4" />Print
            </Button>
            <Button
              size="sm"
              className="rounded-full gap-1.5 bg-brand text-white hover:opacity-90"
              onClick={() => handlePrint()}
            >
              <Download className="h-4 w-4" />Save as PDF
            </Button>
          </div>
        </div>

        {/* Email receipt row */}
        <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-card px-4 py-2.5">
          <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            type="email"
            value={emailValue}
            onChange={(e) => setEmailValue(e.target.value)}
            placeholder="Vendor / recipient email address"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <Button
            size="sm"
            variant="outline"
            className="rounded-full gap-1.5 shrink-0"
            disabled={!emailValue.includes("@") || sendingEmail || emailSent}
            onClick={() => sendEmail({ email: emailValue })}
          >
            {sendingEmail ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : emailSent ? (
              <><Check className="h-3.5 w-3.5 text-emerald-600" />Sent</>
            ) : (
              <><Send className="h-3.5 w-3.5" />Send Receipt</>
            )}
          </Button>
        </div>
      </div>

      {/* ── Receipt card ── */}
      <div
        id="receipt"
        ref={printRef}
        className="rounded-2xl border border-border bg-white dark:bg-card p-8 space-y-8 print:rounded-none print:border-0 print:shadow-none print:p-0"
      >
        {/* When printing a single beneficiary, swap the header tag */}
        {printCandidate ? (
          <SingleBeneficiaryReceipt
            candidate={printCandidate}
            orgName={orgName}
            runId={id}
            receiptDate={receiptDate}
            approvedBy={run.approvedByUser?.name}
            onClose={() => setPrintCandidate(null)}
          />
        ) : (
          <FullReceipt
            orgName={orgName}
            runId={id}
            run={run}
            receiptDate={receiptDate}
            candidates={candidates}
            successfulCandidates={successfulCandidates}
            payoutTotal={payoutTotal}
            platformFeeAmount={platformFeeAmount}
            platformFeeRate={platformFeeRate}
            totalDeducted={totalDeducted}
            onPrintCandidate={(c) => handlePrint(c)}
          />
        )}
      </div>

      {/* ── Print styles ── */}
      <style
        dangerouslySetInnerHTML={{
          __html: `@media print{body *{visibility:hidden}#receipt,#receipt *{visibility:visible}#receipt{position:fixed;inset:0;padding:2rem;overflow:visible}}`,
        }}
      />
    </div>
  );
}

/* ── Full payout receipt ───────────────────────────────────────── */

function FullReceipt({
  orgName,
  runId,
  run,
  receiptDate,
  candidates,
  successfulCandidates,
  payoutTotal,
  platformFeeAmount,
  platformFeeRate,
  totalDeducted,
  onPrintCandidate,
}: {
  orgName: string;
  runId: string;
  run: ReturnType<typeof useRun>["data"];
  receiptDate: string | null | undefined;
  candidates: PayoutCandidate[];
  successfulCandidates: PayoutCandidate[];
  payoutTotal: number;
  platformFeeAmount: number;
  platformFeeRate: number;
  totalDeducted: number;
  onPrintCandidate: (c: PayoutCandidate) => void;
}) {
  return (
    <>
      {/* Header */}
      <div className="flex items-start justify-between border-b border-border pb-6">
        <div>
          <p className="text-2xl font-black tracking-tight text-foreground">{orgName}</p>
          <p className="mt-1 text-sm text-muted-foreground">Payout Receipt</p>
        </div>
        <div className="text-right">
          <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
            {run?.status === "completed" ? "Completed" : "Completed With Exceptions"}
          </span>
          <p className="mt-2 text-xs font-mono text-muted-foreground">Ref: {runId}</p>
        </div>
      </div>

      {/* Meta */}
      <div className="grid grid-cols-2 gap-6 sm:grid-cols-3">
        <ReceiptField label="Date" value={formatDate(receiptDate)} />
        <ReceiptField label="Organisation" value={orgName} />
        <ReceiptField label="Approved By" value={run?.approvedByUser?.name ?? "—"} />
        <ReceiptField label="Recipients Paid" value={String(successfulCandidates.length)} />
        <ReceiptField label="Total Recipients" value={String(candidates.length)} />
        <ReceiptField label="Objective" value={run?.objective ?? "—"} wide />
      </div>

      {/* Beneficiary table */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-black uppercase tracking-wider text-muted-foreground">
            Beneficiary Breakdown
          </p>
          <p className="text-[10px] text-muted-foreground print:hidden">
            Click a row to print an individual receipt
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b-2 border-border">
                {["Name", "Bank", "Account", "Amount", "Status", ""].map((h, i) => (
                  <th
                    key={i}
                    className={`pb-2 pr-4 text-left text-xs font-black uppercase tracking-wider text-muted-foreground ${i === 5 ? "print:hidden" : ""}`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {candidates.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-sm text-muted-foreground">
                    No beneficiary data available.
                  </td>
                </tr>
              ) : (
                candidates.map((c) => {
                  const st = candidateStatus(c);
                  return (
                    <tr key={c.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="py-2.5 pr-4 font-medium text-foreground">{c.beneficiaryName}</td>
                      <td className="py-2.5 pr-4 text-muted-foreground">{c.institution}</td>
                      <td className="py-2.5 pr-4 font-mono text-xs text-muted-foreground">{maskAccount(c.accountNumber)}</td>
                      <td className="py-2.5 pr-4 font-semibold text-foreground">{formatCurrency(c.amount ?? 0)}</td>
                      <td className="py-2.5 pr-4">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${STATUS_PILL[st]}`}>
                          {candidateStatusLabel(st)}
                        </span>
                      </td>
                      <td className="py-2.5 print:hidden">
                        <button
                          type="button"
                          onClick={() => onPrintCandidate(c)}
                          className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-[10px] font-semibold text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
                          title="Print individual receipt for this beneficiary"
                        >
                          <Printer className="h-3 w-3" />
                          Receipt
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Fee summary */}
      <div className="rounded-xl border border-border bg-muted/30 p-5">
        <p className="text-xs font-black uppercase tracking-wider text-muted-foreground mb-4">Transaction Summary</p>
        <div className="space-y-2 text-sm">
          <SummaryRow label={`Payout total (${successfulCandidates.length} recipients)`} value={formatCurrency(payoutTotal)} />
          <SummaryRow label={`Platform fee (${(platformFeeRate * 100).toFixed(1)}%)`} value={formatCurrency(platformFeeAmount)} dim />
          <div className="border-t border-border pt-2 mt-2">
            <SummaryRow label="Total deducted from wallet" value={formatCurrency(totalDeducted)} bold />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-border pt-4 text-center">
        <p className="text-[11px] text-muted-foreground">
          Generated by FlowPilot &middot; {formatDate(new Date().toISOString())}
        </p>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          This receipt is auto-generated. For disputes, contact your FlowPilot account manager.
        </p>
      </div>
    </>
  );
}

/* ── Single beneficiary receipt ────────────────────────────────── */

function SingleBeneficiaryReceipt({
  candidate,
  orgName,
  runId,
  receiptDate,
  approvedBy,
  onClose,
}: {
  candidate: PayoutCandidate;
  orgName: string;
  runId: string;
  receiptDate: string | null | undefined;
  approvedBy: string | undefined;
  onClose: () => void;
}) {
  const st = candidateStatus(candidate);

  return (
    <>
      {/* Close button — screen only */}
      <div className="flex items-center justify-between print:hidden mb-4">
        <p className="text-sm font-semibold text-muted-foreground">Individual Beneficiary Receipt</p>
        <button
          type="button"
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-muted transition-colors text-muted-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between border-b border-border pb-6">
        <div>
          <p className="text-2xl font-black tracking-tight text-foreground">{orgName}</p>
          <p className="mt-1 text-sm text-muted-foreground">Payment Receipt</p>
        </div>
        <div className="text-right">
          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${STATUS_PILL[st]}`}>
            {candidateStatusLabel(st)}
          </span>
          <p className="mt-2 text-xs font-mono text-muted-foreground">Ref: {runId.slice(0, 8)}</p>
        </div>
      </div>

      {/* Beneficiary details */}
      <div className="grid grid-cols-2 gap-6">
        <ReceiptField label="Beneficiary Name" value={candidate.beneficiaryName} />
        <ReceiptField label="Bank" value={candidate.institution} />
        <ReceiptField label="Account Number" value={maskAccount(candidate.accountNumber)} />
        <ReceiptField label="Amount Paid" value={formatCurrency(candidate.amount ?? 0)} />
        <ReceiptField label="Payment Date" value={formatDate(receiptDate)} />
        <ReceiptField label="Approved By" value={approvedBy ?? "—"} />
        <ReceiptField label="Payment Status" value={candidateStatusLabel(st)} />
        <ReceiptField label="Purpose" value={candidate.purpose || "—"} />
      </div>

      {/* Mini summary */}
      <div className="rounded-xl border border-border bg-muted/30 p-5">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Amount disbursed</span>
          <span className="text-lg font-black text-foreground">{formatCurrency(candidate.amount ?? 0)}</span>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-border pt-4 text-center">
        <p className="text-[11px] text-muted-foreground">
          Generated by FlowPilot &middot; {formatDate(new Date().toISOString())}
        </p>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          This is an official payment confirmation issued by {orgName} via FlowPilot.
        </p>
      </div>
    </>
  );
}

/* ── Sub-components ─────────────────────────────────────────────── */

function ReceiptField({ label, value, wide }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={wide ? "col-span-2 sm:col-span-3" : ""}>
      <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-foreground break-words">{value}</p>
    </div>
  );
}

function SummaryRow({
  label, value, bold, dim,
}: {
  label: string; value: string; bold?: boolean; dim?: boolean;
}) {
  return (
    <div className="flex justify-between items-center">
      <span className={bold ? "font-black text-foreground" : dim ? "text-muted-foreground" : "text-foreground"}>
        {label}
      </span>
      <span className={bold ? "font-black text-foreground" : "font-semibold text-foreground"}>
        {value}
      </span>
    </div>
  );
}
