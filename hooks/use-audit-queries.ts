"use client";

import { useQuery } from "@tanstack/react-query";
import { listAuditEntries, type AuditFilters } from "@/lib/api-client";

export function useAuditEntries(filters: AuditFilters = {}) {
  return useQuery({
    queryKey: ["audit", filters],
    queryFn: () => listAuditEntries(filters),
    staleTime: 15_000,
    retry: false,
  });
}
