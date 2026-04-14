"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Wallet, ArrowUpCircle, ArrowDownCircle, Plus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWallet, useWalletTransactions, useTopUpWallet } from "@/hooks/use-wallet";
import { useAuth } from "@/context/auth-context";
import { getUserRole, isOwner } from "@/lib/api-types";

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
      {
        amount: parsedAmount,
        reference: reference.trim(),
        description: description.trim() || undefined,
      },
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
        <div className="flex items-center justify-between border-b border-border px-6 py-5">
          <div>
            <h2 className="text-xl font-black tracking-tight text-foreground">Top Up Wallet</h2>
            <p className="mt-1 text-sm text-muted-foreground">Add funds to your organisation wallet.</p>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
            ✕
          </Button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-black uppercase tracking-wider text-muted-foreground">
              Amount (₦) <span className="text-destructive">*</span>
            </label>
            <input
              type="number"
              min="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 500000"
              className="h-11 w-full rounded-full border border-border bg-background px-4 text-sm outline-none transition-all focus:border-brand focus:ring-1 focus:ring-brand/10"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-black uppercase tracking-wider text-muted-foreground">
              Payment Reference <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="e.g. PAY-20240415-001 (must be unique)"
              className="h-11 w-full rounded-full border border-border bg-background px-4 text-sm outline-none transition-all focus:border-brand focus:ring-1 focus:ring-brand/10"
            />
            <p className="mt-1 px-1 text-[11px] text-muted-foreground">
              Use your bank transfer reference or payment ID. The same reference cannot be used twice.
            </p>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-black uppercase tracking-wider text-muted-foreground">
              Note (optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Q2 payroll funding"
              className="h-11 w-full rounded-full border border-border bg-background px-4 text-sm outline-none transition-all focus:border-brand focus:ring-1 focus:ring-brand/10"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border px-6 py-4">
          <Button variant="outline" className="rounded-full px-6" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button
            className="gap-2 rounded-full bg-brand px-6 text-white hover:opacity-90 disabled:opacity-50"
            onClick={handleSubmit}
            disabled={!canSubmit}
          >
            {isPending ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Processing...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Top Up
              </>
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

  // Analysts have no access — redirect to dashboard
  useEffect(() => {
    if (user && role === "analyst") {
      router.replace("/dashboard");
    }
  }, [user, role, router]);

  if (!user || role === "analyst") return null;

  const { data: wallet, isLoading: walletLoading, refetch: refetchWallet } = useWallet();
  const [page, setPage] = useState(0);
  const offset = page * PAGE_SIZE;
  const { data: txData, isLoading: txLoading } = useWalletTransactions(PAGE_SIZE, offset);

  const [showTopUp, setShowTopUp] = useState(false);

  const totalPages = txData ? Math.ceil(txData.total / PAGE_SIZE) : 0;

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-8 md:px-6">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">Wallet</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {owner
              ? "Manage your organisation's prepaid wallet balance."
              : "View your organisation's wallet balance and transaction history."}
          </p>
        </div>
        {owner && (
          <Button
            className="gap-2 rounded-full bg-brand px-5 text-white hover:opacity-90"
            onClick={() => setShowTopUp(true)}
          >
            <Plus className="h-4 w-4" />
            Top Up
          </Button>
        )}
      </div>

      {/* Balance card */}
      <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
        {walletLoading ? (
          <div className="h-20 animate-pulse rounded-xl bg-muted" />
        ) : (
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand/10">
                <Wallet className="h-7 w-7 text-brand" />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                  Available Balance
                </p>
                <p className="mt-0.5 text-3xl font-black tracking-tight text-foreground">
                  {wallet ? formatNGN(wallet.balance) : "₦0.00"}
                </p>
                <p className="text-xs text-muted-foreground/70 mt-0.5">
                  Currency: {wallet?.currency ?? "NGN"}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 shrink-0 text-muted-foreground hover:text-foreground"
              onClick={() => refetchWallet()}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Low balance warning banner */}
        {wallet && wallet.balance < 50000 && wallet.balance >= 0 && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-900/40 dark:bg-amber-950/20">
            <span className="text-base">⚠️</span>
            <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">
              Your balance is below ₦50,000. Top up to avoid run failures.
            </p>
          </div>
        )}
      </div>

      {/* Transaction history */}
      <div>
        <h2 className="mb-4 text-base font-black tracking-tight text-foreground">
          Transaction History
        </h2>

        {txLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        ) : txData && txData.transactions.length > 0 ? (
          <>
            <ul className="space-y-3">
              {txData.transactions.map((tx) => (
                <li
                  key={tx.id}
                  className="flex items-start gap-4 rounded-2xl border border-border/60 bg-card px-5 py-4 shadow-sm"
                >
                  <div
                    className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                      tx.type === "credit"
                        ? "bg-green-100 dark:bg-green-950/40"
                        : "bg-red-100 dark:bg-red-950/40"
                    }`}
                  >
                    {tx.type === "credit" ? (
                      <ArrowUpCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                    ) : (
                      <ArrowDownCircle className="h-5 w-5 text-red-500 dark:text-red-400" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-foreground">
                          {tx.description ?? (tx.type === "credit" ? "Wallet top-up" : "Run spend")}
                        </p>
                        <p className="mt-0.5 font-mono text-[11px] text-muted-foreground/60">
                          {tx.reference}
                        </p>
                        <p className="mt-0.5 text-[11px] text-muted-foreground/50">
                          {formatDate(tx.created_at)} · Balance after: {formatNGN(tx.balance_after)}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 text-base font-black ${
                          tx.type === "credit" ? "text-green-600 dark:text-green-400" : "text-red-500 dark:text-red-400"
                        }`}
                      >
                        {tx.type === "credit" ? "+" : "−"}{formatNGN(tx.amount)}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                  disabled={page === 0}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {page + 1} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-full"
                  disabled={page + 1 >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border/60 py-14 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
              <Wallet className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-base font-black text-foreground">No transactions yet</p>
            <p className="max-w-xs text-sm text-muted-foreground">
              {owner
                ? "Top up your wallet to get started."
                : "Transactions will appear here once the wallet is funded."}
            </p>
          </div>
        )}
      </div>

      {showTopUp && <TopUpModal onClose={() => setShowTopUp(false)} />}
    </div>
  );
}
