"use client";

import { useQuery } from "@tanstack/react-query";
import { listAuditEntries, type AuditFilters } from "@/lib/api-client";

export function useAuditEntries(filters: AuditFilters = {}, limit = 50, offset = 0) {
  return useQuery({
    queryKey: ["audit", filters, limit, offset],
    queryFn: () => listAuditEntries({ ...filters, limit, offset }),
    staleTime: 15_000,
    retry: false,
  });
}
