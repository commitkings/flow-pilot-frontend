"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getCredits, purchaseCredits, listCreditTransactions } from "@/lib/api-client";
import type { CreditPurchasePayload } from "@/lib/api-client";
import { ApiError } from "@/lib/api-types";
import { useAuth } from "@/context/auth-context";

function useBusinessId() {
  const { user } = useAuth();
  return user?.memberships?.[0]?.business_id;
}

export function useCredits() {
  const businessId = useBusinessId();
  return useQuery({
    queryKey: ["credits", businessId],
    queryFn: () => getCredits(businessId!),
    enabled: !!businessId,
    staleTime: 30_000,
  });
}

export function useCreditTransactions(limit = 50, offset = 0) {
  const businessId = useBusinessId();
  return useQuery({
    queryKey: ["credit-transactions", businessId, limit, offset],
    queryFn: () => listCreditTransactions(businessId!, limit, offset),
    enabled: !!businessId,
  });
}

export function usePurchaseCredits(onSuccess?: () => void) {
  const queryClient = useQueryClient();
  const businessId = useBusinessId();

  return useMutation({
    mutationFn: (payload: CreditPurchasePayload) => purchaseCredits(businessId!, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["credits"] });
      queryClient.invalidateQueries({ queryKey: ["credit-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["wallet"] });
      if (data.already_processed) {
        toast.info("This reference was already processed — credits unchanged.");
      } else {
        toast.success(`${data.credits_added} credits added. New balance: ${data.balance} credits.`);
      }
      onSuccess?.();
    },
    onError: (err) => {
      const message = err instanceof ApiError ? err.message : "Failed to purchase credits.";
      toast.error(message);
    },
  });
}
