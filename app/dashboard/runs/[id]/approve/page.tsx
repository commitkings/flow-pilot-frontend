"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronUp,
  Loader2,
  Pencil,
  ShieldCheck,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { maskAccount, naira, truncateRunId } from "@/lib/mock-data";
import { useCandidates } from "@/hooks/use-candidate-queries";
import { useApproveCandidates, useUpdateCandidate } from "@/hooks/use-candidate-mutations";
import { useRun } from "@/hooks/use-run-queries";
import { useWallet } from "@/hooks/use-wallet";
import { useAuth } from "@/context/auth-context";
import { useApprovalPinStatus, useVerifyApprovalPin } from "@/hooks/use-approval-pin";
import { cn } from "@/lib/utils";

export default function ApprovalGatePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const role = user?.memberships?.[0]?.role;
  const userId = user?.id;

  const [query, setQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[] | null>(null);
  const [activeCandidateId, setActiveCandidateId] = useState<string | null>(null);
  const [overrideDecision, setOverrideDecision] = useState("review");
  const [overrideReason, setOverrideReason] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmChecked, setConfirmChecked] = useState(false);
  const [expandedRisk, setExpandedRisk] = useState<string | null>(null);
  const [pinValue, setPinValue] = useState("");
  const [pinVerified, setPinVerified] = useState(false);

  const { data: pinStatusData } = useApprovalPinStatus();
  const hasPin = pinStatusData?.has_pin ?? false;
  const verifyPin = useVerifyApprovalPin(() => setPinVerified(true));

  // Inline edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editName, setEditName] = useState("");
  const [editAccount, setEditAccount] = useState("");

  const {
    data: allCandidates = [],
    isLoading: loadingCandidates,
    isError: candidatesError,
  } = useCandidates(id);
  const { data: run, isLoading: loadingRun } = useRun(id);
  const { data: wallet } = useWallet();

  const approveMutation = useApproveCandidates(id, () => {
    router.push(`/dashboard/runs/${id}?phase=executing`);
  });

  const updateMutation = useUpdateCandidate(id, () => setEditingId(null));

  // Authorization: analysts cannot approve; non-assigned users cannot approve
  useEffect(() => {
    if (!user || !run) return;
    if (role === "analyst") {
      router.replace(`/dashboard/runs/${id}`);
      return;
    }
    // If a specific approver is assigned and the current user is not them (and not an owner), redirect
    if (run.assignedToId && run.assignedToId !== userId && role !== "owner") {
      router.replace(`/dashboard/runs/${id}`);
    }
  }, [user, run, role, userId, id, router]);

  const effectiveSelectedIds =
    selectedIds ?? allCandidates.filter((c) => c.approvalStatus === "selected").map((c) => c.id);

  const rows = useMemo(
    () =>
      allCandidates.filter(
        (c) =>
          c.beneficiaryName.toLowerCase().includes(query.toLowerCase()) ||
          c.institution.toLowerCase().includes(query.toLowerCase())
      ),
    [query, allCandidates],
  );

  const selectedCandidates = allCandidates.filter((candidate) => effectiveSelectedIds.includes(candidate.id));
  const selectedTotal = selectedCandidates.reduce((acc, candidate) => acc + candidate.amount, 0);
  const allCandidatesTotal = allCandidates.reduce((acc, c) => acc + c.amount, 0);
  const budgetCap = run?.budgetCap ?? null;
  const overBudget = budgetCap !== null && selectedTotal > budgetCap;

  const riskTolerance = run?.riskTolerance ?? 0.35;
  const reviewThreshold = riskTolerance + (1 - riskTolerance) / 2;

  const startEdit = (candidateId: string) => {
    const c = allCandidates.find((x) => x.id === candidateId);
    if (!c) return;
    setEditAmount(c.amount.toString());
    setEditName(c.beneficiaryName);
    setEditAccount(c.accountNumber);
    setEditingId(candidateId);
  };

  const commitEdit = () => {
    if (!editingId) return;
    const amount = parseFloat(editAmount.replace(/,/g, ""));
    if (isNaN(amount) || amount <= 0) return;
    updateMutation.mutate({
      candidateId: editingId,
      payload: {
        amount,
        beneficiary_name: editName.trim() || undefined,
        account_number: editAccount.trim() || undefined,
      },
    });
  };

  const activeCandidate = allCandidates.find((candidate) => candidate.id === activeCandidateId) ?? null;

  const toggle = (candidateId: string) => {
    setSelectedIds((prev) => {
      const base = prev ?? effectiveSelectedIds;
      return base.includes(candidateId)
        ? base.filter((cid) => cid !== candidateId)
        : [...base, candidateId];
    });
  };

  const selectAllSafe = () => {
    setSelectedIds(allCandidates.filter((c) => c.decision === "allow").map((c) => c.id));
  };

  const PLATFORM_FEE_RATE = 0.002;
  const platformFee = Math.ceil(selectedTotal * PLATFORM_FEE_RATE * 100) / 100;
  const totalWithFee = selectedTotal + platformFee;
  const walletBalance = wallet?.balance ?? null;
  const insufficientWallet = walletBalance !== null && totalWithFee > walletBalance;

  const onApprove = () => {
    if (!confirmChecked || approveMutation.isPending || insufficientWallet) return;
    if (hasPin && !pinVerified) return;
    approveMutation.mutate(effectiveSelectedIds);
  };

  const onConfirmOpen = () => {
    setPinValue("");
    setPinVerified(false);
    setConfirmOpen(true);
  };

  if (loadingCandidates || loadingRun) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (candidatesError) {
    return (
      <div className="flex items-center justify-center py-24">
        <p className="text-sm text-destructive">Failed to load beneficiaries. Please go back and try again.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-28">
      {/* ── Header ── */}
      <div>
        <Link
          href={`/dashboard/runs/${id}`}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Runs / Run {truncateRunId(id)} / Approve
        </Link>
        <h1 className="mt-1 text-2xl font-black tracking-tight text-foreground">Approval Gate.</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review risk scores and authorise disbursements before execution under risk threshold {riskTolerance.toFixed(2)}.
        </p>
      </div>

      {/* ── Info badges ── */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-muted px-3 py-1 text-sm font-semibold text-foreground">
          Run {truncateRunId(id)}
        </span>
        <span className="rounded-full bg-muted px-3 py-1 text-sm font-semibold text-foreground">
          Risk Tolerance {riskTolerance.toFixed(2)}
        </span>
        {budgetCap !== null && (
          <span className={cn(
            "rounded-full px-3 py-1 text-sm font-semibold",
            overBudget
              ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
              : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
          )}>
            Budget: {naira(selectedTotal)} / {naira(budgetCap)}
          </span>
        )}
        <StatusBadge status="review" label="Forecast: Caution" />
      </div>

      {/* ── Budget cap warning ── */}
      {overBudget && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            Selected total ({naira(selectedTotal)}) exceeds the run budget cap ({naira(budgetCap!)}). Deselect beneficiaries or edit amounts before approving.
          </div>
        </div>
      )}

      {/* ── Wallet balance + fee breakdown ── */}
      {wallet != null && selectedTotal > 0 && (() => {
        const balance = wallet.balance;
        const shortfall = totalWithFee - balance;
        if (shortfall > 0) {
          return (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
              <div className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <div className="space-y-1">
                  <span className="font-semibold">Insufficient wallet balance.</span>
                  <div className="text-xs space-y-0.5 mt-1">
                    <div className="flex justify-between gap-6"><span>Payout total</span><span className="font-semibold">{naira(selectedTotal)}</span></div>
                    <div className="flex justify-between gap-6"><span>Platform fee (0.2%)</span><span className="font-semibold">{naira(platformFee)}</span></div>
                    <div className="flex justify-between gap-6 border-t border-red-200 pt-0.5 mt-0.5"><span className="font-semibold">Total deduction</span><span className="font-semibold">{naira(totalWithFee)}</span></div>
                    <div className="flex justify-between gap-6"><span>Wallet balance</span><span className="font-semibold">{naira(balance)}</span></div>
                    <div className="flex justify-between gap-6 text-red-700 dark:text-red-400"><span>Shortfall</span><span className="font-black">{naira(shortfall)}</span></div>
                  </div>
                </div>
              </div>
            </div>
          );
        }
        return (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 shrink-0" />
                <span>Wallet sufficient — {naira(balance)} available.</span>
              </div>
              <div className="text-xs space-y-0.5 ml-6">
                <div className="flex justify-between gap-6"><span>Payout total</span><span className="font-semibold">{naira(selectedTotal)}</span></div>
                <div className="flex justify-between gap-6"><span>Platform fee (0.2%)</span><span className="font-semibold">{naira(platformFee)}</span></div>
                <div className="flex justify-between gap-6 border-t border-emerald-200 pt-0.5"><span className="font-semibold">Total deduction</span><span className="font-semibold">{naira(totalWithFee)}</span></div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Toolbar ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm font-semibold text-foreground">
          {effectiveSelectedIds.length} of {allCandidates.length} beneficiaries selected
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" className="rounded-full" onClick={selectAllSafe}>
            Select All Safe
          </Button>
          <Button variant="ghost" size="sm" className="rounded-full" onClick={() => setSelectedIds([])}>
            Deselect All
          </Button>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter by name or bank…"
            className="h-9 rounded-full border border-border bg-background px-3 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand/10 w-full sm:w-auto"
          />
        </div>
      </div>

      {/* ── Desktop table ── */}
      <div className="hidden lg:block overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider text-muted-foreground">Select</th>
              <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider text-muted-foreground">Beneficiary</th>
              <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider text-muted-foreground">Institution</th>
              <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider text-muted-foreground">Account</th>
              <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider text-muted-foreground">Amount</th>
              <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider text-muted-foreground">Risk Score</th>
              <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider text-muted-foreground">Decision</th>
              <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider text-muted-foreground">Lookup</th>
              <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider text-muted-foreground">Risk Flags</th>
              <th className="px-4 py-3 text-[10px] font-black uppercase tracking-wider text-muted-foreground">Edit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((candidate) => {
              const selected = effectiveSelectedIds.includes(candidate.id);
              const blocked = candidate.decision === "block";
              return (
                <tr
                  key={candidate.id}
                  className={cn(
                    "transition-colors hover:bg-muted/30",
                    blocked && "bg-red-50/50 dark:bg-red-950/10",
                    selected && !blocked && "bg-emerald-50/50 dark:bg-emerald-950/10",
                  )}
                >
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      className={cn(
                        "inline-flex h-5 w-5 items-center justify-center rounded border transition-colors",
                        selected && !blocked
                          ? "border-emerald-600 bg-emerald-600 text-white"
                          : blocked
                          ? "cursor-not-allowed border-border bg-muted text-muted-foreground"
                          : "border-border hover:border-brand",
                      )}
                      onClick={() => !blocked && toggle(candidate.id)}
                      disabled={blocked}
                    >
                      {blocked ? "🔒" : selected ? <Check className="h-3 w-3" /> : null}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      className="font-semibold text-foreground hover:text-brand transition-colors text-left"
                      onClick={() => setActiveCandidateId(candidate.id)}
                    >
                      {candidate.beneficiaryName}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{candidate.institution}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{maskAccount(candidate.accountNumber)}</td>
                  <td className="px-4 py-3 font-semibold text-foreground">{naira(candidate.amount)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                        <div
                          className={cn(
                            "h-full transition-all",
                            candidate.riskScore < riskTolerance 
                              ? "bg-emerald-500" 
                              : candidate.riskScore < reviewThreshold 
                                ? "bg-amber-400" 
                                : "bg-red-500",
                          )}
                          style={{ width: `${candidate.riskScore * 100}%` }}
                        />
                      </div>
                      <span className="text-xs tabular-nums text-muted-foreground">{candidate.riskScore.toFixed(2)}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={candidate.decision} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge
                      status={candidate.lookupStatus === "verified" ? "verified" : candidate.lookupStatus}
                      label={candidate.lookupStatus === "pending" ? "Pending" : undefined}
                    />
                  </td>
                  <td className="px-4 py-3">
                    {candidate.riskReasons[0] ? (
                      <div className="flex items-center gap-1.5">
                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-foreground max-w-[140px] truncate">
                          {candidate.riskReasons[0]}
                        </span>
                        {candidate.riskReasons.length > 1 && (
                          <button
                            type="button"
                            className="text-xs font-semibold text-brand hover:opacity-80"
                            onClick={() => setActiveCandidateId(candidate.id)}
                          >
                            +{candidate.riskReasons.length - 1}
                          </button>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {editingId === candidate.id ? (
                      <div className="flex flex-col gap-1.5 min-w-[220px]">
                        <input
                          type="number"
                          step="0.01"
                          value={editAmount}
                          onChange={(e) => setEditAmount(e.target.value)}
                          placeholder="Amount"
                          className="h-8 rounded-lg border border-border bg-background px-2 text-sm outline-none focus:border-brand"
                        />
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          placeholder="Beneficiary name"
                          className="h-8 rounded-lg border border-border bg-background px-2 text-sm outline-none focus:border-brand"
                        />
                        <input
                          type="text"
                          value={editAccount}
                          onChange={(e) => setEditAccount(e.target.value)}
                          placeholder="Account number"
                          className="h-8 rounded-lg border border-border bg-background px-2 text-sm outline-none focus:border-brand"
                        />
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={commitEdit}
                            disabled={updateMutation.isPending}
                            className="flex-1 rounded-lg bg-emerald-600 py-1 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-60"
                          >
                            {updateMutation.isPending ? "…" : "Save"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="flex-1 rounded-lg border border-border py-1 text-xs font-medium text-muted-foreground hover:text-foreground"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => startEdit(candidate.id)}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-border text-muted-foreground hover:border-brand hover:text-brand transition-colors"
                        title="Edit candidate"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Mobile candidate cards ── */}
      <div className="lg:hidden space-y-3">
        {rows.map((candidate) => {
          const selected = effectiveSelectedIds.includes(candidate.id);
          const blocked = candidate.decision === "block";
          const expanded = expandedRisk === candidate.id;
          return (
            <div
              key={candidate.id}
              className={cn(
                "rounded-2xl border bg-card p-4 transition-all",
                blocked ? "border-red-200 bg-red-50/30" : selected ? "border-emerald-300 bg-emerald-50/30" : "border-border",
              )}
            >
              {/* Top row */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    type="button"
                    className={cn(
                      "shrink-0 inline-flex h-6 w-6 items-center justify-center rounded border transition-colors",
                      selected && !blocked
                        ? "border-emerald-600 bg-emerald-600 text-white"
                        : blocked
                        ? "cursor-not-allowed border-border bg-muted"
                        : "border-border",
                    )}
                    onClick={() => !blocked && toggle(candidate.id)}
                    disabled={blocked}
                  >
                    {blocked ? "🔒" : selected ? <Check className="h-3.5 w-3.5" /> : null}
                  </button>
                  <div className="min-w-0">
                    <p className="font-bold text-foreground truncate">{candidate.beneficiaryName}</p>
                    <p className="text-xs text-muted-foreground">{candidate.institution} · {maskAccount(candidate.accountNumber)}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-foreground">{naira(candidate.amount)}</p>
                  <StatusBadge status={candidate.decision} />
                </div>
              </div>

              {/* Risk row */}
              <div className="mt-3 flex items-center gap-4">
                <div className="flex items-center gap-2 flex-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Risk</span>
                  <div className="flex-1 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn(
                        "h-full",
                        candidate.riskScore < riskTolerance ? "bg-emerald-500" : candidate.riskScore < reviewThreshold ? "bg-amber-400" : "bg-red-500",
                      )}
                      style={{ width: `${candidate.riskScore * 100}%` }}
                    />
                  </div>
                  <span className="text-xs tabular-nums text-muted-foreground">{candidate.riskScore.toFixed(2)}</span>
                </div>
                <StatusBadge
                  status={candidate.lookupStatus === "verified" ? "verified" : candidate.lookupStatus}
                  label={candidate.lookupStatus === "pending" ? "Pending" : undefined}
                />
              </div>

              {/* Risk flags */}
              {candidate.riskReasons.length > 0 && (
                <div className="mt-3">
                  <button
                    type="button"
                    className="flex items-center gap-1 text-xs font-semibold text-brand"
                    onClick={() => setExpandedRisk(expanded ? null : candidate.id)}
                  >
                    {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                    {candidate.riskReasons.length} risk flag{candidate.riskReasons.length > 1 ? "s" : ""}
                  </button>
                  {expanded && (
                    <ul className="mt-2 space-y-1">
                      {candidate.riskReasons.map((reason) => (
                        <li key={reason} className="text-xs text-muted-foreground flex gap-1.5">
                          <span className="text-amber-500 shrink-0">·</span>
                          {reason}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {/* Mobile inline edit */}
              {editingId === candidate.id ? (
                <div className="mt-3 space-y-2 rounded-xl border border-border bg-muted/30 p-3">
                  <p className="text-xs font-black uppercase tracking-wider text-muted-foreground">Edit Details</p>
                  <input
                    type="number"
                    step="0.01"
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    placeholder="Amount"
                    className="h-9 w-full rounded-lg border border-border bg-background px-2 text-sm outline-none focus:border-brand"
                  />
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Beneficiary name"
                    className="h-9 w-full rounded-lg border border-border bg-background px-2 text-sm outline-none focus:border-brand"
                  />
                  <input
                    type="text"
                    value={editAccount}
                    onChange={(e) => setEditAccount(e.target.value)}
                    placeholder="Account number"
                    className="h-9 w-full rounded-lg border border-border bg-background px-2 text-sm outline-none focus:border-brand"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1 rounded-full bg-emerald-600 text-white hover:bg-emerald-700" onClick={commitEdit} disabled={updateMutation.isPending}>
                      {updateMutation.isPending ? "Saving…" : "Save"}
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1 rounded-full" onClick={() => setEditingId(null)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => startEdit(candidate.id)}
                  className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-brand transition-colors"
                >
                  <Pencil className="h-3 w-3" />
                  Edit details
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Candidate detail panel (desktop right sidebar / mobile bottom sheet) ── */}
      {activeCandidate && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={() => setActiveCandidateId(null)}
          />
          {/* Panel */}
          <div className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl border-t border-border bg-card p-5 shadow-2xl lg:inset-y-0 lg:left-auto lg:right-0 lg:w-96 lg:rounded-none lg:rounded-l-2xl lg:border-t-0 lg:border-l">
            <div className="flex items-start justify-between mb-5">
              <div>
                <p className="text-base font-black text-foreground">{activeCandidate.beneficiaryName}</p>
                <p className="text-sm text-muted-foreground">{activeCandidate.institution}</p>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setActiveCandidateId(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-3 text-sm overflow-y-auto max-h-[60vh] lg:max-h-[calc(100vh-260px)]">
              <Row label="Account" value={activeCandidate.accountNumber} />
              <Row label="Amount" value={naira(activeCandidate.amount)} />
              <Row label="Purpose" value={activeCandidate.purpose || "—"} />
              <Row label="Name on file" value={activeCandidate.nameOnFile || "—"} />
              <Row label="Returned name" value={activeCandidate.returnedName || "—"} />
              <Row label="Similarity" value={activeCandidate.similarity ? `${activeCandidate.similarity}%` : "—"} />

              {activeCandidate.riskReasons.length > 0 && (
                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-muted-foreground mb-2">Risk Flags</p>
                  <ul className="space-y-1.5">
                    {activeCandidate.riskReasons.map((reason) => (
                      <li key={reason} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <span className="text-amber-500 mt-0.5 shrink-0">·</span>
                        {reason}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
                <p className="text-xs font-black uppercase tracking-wider text-muted-foreground">Decision Override</p>
                <select
                  value={overrideDecision}
                  onChange={(e) => setOverrideDecision(e.target.value)}
                  className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-brand"
                >
                  <option value="allow">Allow</option>
                  <option value="review">Review</option>
                  <option value="block">Block</option>
                </select>
                <textarea
                  rows={3}
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  placeholder="Override reason (required)"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-brand resize-none"
                />
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1 rounded-full" onClick={() => setActiveCandidateId(null)}>Cancel</Button>
                  <Button className="flex-1 rounded-full bg-brand text-white hover:opacity-90">Apply</Button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Fixed bottom bar ── */}
      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-border bg-card/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div>
            <p className="text-sm font-bold text-foreground">
              Approving {effectiveSelectedIds.length} payout{effectiveSelectedIds.length !== 1 ? "s" : ""}
            </p>
            <p className="text-xs text-muted-foreground">
              Total: <span className="font-semibold text-foreground">{naira(selectedTotal)}</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="flex-1 rounded-full border-destructive/30 text-destructive hover:bg-destructive/5 sm:flex-none"
            >
              Reject All
            </Button>
            <Button
              className="flex-1 rounded-full bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm sm:flex-none disabled:opacity-50"
              disabled={effectiveSelectedIds.length === 0 || overBudget}
              onClick={onConfirmOpen}
              title={overBudget ? "Selected total exceeds budget cap" : undefined}
            >
              <ShieldCheck className="mr-1.5 h-4 w-4" />
              Approve Selected
            </Button>
          </div>
        </div>
      </div>

      {/* ── Confirmation modal ── */}
      {confirmOpen && (
        <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-[520px] rounded-2xl bg-card border border-border p-6 shadow-2xl animate-in slide-in-from-bottom-4 sm:animate-in sm:zoom-in-95 duration-200">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-center text-xl font-black tracking-tight text-foreground">
              Confirm Payout Approval
            </h3>
            <p className="mt-2 text-center text-sm text-muted-foreground">
              FlowPilot will execute these disbursements through Interswitch immediately. This cannot be undone.
            </p>

            <div className="mt-5 max-h-48 overflow-y-auto rounded-xl border border-border bg-muted/30 p-3">
              {selectedCandidates.map((c) => (
                <div key={c.id} className="flex items-center justify-between border-b border-border py-2 last:border-0">
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground truncate">{c.beneficiaryName}</p>
                    <p className="text-xs text-muted-foreground">{c.institution}</p>
                  </div>
                  <p className="font-bold text-foreground ml-3 shrink-0">{naira(c.amount)}</p>
                </div>
              ))}
              <div className="mt-2 border-t border-border pt-3 space-y-1">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Payout total</span>
                  <span className="font-semibold text-foreground">{naira(selectedTotal)}</span>
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Platform fee (0.2%)</span>
                  <span className="font-semibold text-foreground">{naira(platformFee)}</span>
                </div>
                <div className="flex items-center justify-between border-t border-border pt-1">
                  <p className="text-sm font-semibold text-muted-foreground">Total Deduction</p>
                  <p className="text-lg font-black text-emerald-600">{naira(totalWithFee)}</p>
                </div>
              </div>
            </div>

            {/* PIN step-up */}
            {hasPin && (
              <div className="mt-4 space-y-2 rounded-xl border border-border bg-muted/30 p-3">
                <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-brand" />
                  {pinVerified ? "PIN verified" : "Enter your approval PIN to confirm"}
                </p>
                {!pinVerified && (
                  <div className="flex gap-2">
                    <input
                      type="password"
                      inputMode="numeric"
                      maxLength={6}
                      value={pinValue}
                      onChange={(e) => setPinValue(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="PIN"
                      className="h-9 w-28 rounded-full border border-border bg-background px-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                    />
                    <Button
                      type="button"
                      size="sm"
                      className="rounded-full"
                      disabled={pinValue.length < 4 || verifyPin.isPending}
                      onClick={() => verifyPin.mutate(pinValue)}
                    >
                      {verifyPin.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Verify"}
                    </Button>
                  </div>
                )}
              </div>
            )}

            {!hasPin && (
              <p className="mt-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                Add an Approval PIN in Settings → Security for extra confirmation security.
              </p>
            )}

            <label className="mt-4 flex cursor-pointer items-start gap-2.5 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={confirmChecked}
                onChange={(e) => setConfirmChecked(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-border accent-emerald-600"
              />
              I confirm I have reviewed all risk flags and lookup results and authorise these payments.
            </label>

            <div className="mt-5 space-y-2">
              {approveMutation.isError && (
                <p className="text-sm text-destructive text-center">Approval failed. Please try again.</p>
              )}
              <Button
                className="h-11 w-full rounded-full bg-emerald-600 text-white hover:bg-emerald-700 font-bold"
                disabled={!confirmChecked || approveMutation.isPending || insufficientWallet || (hasPin && !pinVerified)}
                onClick={onApprove}
              >
                {approveMutation.isPending ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Processing…</>
                ) : (
                  <><Check className="mr-2 h-4 w-4" />Confirm and Execute Payouts</>
                )}
              </Button>
              <Button
                variant="ghost"
                className="h-11 w-full rounded-full"
                onClick={() => setConfirmOpen(false)}
              >
                Go Back and Review
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="font-medium text-foreground text-right">{value}</span>
    </div>
  );
}
