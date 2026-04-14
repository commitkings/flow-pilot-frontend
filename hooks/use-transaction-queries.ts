"use client";

import { useQuery } from "@tanstack/react-query";
import { listTransactions, type TransactionFilters } from "@/lib/api-client";

export function useTransactions(filters: TransactionFilters = {}, limit = 50, offset = 0) {
  return useQuery({
    queryKey: ["transactions", filters, limit, offset],
    queryFn: () => listTransactions({ ...filters, limit, offset }),
    staleTime: 15_000,
    retry: false,
  });
}
