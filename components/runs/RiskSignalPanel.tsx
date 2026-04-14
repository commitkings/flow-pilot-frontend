"use client";

import type React from "react";
import { X, ShieldAlert, ShieldCheck, AlertTriangle, Info, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/status-badge";
import type { PayoutCandidate } from "@/lib/mock-data";

/* ── Types ─────────────────────────────────────────────────────── */

interface RiskSignal {
  label: string;
  severity: "high" | "medium" | "low" | "info";
  description: string;
}

export interface RiskSignalPanelProps {
  candidate: PayoutCandidate;
  onClose: () => void;
}

/* ── Bank code → name lookup ────────────────────────────────────── */

const BANK_NAMES: Record<string, string> = {
  "058": "GTBank",
  "044": "Access Bank",
  "011": "First Bank",
  "057": "Zenith Bank",
  "033": "United Bank for Africa",
  "068": "Standard Chartered",
  "214": "First City Monument Bank",
  "070": "Fidelity Bank",
  "035": "Wema Bank",
  "232": "Sterling Bank",
  "302": "Jaiz Bank",
  "076": "Polaris Bank",
  "082": "Keystone Bank",
  "101": "ProvidusBank",
  "221": "Stanbic IBTC",
  "301": "Jaiz Bank",
  "304": "Stanbic IBTC",
  "401": "Rand Merchant Bank",
  "100": "SunTrust Bank",
  "023": "CitiBank",
  "050": "Ecobank",
  "063": "Diamond Bank",
  "030": "Heritage Bank",
  "084": "Enterprise Bank",
  GTBank: "GTBank",
  "Access Bank": "Access Bank",
  "First Bank": "First Bank",
  "Zenith Bank": "Zenith Bank",
  UBA: "United Bank for Africa",
  "Stanbic IBTC": "Stanbic IBTC",
  "Fidelity Bank": "Fidelity Bank",
  "Wema Bank": "Wema Bank",
};

function resolveBankName(code: string): string {
  return BANK_NAMES[code] ?? code;
}

/* ── Mock signal generator ──────────────────────────────────────── */

function deriveMockSignals(riskScore: number): RiskSignal[] {
  if (riskScore > 0.7) {
    return [
      {
        label: "Duplicate account detected",
        severity: "high",
        description:
          "This account number appears more than once in the current payout run.",
      },
      {
        label: "Amount anomaly",
        severity: "high",
        description:
          "Payment amount exceeds the historical average for this beneficiary by more than 300%.",
      },
      {
        label: "Beneficiary name mismatch",
        severity: "high",
        description:
          "The name on the upload does not align closely with the name returned by the bank lookup service.",
      },
    ];
  }

  if (riskScore >= 0.4) {
    return [
      {
        label: "New beneficiary",
        severity: "medium",
        description:
          "This is the first transaction recorded for this beneficiary in FlowPilot.",
      },
      {
        label: "Amount in upper range",
        severity: "medium",
        description:
          "The payment amount falls in the top 20% of all amounts in this run.",
      },
    ];
  }

  return [
    {
      label: "Known beneficiary",
      severity: "low",
      description:
        "This beneficiary has 3 or more prior successful payouts with no disputes.",
    },
    {
      label: "Amount within normal range",
      severity: "info",
      description:
        "The payment amount is consistent with historical averages for this recipient.",
    },
  ];
}

/* ── Severity helpers ────────────────────────────────────────────── */

const SEVERITY_DOT: Record<RiskSignal["severity"], string> = {
  high: "bg-red-500",
  medium: "bg-amber-400",
  low: "bg-emerald-500",
  info: "bg-blue-400",
};

const SEVERITY_LABEL: Record<RiskSignal["severity"], string> = {
  high: "text-red-600 dark:text-red-400",
  medium: "text-amber-600 dark:text-amber-400",
  low: "text-emerald-600 dark:text-emerald-400",
  info: "text-blue-600 dark:text-blue-400",
};

const SEVERITY_ICON: Record<RiskSignal["severity"], React.ReactNode> = {
  high: <ShieldAlert className="h-3.5 w-3.5 shrink-0" />,
  medium: <AlertTriangle className="h-3.5 w-3.5 shrink-0" />,
  low: <ShieldCheck className="h-3.5 w-3.5 shrink-0" />,
  info: <Info className="h-3.5 w-3.5 shrink-0" />,
};

/* ── Risk score colour ───────────────────────────────────────────── */

function riskScoreColour(score: number): string {
  if (score > 0.7) return "text-red-600 dark:text-red-400";
  if (score >= 0.4) return "text-amber-500 dark:text-amber-400";
  return "text-emerald-600 dark:text-emerald-400";
}

function riskScoreBg(score: number): string {
  if (score > 0.7) return "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900";
  if (score >= 0.4) return "bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900";
  return "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900";
}

function riskDecisionStatus(
  decision: string,
): "allow" | "review" | "block" | "pending" {
  if (decision === "allow" || decision === "approve") return "allow";
  if (decision === "block" || decision === "reject") return "block";
  if (decision === "review") return "review";
  return "pending";
}

/* ── Component ──────────────────────────────────────────────────── */

export function RiskSignalPanel({ candidate, onClose }: RiskSignalPanelProps) {
  const riskScore = candidate.riskScore ?? 0;
  const signals: RiskSignal[] =
    candidate.riskReasons && candidate.riskReasons.length > 0
      ? candidate.riskReasons.map<RiskSignal>((reason) => ({
          label: reason,
          severity:
            riskScore > 0.7 ? "high" : riskScore >= 0.4 ? "medium" : "low",
          description: reason,
        }))
      : deriveMockSignals(riskScore);

  const bankName = resolveBankName(candidate.institution ?? "");
  const accountVerified = riskScore < 0.5;
  const decisionStatus = riskDecisionStatus(candidate.decision ?? "review");

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-lg rounded-2xl bg-card shadow-2xl border border-border overflow-hidden">
        {/* Header bar */}
        <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-5 border-b border-border">
          <div className="min-w-0 flex-1">
            <p className="text-lg font-bold text-foreground truncate">
              {candidate.beneficiaryName}
            </p>
            {candidate.accountNumber && (
              <p className="mt-0.5 font-mono text-xs text-muted-foreground tracking-wider">
                {candidate.accountNumber.slice(0, 3)}•••
                {candidate.accountNumber.slice(-3)}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-label="Close panel"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
          {/* Score + decision + amount strip */}
          <div className="grid grid-cols-3 gap-3 px-6 py-5 border-b border-border">
            {/* Risk score */}
            <div
              className={cn(
                "rounded-xl border px-4 py-3 text-center",
                riskScoreBg(riskScore),
              )}
            >
              <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-1">
                Risk Score
              </p>
              <p
                className={cn(
                  "text-2xl font-black tabular-nums",
                  riskScoreColour(riskScore),
                )}
              >
                {riskScore.toFixed(2)}
              </p>
            </div>

            {/* Decision */}
            <div className="rounded-xl border border-border px-4 py-3 flex flex-col items-center justify-center gap-1.5">
              <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                Decision
              </p>
              <StatusBadge status={decisionStatus} />
            </div>

            {/* Amount */}
            <div className="rounded-xl border border-border px-4 py-3 text-center">
              <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground mb-1">
                Amount
              </p>
              <p className="text-sm font-bold text-foreground">
                ₦{candidate.amount.toLocaleString("en-NG")}
              </p>
            </div>
          </div>

          {/* Risk signals */}
          <div className="px-6 py-5 border-b border-border">
            <p className="text-xs font-black uppercase tracking-wider text-muted-foreground mb-3">
              Risk Signals
            </p>
            <div className="space-y-2.5">
              {signals.map((signal, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 rounded-xl border border-border/60 bg-background px-4 py-3"
                >
                  <div
                    className={cn(
                      "mt-0.5 shrink-0",
                      SEVERITY_LABEL[signal.severity],
                    )}
                  >
                    {SEVERITY_ICON[signal.severity]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={cn(
                          "h-2 w-2 rounded-full shrink-0",
                          SEVERITY_DOT[signal.severity],
                        )}
                      />
                      <span className="text-sm font-semibold text-foreground">
                        {signal.label}
                      </span>
                      <span
                        className={cn(
                          "rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                          signal.severity === "high" &&
                            "border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400",
                          signal.severity === "medium" &&
                            "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-400",
                          signal.severity === "low" &&
                            "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400",
                          signal.severity === "info" &&
                            "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-400",
                        )}
                      >
                        {signal.severity}
                      </span>
                    </div>
                    {signal.label !== signal.description && (
                      <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                        {signal.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Account validation */}
          <div className="px-6 py-5">
            <div className="flex items-center gap-2 mb-3">
              <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
              <p className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                Account Validation
              </p>
            </div>
            <div className="rounded-xl border border-border/60 bg-background px-4 py-3 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Bank</span>
                <span className="font-semibold text-foreground">{bankName}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Account status</span>
                <StatusBadge
                  status={accountVerified ? "verified" : "requires_followup"}
                  label={accountVerified ? "Verified" : "Unverified"}
                />
              </div>
              {candidate.returnedName && candidate.returnedName !== candidate.beneficiaryName && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Name on record</span>
                  <span className="font-mono text-xs text-foreground">
                    {candidate.returnedName}
                  </span>
                </div>
              )}
              <p className="text-[11px] italic text-muted-foreground/70 pt-1 border-t border-border/40">
                Live validation via NIBSS is available in the Enterprise plan.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
