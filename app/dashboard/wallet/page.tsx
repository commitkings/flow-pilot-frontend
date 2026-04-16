"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Plus,
  RefreshCw,
  ShieldAlert,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWallet, useWalletTransactions, useTopUpWallet } from "@/hooks/use-wallet";
import { useAuth } from "@/context/auth-context";
import { getUserRole, isOwner } from "@/lib/api-types";
import { PageHeader } from "@/components/ui/page-header";

const PAGE_SIZE = 20;

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
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/50 px-6 py-5">
          <div>
            <h2 className="text-lg font-black tracking-tight text-foreground">Top Up Wallet</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">Add funds to your organisation wallet.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">
              Amount (₦) <span className="text-destructive">*</span>
            </label>
            <input
              type="number"
              min="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 500000"
              className="h-10 w-full rounded-full border border-border/60 bg-background px-4 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-brand focus:ring-1 focus:ring-brand/10"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">
              Payment Reference <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="e.g. PAY-20240415-001"
              className="h-10 w-full rounded-full border border-border/60 bg-background px-4 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-brand focus:ring-1 focus:ring-brand/10"
            />
            <p className="mt-1.5 px-1 text-[11px] text-muted-foreground">
              Use your bank transfer reference or payment ID. The same reference cannot be used twice.
            </p>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">
              Note <span className="text-muted-foreground/50">(optional)</span>
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Q2 payroll funding"
              className="h-10 w-full rounded-full border border-border/60 bg-background px-4 text-sm outline-none transition-all placeholder:text-muted-foreground focus:border-brand focus:ring-1 focus:ring-brand/10"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-border/50 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="inline-flex items-center rounded-full border border-border/60 bg-transparent px-5 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:border-border hover:bg-muted/40 hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
          >
            Cancel
          </button>
          <Button
            className="gap-2 rounded-full bg-brand px-6 text-white hover:opacity-90 disabled:opacity-50"
            onClick={handleSubmit}
            disabled={!canSubmit}
          >
            {isPending ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Processing…</>
            ) : (
              <><Plus className="h-4 w-4" /> Top Up</>
            )}
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
  const [page, setPage] = useState(0);
  const offset = page * PAGE_SIZE;
  const { data: txData, isLoading: txLoading } = useWalletTransactions(PAGE_SIZE, offset);
  const [showTopUp, setShowTopUp] = useState(false);

  const totalPages = txData ? Math.ceil(txData.total / PAGE_SIZE) : 0;

  // ── KYC gate ──────────────────────────────────────────────────────────────
  const walletErrorMessage = walletError && walletErrorObj instanceof Error ? walletErrorObj.message : "";
  const isKycError = walletError && walletErrorMessage.toUpperCase().includes("KYC");

  if (isKycError) {
    const isPending = walletErrorMessage.toLowerCase().includes("pending");
    const isRejected = walletErrorMessage.toLowerCase().includes("rejected");

    return (
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 md:px-6">
        <PageHeader title="Wallet" description="Manage your organisation's prepaid wallet." />
        <div className="flex flex-col items-center gap-5 rounded-2xl border border-border/60 bg-card p-10 text-center shadow-sm">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
            <ShieldAlert className="h-7 w-7 text-muted-foreground" />
          </div>
          <div>
            <h2 className="text-base font-black text-foreground">
              {isRejected ? "Verification Rejected" : "Verification Required"}
            </h2>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground leading-relaxed">
              {isRejected
                ? "Your identity verification was rejected. Please resubmit your documents to access your wallet."
                : isPending
                ? "Your identity verification is under review. Wallet access will be enabled once approved."
                : "Complete identity verification to access your wallet. This helps us keep your funds safe and comply with financial regulations."}
            </p>
          </div>
          {!isPending && (
            <Button
              className="rounded-full bg-brand px-6 text-white hover:opacity-90"
              onClick={() => router.push("/dashboard/settings?tab=workspace")}
            >
              {isRejected ? "Resubmit Verification" : "Complete Verification"}
            </Button>
          )}
        </div>
      </div>
    );
  }

  const lowBalance = wallet && wallet.balance < 50000 && wallet.balance >= 0;

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 md:px-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <PageHeader
          title="Wallet"
          description={owner
            ? "Manage your organisation's prepaid wallet balance."
            : "View your organisation's wallet balance and transaction history."}
        />
        {owner && (
          <Button
            className="shrink-0 gap-2 rounded-full bg-brand px-5 text-white hover:opacity-90"
            onClick={() => setShowTopUp(true)}
          >
            <Plus className="h-4 w-4" />
            Top Up
          </Button>
        )}
      </div>

      {/* Balance card */}
      <div className="rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden">
        <div className="px-6 py-6">
          {walletLoading ? (
            <div className="h-20 animate-pulse rounded-xl bg-muted" />
          ) : (
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand/10 shrink-0">
                  <Wallet className="h-6 w-6 text-brand" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    Available Balance
                  </p>
                  <p className="mt-1 text-3xl font-black tracking-tight text-foreground">
                    {wallet ? formatNGN(wallet.balance) : "₦0.00"}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {wallet?.currency ?? "NGN"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => refetchWallet()}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                title="Refresh balance"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* Low balance notice */}
        {lowBalance && (
          <div className="flex items-center gap-3 border-t border-border/50 bg-muted/30 px-6 py-3">
            <div className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
            <p className="text-sm text-muted-foreground">
              Balance is below <span className="font-semibold text-foreground">₦50,000</span> — top up to avoid run failures.
            </p>
            {owner && (
              <button
                type="button"
                onClick={() => setShowTopUp(true)}
                className="ml-auto shrink-0 text-xs font-semibold text-brand hover:underline"
              >
                Top up now
              </button>
            )}
          </div>
        )}
      </div>

      {/* Transaction history */}
      <div>
        <div className="flex items-center gap-2.5 mb-4">
          <span className="h-4 w-1 rounded-full bg-brand shrink-0" />
          <h2 className="text-base font-black tracking-tight text-foreground">Transaction History</h2>
        </div>

        {txLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        ) : txData && txData.transactions.length > 0 ? (
          <>
            <div className="space-y-2">
              {txData.transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center gap-4 rounded-xl border border-border/60 bg-card px-5 py-4 transition-colors hover:bg-muted/20"
                >
                  {/* Icon */}
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border ${
                    tx.type === "credit"
                      ? "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30"
                      : "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/30"
                  }`}>
                    {tx.type === "credit" ? (
                      <ArrowUpRight className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <ArrowDownLeft className="h-4 w-4 text-red-500 dark:text-red-400" />
                    )}
                  </div>

                  {/* Details */}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {tx.description ?? (tx.type === "credit" ? "Wallet top-up" : "Payout spend")}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {formatDate(tx.created_at)}
                      <span className="mx-1.5 text-muted-foreground/40">·</span>
                      <span className="font-mono">{tx.reference}</span>
                    </p>
                  </div>

                  {/* Amount */}
                  <div className="shrink-0 text-right">
                    <p className={`text-sm font-black ${
                      tx.type === "credit"
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-red-500 dark:text-red-400"
                    }`}>
                      {tx.type === "credit" ? "+" : "−"}{formatNGN(tx.amount)}
                    </p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      Bal: {formatNGN(tx.balance_after)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-5 flex items-center justify-between">
                <button
                  type="button"
                  disabled={page === 0}
                  onClick={() => setPage((p) => p - 1)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-transparent px-4 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:border-border hover:bg-muted/40 hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </button>
                <span className="text-sm text-muted-foreground">
                  Page {page + 1} of {totalPages}
                </span>
                <button
                  type="button"
                  disabled={page + 1 >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-transparent px-4 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:border-border hover:bg-muted/40 hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border/60 py-14 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
              <Wallet className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-base font-black text-foreground">No transactions yet</p>
              <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                {owner
                  ? "Top up your wallet to get started."
                  : "Transactions will appear here once the wallet is funded."}
              </p>
            </div>
          </div>
        )}
      </div>

      {showTopUp && <TopUpModal onClose={() => setShowTopUp(false)} />}
    </div>
  );
}
