"use client";

import { useQuery } from "@tanstack/react-query";
import { listTransactions, type TransactionFilters } from "@/lib/api-client";

export function useTransactions(filters: TransactionFilters = {}) {
  return useQuery({
    queryKey: ["transactions", filters],
    queryFn: () => listTransactions(filters),
    enabled: Object.values(filters).some(Boolean),
  });
}
