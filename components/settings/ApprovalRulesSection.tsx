"use client";

import { useState } from "react";
import {
  CheckCircle2,
  Loader2,
  Plus,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useApprovalRules,
  useCreateApprovalRule,
  useUpdateApprovalRule,
  useDeleteApprovalRule,
} from "@/hooks/use-approval-rules";
import type { ApprovalRule } from "@/lib/api-developer";

type Condition = ApprovalRule["condition"];

const CONDITION_OPTIONS: { value: Condition; label: string }[] = [
  { value: "amount_above", label: "Amount above threshold" },
  { value: "risk_score_above", label: "Risk score above threshold" },
  { value: "always", label: "Always require" },
];

function formatConditionDescription(rule: ApprovalRule): string {
  switch (rule.condition) {
    case "amount_above":
      return `When amount exceeds \u20a6${(rule.threshold / 100).toLocaleString("en-NG")}`;
    case "risk_score_above":
      return `When risk score exceeds ${rule.threshold.toFixed(2)}`;
    case "always":
      return "Always required for every run";
    default:
      return rule.condition;
  }
}

export function ApprovalRulesSection() {
  const rulesQuery = useApprovalRules();
  const createRuleMut = useCreateApprovalRule();
  const updateRuleMut = useUpdateApprovalRule();
  const deleteRuleMut = useDeleteApprovalRule();

  const [addOpen, setAddOpen] = useState(false);
  const [formName, setFormName] = useState("");
  const [formCondition, setFormCondition] = useState<Condition>("amount_above");
  const [formThreshold, setFormThreshold] = useState("");
  const [formApprovers, setFormApprovers] = useState<1 | 2>(1);

  const rules: ApprovalRule[] = rulesQuery.data?.rules ?? [];

  const resetForm = () => {
    setFormName("");
    setFormCondition("amount_above");
    setFormThreshold("");
    setFormApprovers(1);
  };

  const computedThreshold = (): number => {
    if (formCondition === "always") return 0;
    if (formCondition === "amount_above") {
      // Input is in Naira (₦), store as kobo
      return Math.round(parseFloat(formThreshold || "0") * 100);
    }
    // risk_score_above: 0–1
    return parseFloat(formThreshold || "0");
  };

  const handleCreate = () => {
    if (!formName) return;
    if (formCondition !== "always" && !formThreshold) return;

    createRuleMut.mutate(
      {
        name: formName,
        condition: formCondition,
        threshold: computedThreshold(),
        required_approvers: formApprovers,
        approver_roles: ["owner", "approver"],
        is_active: true,
      },
      {
        onSuccess: () => {
          resetForm();
          setAddOpen(false);
        },
      }
    );
  };

  return (
    <div className="space-y-5">
      {/* ── Explanation callout ─────────────────────────────────────────── */}
      <div className="rounded-2xl border border-border/60 bg-muted/20 px-4 py-3 text-sm text-muted-foreground shadow-sm">
        Define when a run requires multiple approvers. Rules are evaluated in order and the first
        match determines the approval threshold.
      </div>

      {/* ── Rules list ─────────────────────────────────────────────────── */}
      {rulesQuery.isLoading ? (
        <div className="py-8 text-center">
          <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : rules.length === 0 && !addOpen ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-border/60 bg-muted/20 py-12 text-center shadow-sm">
          <ShieldCheck className="h-8 w-8 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            No custom rules. The default single-approver threshold applies.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-card p-4 shadow-sm transition-all hover:border-brand/30 sm:flex-row sm:items-start sm:justify-between"
            >
              <div className="min-w-0 flex-1 space-y-1.5">
                <p className="font-semibold text-foreground">{rule.name}</p>
                <p className="text-sm text-muted-foreground">
                  {formatConditionDescription(rule)}
                </p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CheckCircle2 className="h-3.5 w-3.5 text-brand" />
                  <span>
                    Requires{" "}
                    <span className="font-semibold text-foreground">
                      {rule.required_approvers}
                    </span>{" "}
                    approver{rule.required_approvers !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className={`rounded-full text-xs shadow-sm ${
                    rule.is_active
                      ? "border-teal-300 text-teal-700 hover:bg-teal-50 dark:border-teal-700 dark:text-teal-300"
                      : "border-border/60 text-muted-foreground"
                  }`}
                  onClick={() =>
                    updateRuleMut.mutate({ id: rule.id, payload: { is_active: !rule.is_active } })
                  }
                  disabled={updateRuleMut.isPending}
                >
                  {rule.is_active ? "Active" : "Inactive"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-full text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => deleteRuleMut.mutate(rule.id)}
                  disabled={deleteRuleMut.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Add rule inline form ────────────────────────────────────────── */}
      {addOpen && (
        <div className="rounded-2xl border border-border/60 bg-card p-5 space-y-4 shadow-sm">
          <h3 className="text-sm font-bold text-foreground">New Approval Rule</h3>

          {/* Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Rule Name</label>
            <Input
              placeholder='e.g. "High-value payout"'
              className="h-10 rounded-xl"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
            />
          </div>

          {/* Condition */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Trigger Condition</label>
            <select
              value={formCondition}
              onChange={(e) => {
                setFormCondition(e.target.value as Condition);
                setFormThreshold("");
              }}
              className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-brand"
            >
              {CONDITION_OPTIONS.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Threshold — conditional */}
          {formCondition === "amount_above" && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">
                Amount Threshold (₦)
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
                  ₦
                </span>
                <Input
                  type="number"
                  min="0"
                  step="1000"
                  placeholder="5000000"
                  className="h-10 rounded-xl pl-8"
                  value={formThreshold}
                  onChange={(e) => setFormThreshold(e.target.value)}
                />
              </div>
              <p className="text-xs text-muted-foreground">Enter amount in Naira.</p>
            </div>
          )}

          {formCondition === "risk_score_above" && (
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">
                Risk Score Threshold (0–1)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  className="h-2 flex-1 accent-brand"
                  value={formThreshold || "0.7"}
                  onChange={(e) => setFormThreshold(e.target.value)}
                />
                <Input
                  type="number"
                  min="0"
                  max="1"
                  step="0.01"
                  className="h-9 w-20 rounded-xl text-center"
                  value={formThreshold}
                  onChange={(e) => setFormThreshold(e.target.value)}
                  placeholder="0.70"
                />
              </div>
            </div>
          )}

          {/* Required approvers */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">
              Required Approvers
            </label>
            <div className="flex gap-3">
              {([1, 2] as const).map((n) => (
                <label
                  key={n}
                  className="flex cursor-pointer items-center gap-2 rounded-xl border border-border/60 px-4 py-2.5 text-sm transition-colors hover:bg-muted/40 has-[:checked]:border-brand/40 has-[:checked]:bg-brand/5"
                >
                  <input
                    type="radio"
                    name="approvers"
                    className="h-4 w-4 accent-brand"
                    checked={formApprovers === n}
                    onChange={() => setFormApprovers(n)}
                  />
                  <span className="font-semibold text-foreground">{n}</span>
                  <span className="text-muted-foreground">
                    approver{n !== 1 ? "s" : ""}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <Button
              className="rounded-full bg-brand px-6 text-white shadow-sm hover:opacity-90"
              onClick={handleCreate}
              disabled={
                createRuleMut.isPending ||
                !formName ||
                (formCondition !== "always" && !formThreshold)
              }
            >
              {createRuleMut.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Create Rule
            </Button>
            <Button
              variant="ghost"
              className="rounded-full"
              onClick={() => {
                setAddOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* ── Add button ─────────────────────────────────────────────────── */}
      {!addOpen && (
        <Button
          variant="outline"
          className="rounded-full shadow-sm"
          onClick={() => setAddOpen(true)}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Rule
        </Button>
      )}
    </div>
  );
}
