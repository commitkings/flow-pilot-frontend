"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Building2,
  Check,
  Copy,
  Loader2,
  Minus,
  Plus,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Wallet,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { useWallet, useWalletTransactions, useTopUpWallet, useWithdrawWallet } from "@/hooks/use-wallet";
import { useCredits, usePurchaseCredits } from "@/hooks/use-credits";
import { useOrgProfile } from "@/hooks/use-settings-queries";
import { useAuth } from "@/context/auth-context";
import { getUserRole, isOwner, ApiError } from "@/lib/api-types";
import { PageHeader } from "@/components/ui/page-header";

function formatNGN(amount: number): string {
  return `₦${amount.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/** Returns an array of YYYY-MM strings for the past N months including current */
function getMonthOptions(count = 12): { value: string; label: string }[] {
  const options: { value: string; label: string }[] = [];
  const now = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleString("en-NG", { month: "long", year: "numeric" });
    options.push({ value, label });
  }
  return options;
}

// ── Top-up modal ──────────────────────────────────────────────────────────────

function TopUpModal({ onClose }: { onClose: () => void }) {
  const [amount, setAmount] = useState("");
  const [reference, setReference] = useState("");
  const [description, setDescription] = useState("");
  const { mutate: topUp, isPending } = useTopUpWallet();

  const parsedAmount = parseFloat(amount.replace(/,/g, ""));
  const canSubmit = parsedAmount > 0 && reference.trim().length > 0 && !isPending;

  const handleSubmit = () => {
    if (!canSubmit) return;
    topUp(
      { amount: parsedAmount, reference: reference.trim(), description: description.trim() || undefined },
      { onSuccess: onClose },
    );
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-border/60 bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-border/50 px-6 py-5">
          <div>
            <h2 className="text-lg font-black tracking-tight text-foreground">Top Up Wallet</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">Add funds to your organisation wallet.</p>
          </div>
          <button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">Amount (₦) <span className="text-destructive">*</span></label>
            <input type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g. 500000" className="h-10 w-full rounded-full border border-border/60 bg-background px-4 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-brand focus:ring-1 focus:ring-brand/10" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">Payment Reference <span className="text-destructive">*</span></label>
            <input type="text" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="e.g. PAY-20240415-001" className="h-10 w-full rounded-full border border-border/60 bg-background px-4 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-brand focus:ring-1 focus:ring-brand/10" />
            <p className="mt-1.5 px-1 text-[11px] text-muted-foreground">Use your bank transfer reference or payment ID. The same reference cannot be used twice.</p>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">Note <span className="text-muted-foreground/50">(optional)</span></label>
            <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Q2 payroll funding" className="h-10 w-full rounded-full border border-border/60 bg-background px-4 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-brand focus:ring-1 focus:ring-brand/10" />
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 border-t border-border/50 px-6 py-4">
          <button type="button" onClick={onClose} disabled={isPending} className="inline-flex items-center rounded-full border border-border/60 bg-transparent px-5 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:border-border hover:bg-muted/40 hover:text-foreground disabled:pointer-events-none disabled:opacity-40">Cancel</button>
          <Button className="gap-2 rounded-full bg-brand px-6 text-white hover:opacity-90 disabled:opacity-50" onClick={handleSubmit} disabled={!canSubmit}>
            {isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> Processing…</> : <><Plus className="h-4 w-4" /> Top Up</>}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Withdraw modal ────────────────────────────────────────────────────────────

function WithdrawModal({ onClose }: { onClose: () => void }) {
  const [amount, setAmount] = useState("");
  const [reference, setReference] = useState("");
  const [description, setDescription] = useState("");
  const { mutate: withdraw, isPending } = useWithdrawWallet();

  const parsedAmount = parseFloat(amount.replace(/,/g, ""));
  const canSubmit = parsedAmount > 0 && reference.trim().length > 0 && !isPending;

  const handleSubmit = () => {
    if (!canSubmit) return;
    withdraw(
      { amount: parsedAmount, reference: reference.trim(), description: description.trim() || undefined },
      { onSuccess: onClose },
    );
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-border/60 bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-border/50 px-6 py-5">
          <div>
            <h2 className="text-lg font-black tracking-tight text-foreground">Withdraw Funds</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">Record a withdrawal from your organisation wallet.</p>
          </div>
          <button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">Amount (₦) <span className="text-destructive">*</span></label>
            <input type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g. 100000" className="h-10 w-full rounded-full border border-border/60 bg-background px-4 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-brand focus:ring-1 focus:ring-brand/10" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">Withdrawal Reference <span className="text-destructive">*</span></label>
            <input type="text" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="e.g. WD-20240415-001" className="h-10 w-full rounded-full border border-border/60 bg-background px-4 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-brand focus:ring-1 focus:ring-brand/10" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">Note <span className="text-muted-foreground/50">(optional)</span></label>
            <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Surplus return" className="h-10 w-full rounded-full border border-border/60 bg-background px-4 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-brand focus:ring-1 focus:ring-brand/10" />
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 border-t border-border/50 px-6 py-4">
          <button type="button" onClick={onClose} disabled={isPending} className="inline-flex items-center rounded-full border border-border/60 bg-transparent px-5 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:border-border hover:bg-muted/40 hover:text-foreground disabled:pointer-events-none disabled:opacity-40">Cancel</button>
          <Button className="gap-2 rounded-full bg-red-600 px-6 text-white hover:bg-red-700 disabled:opacity-50" onClick={handleSubmit} disabled={!canSubmit}>
            {isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> Processing…</> : <><Minus className="h-4 w-4" /> Withdraw</>}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Buy Credits modal ─────────────────────────────────────────────────────────

function BuyCreditsModal({ bundles, onClose }: { bundles: { credits: number; price: number }[]; onClose: () => void }) {
  const [selected, setSelected] = useState<number | null>(null);
  const [reference, setReference] = useState("");
  const { mutate: purchase, isPending } = usePurchaseCredits(onClose);

  const canSubmit = selected !== null && reference.trim().length > 0 && !isPending;

  const handleSubmit = () => {
    if (!canSubmit || selected === null) return;
    purchase({ credits: selected, reference: reference.trim() });
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-border/60 bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-border/50 px-6 py-5">
          <div>
            <h2 className="text-lg font-black tracking-tight text-foreground">Buy AI Credits</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">Each payout run uses 1 credit. Funds deducted from wallet.</p>
          </div>
          <button type="button" onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {/* Bundle options */}
          <div className="grid gap-3">
            {bundles.map((b) => (
              <button
                key={b.credits}
                type="button"
                onClick={() => setSelected(b.credits)}
                className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left transition-all ${
                  selected === b.credits
                    ? "border-brand bg-brand/5 ring-1 ring-brand/30"
                    : "border-border hover:border-brand/40 hover:bg-muted/30"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${selected === b.credits ? "bg-brand text-white" : "bg-muted"}`}>
                    <Zap className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-black text-foreground">{b.credits} credits</p>
                    <p className="text-xs text-muted-foreground">{b.credits} payout runs</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-black text-foreground">₦{b.price.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">₦{(b.price / b.credits).toLocaleString()} / credit</p>
                </div>
              </button>
            ))}
          </div>

          {/* Payment reference */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">Payment Reference <span className="text-destructive">*</span></label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="e.g. PAY-CREDITS-001"
              className="h-10 w-full rounded-full border border-border/60 bg-background px-4 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-brand focus:ring-1 focus:ring-brand/10"
            />
            <p className="mt-1.5 px-1 text-[11px] text-muted-foreground">Must match your payment reference. Cannot be reused.</p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 border-t border-border/50 px-6 py-4">
          <button type="button" onClick={onClose} disabled={isPending} className="inline-flex items-center rounded-full border border-border/60 bg-transparent px-5 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:border-border hover:bg-muted/40 hover:text-foreground disabled:pointer-events-none disabled:opacity-40">Cancel</button>
          <Button className="gap-2 rounded-full bg-brand px-6 text-white hover:opacity-90 disabled:opacity-50" onClick={handleSubmit} disabled={!canSubmit}>
            {isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> Processing…</> : <><Sparkles className="h-4 w-4" /> Buy Credits</>}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function WalletPage() {
  const router = useRouter();
  const { user } = useAuth();
  const role = getUserRole(user);
  const owner = isOwner(user);

  useEffect(() => {
    if (user && role === "analyst") router.replace("/dashboard");
  }, [user, role, router]);

  if (!user || role === "analyst") return null;

  const { data: wallet, isLoading: walletLoading, isError: walletError, error: walletErrorObj, refetch: refetchWallet } = useWallet();
  const { data: credits } = useCredits();
  const { data: org } = useOrgProfile();
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const { data: txData, isLoading: txLoading } = useWalletTransactions(50, 0, selectedMonth || undefined);
  const [showTopUp, setShowTopUp] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [showBuyCredits, setShowBuyCredits] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  function copyToClipboard(value: string, field: string) {
    navigator.clipboard.writeText(value).then(() => {
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    });
  }

  const monthOptions = getMonthOptions(12);

  // ── KYC gate — 403 from wallet endpoint means KYC is not verified ─────────
  const isKycError = walletError && walletErrorObj instanceof ApiError && walletErrorObj.status === 403;

  if (isKycError) {
    const kycState = org?.kyc_status ?? "not_submitted";
    const isPending = kycState === "pending";

    return (
      <div className="space-y-6">
        <PageHeader title="Wallet" description="Manage your organisation's prepaid wallet." />
        <div className="flex flex-col items-center gap-5 rounded-2xl border border-border/60 bg-card p-10 text-center shadow-sm">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
            <ShieldAlert className="h-7 w-7 text-muted-foreground" />
          </div>
          <div>
            <h2 className="text-base font-black text-foreground">Verification Required</h2>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground leading-relaxed">
              {isPending
                ? "Your business documents are under review. Wallet access will be enabled once verification is complete."
                : "Complete business verification (KYC) to access your wallet and start processing payouts."}
            </p>
          </div>
          <Button className="rounded-full bg-brand px-6 text-white hover:opacity-90" onClick={() => router.push("/dashboard/kyc")}>
            {isPending ? "Check Verification Status" : "Complete Verification"}
          </Button>
        </div>
      </div>
    );
  }

  const lowBalance = wallet && wallet.balance < 50000 && wallet.balance >= 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <PageHeader
          title="Wallet"
          description={owner
            ? "Manage your organisation's prepaid wallet balance."
            : "View your organisation's wallet balance and transaction history."}
        />
        {owner && (
          <div className="flex shrink-0 items-center gap-2">
            <Button
              variant="outline"
              className="gap-2 rounded-full px-5 text-sm border-red-200 text-red-700 hover:bg-red-50 hover:border-red-300 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/30"
              onClick={() => setShowWithdraw(true)}
            >
              <Minus className="h-4 w-4" />
              Withdraw
            </Button>
            <Button
              className="gap-2 rounded-full bg-brand px-5 text-white hover:opacity-90"
              onClick={() => setShowTopUp(true)}
            >
              <Plus className="h-4 w-4" />
              Top Up
            </Button>
          </div>
        )}
      </div>

      {/* Metric cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="relative">
          <MetricCard
            label="Available Balance"
            value={walletLoading ? "…" : wallet ? formatNGN(wallet.balance) : "₦0.00"}
            subtext={wallet?.currency ?? "NGN"}
            icon={<Wallet className="h-4 w-4" />}
            accent="brand"
          />
          <button
            type="button"
            onClick={() => refetchWallet()}
            className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            title="Refresh balance"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
        <MetricCard
          label="Total Credit"
          value={walletLoading ? "…" : wallet ? formatNGN(wallet.total_credit) : "₦0.00"}
          subtext="All-time funds added"
          icon={<TrendingUp className="h-4 w-4" />}
          accent="green"
        />
        <MetricCard
          label="Total Debit"
          value={walletLoading ? "…" : wallet ? formatNGN(wallet.total_debit) : "₦0.00"}
          subtext="All-time funds spent"
          icon={<TrendingDown className="h-4 w-4" />}
          accent={wallet && wallet.total_debit > 0 ? "amber" : "default"}
        />
      </div>

      {/* AI Credits card */}
      <div className="rounded-2xl border border-border/60 bg-card px-5 py-4 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand/10">
              <Zap className="h-4 w-4 text-brand" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">AI Processing Credits</p>
              <p className="text-2xl font-black text-foreground">{credits?.balance ?? "…"}</p>
              <p className="text-xs text-muted-foreground">
                {credits?.balance === 1 ? "1 payout run remaining" : `${credits?.balance ?? "…"} payout runs remaining`}
                {" · "}1 credit per run
              </p>
            </div>
          </div>
          {owner && (
            <Button
              className="gap-2 shrink-0 rounded-full bg-brand px-5 text-sm text-white hover:opacity-90"
              onClick={() => setShowBuyCredits(true)}
            >
              <Sparkles className="h-4 w-4" />
              Buy Credits
            </Button>
          )}
        </div>
        {credits && credits.balance === 0 && (
          <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
            You have no AI credits left. Purchase a bundle to create new payout runs.
          </div>
        )}
        {credits && credits.balance > 0 && credits.balance <= 2 && (
          <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">
            Low credits — only {credits.balance} run{credits.balance !== 1 ? "s" : ""} remaining.
          </div>
        )}
        {/* Bundle pricing reference */}
        {credits?.bundles && (
          <div className="mt-3 flex flex-wrap gap-2">
            {credits.bundles.map((b) => (
              <span key={b.credits} className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
                {b.credits} credits · ₦{b.price.toLocaleString()}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Virtual account card — fund wallet via bank transfer */}
      {org?.virtual_account_number && (
        <div className="rounded-2xl border border-border/60 bg-card px-5 py-4 shadow-sm">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand/10">
              <Building2 className="h-4 w-4 text-brand" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Fund Wallet via Bank Transfer</p>
              <p className="text-xs text-muted-foreground">Transfer to the account below to top up your wallet instantly.</p>
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            {[
              { label: "Account Number", value: org.virtual_account_number, field: "account" },
              { label: "Bank Name", value: org.virtual_account_bank ?? "FlowPilot Microfinance Bank", field: "bank" },
              { label: "Account Name", value: org.virtual_account_name ?? org.business_name, field: "name" },
            ].map(({ label, value, field }) => (
              <div key={field} className="flex items-center justify-between gap-2 rounded-xl border border-border/50 bg-muted/30 px-3 py-2.5">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
                  <p className="mt-0.5 font-mono text-sm font-semibold text-foreground truncate">{value}</p>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(value, field)}
                  className="shrink-0 flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  title={`Copy ${label}`}
                >
                  {copiedField === field ? (
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            ))}
          </div>
          <p className="mt-2.5 text-[11px] text-muted-foreground">
            Transfers typically reflect within a few minutes. Use your company name or invoice number as the payment reference.
          </p>
        </div>
      )}

      {/* Low balance notice */}
      {lowBalance && (
        <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-3 dark:border-amber-900 dark:bg-amber-950/30">
          <div className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
          <p className="text-sm text-amber-800 dark:text-amber-300">
            Balance is below <span className="font-semibold">₦50,000</span> — top up to avoid payout failures.
          </p>
          {owner && (
            <button type="button" onClick={() => setShowTopUp(true)} className="ml-auto shrink-0 text-xs font-semibold text-brand hover:underline">
              Top up now
            </button>
          )}
        </div>
      )}

      {/* Transaction table */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <span className="h-4 w-1 rounded-full bg-brand shrink-0" />
            <h2 className="text-base font-black tracking-tight text-foreground">Transaction History</h2>
            {txData && (
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-bold text-muted-foreground">
                {txData.total} total
              </span>
            )}
          </div>
          {/* Month filter */}
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="h-9 rounded-full border border-border/60 bg-background px-3 text-sm text-foreground outline-none transition-all focus:border-brand focus:ring-1 focus:ring-brand/10"
          >
            <option value="">All time</option>
            {monthOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
          {txLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : txData && txData.transactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30 text-left">
                    <th className="px-5 py-3 text-xs font-black uppercase tracking-wider text-muted-foreground">Type</th>
                    <th className="px-5 py-3 text-xs font-black uppercase tracking-wider text-muted-foreground">Description</th>
                    <th className="hidden px-5 py-3 text-xs font-black uppercase tracking-wider text-muted-foreground md:table-cell">Reference</th>
                    <th className="px-5 py-3 text-xs font-black uppercase tracking-wider text-muted-foreground text-right">Amount</th>
                    <th className="hidden px-5 py-3 text-xs font-black uppercase tracking-wider text-muted-foreground text-right lg:table-cell">Balance After</th>
                    <th className="hidden px-5 py-3 text-xs font-black uppercase tracking-wider text-muted-foreground xl:table-cell">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {txData.transactions.map((tx) => (
                    <tr key={tx.id} className="transition-colors hover:bg-muted/20">
                      <td className="px-5 py-3.5">
                        <div className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                          tx.type === "credit"
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : "bg-red-500/10 text-red-500 dark:text-red-400"
                        }`}>
                          {tx.type === "credit" ? (
                            <ArrowUpRight className="h-3 w-3" />
                          ) : (
                            <ArrowDownLeft className="h-3 w-3" />
                          )}
                          {tx.type === "credit" ? "Credit" : "Debit"}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="font-semibold text-foreground truncate max-w-[200px]">
                          {tx.description ?? (tx.type === "credit" ? "Wallet top-up" : "Payout spend")}
                        </p>
                      </td>
                      <td className="hidden px-5 py-3.5 md:table-cell">
                        <span className="font-mono text-xs text-muted-foreground">{tx.reference}</span>
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <span className={`font-black text-sm ${
                          tx.type === "credit"
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-red-500 dark:text-red-400"
                        }`}>
                          {tx.type === "credit" ? "+" : "−"}{formatNGN(tx.amount)}
                        </span>
                      </td>
                      <td className="hidden px-5 py-3.5 text-right text-sm text-muted-foreground lg:table-cell">
                        {formatNGN(tx.balance_after)}
                      </td>
                      <td className="hidden px-5 py-3.5 text-sm text-muted-foreground xl:table-cell">
                        {formatDate(tx.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
                <Wallet className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-base font-black text-foreground">
                  {selectedMonth ? "No transactions this month" : "No transactions yet"}
                </p>
                <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                  {owner
                    ? selectedMonth ? "Try selecting a different month or clear the filter." : "Top up your wallet to get started."
                    : "Transactions will appear here once the wallet is funded."}
                </p>
              </div>
              {selectedMonth && (
                <button
                  type="button"
                  onClick={() => setSelectedMonth("")}
                  className="text-xs font-semibold text-brand hover:underline"
                >
                  Clear filter
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {showTopUp && <TopUpModal onClose={() => setShowTopUp(false)} />}
      {showWithdraw && <WithdrawModal onClose={() => setShowWithdraw(false)} />}
      {showBuyCredits && credits && (
        <BuyCreditsModal bundles={credits.bundles} onClose={() => setShowBuyCredits(false)} />
      )}
    </div>
  );
}
