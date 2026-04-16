"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  fetchWallet,
  fetchWalletTransactions,
  topUpWallet,
  withdrawWallet,
  type TopUpPayload,
  type WithdrawPayload,
} from "@/lib/api-wallet";
import { useAuth } from "@/context/auth-context";

function useBusinessId(): string | null {
  const { user } = useAuth();
  return user?.memberships?.[0]?.business_id ?? null;
}

export function useWallet() {
  const businessId = useBusinessId();
  return useQuery({
    queryKey: ["wallet", businessId],
    queryFn: () => fetchWallet(businessId!),
    enabled: !!businessId,
    staleTime: 30_000,
    retry: false,
  });
}

export function useWalletTransactions(limit = 50, offset = 0, month?: string) {
  const businessId = useBusinessId();
  return useQuery({
    queryKey: ["wallet-transactions", businessId, limit, offset, month],
    queryFn: () => fetchWalletTransactions(businessId!, limit, offset, month),
    enabled: !!businessId,
    staleTime: 30_000,
    retry: false,
  });
}

export function useTopUpWallet() {
  const qc = useQueryClient();
  const businessId = useBusinessId();

  return useMutation({
    mutationFn: (payload: TopUpPayload) => topUpWallet(businessId!, payload),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["wallet"] });
      qc.invalidateQueries({ queryKey: ["wallet-transactions"] });
      if (data.already_processed) {
        toast.info("This top-up reference was already processed.");
      } else {
        toast.success(
          `₦${data.amount_credited.toLocaleString("en-NG", { minimumFractionDigits: 2 })} added to your wallet.`,
        );
      }
    },
    onError: () => {
      toast.error("Top-up failed. Please try again.");
    },
  });
}

export function useWithdrawWallet() {
  const qc = useQueryClient();
  const businessId = useBusinessId();

  return useMutation({
    mutationFn: (payload: WithdrawPayload) => withdrawWallet(businessId!, payload),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["wallet"] });
      qc.invalidateQueries({ queryKey: ["wallet-transactions"] });
      toast.success(
        `₦${data.amount_debited.toLocaleString("en-NG", { minimumFractionDigits: 2 })} withdrawal recorded.`,
      );
    },
    onError: (err: Error) => {
      toast.error(err.message || "Withdrawal failed. Please try again.");
    },
  });
}
