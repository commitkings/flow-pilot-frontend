"use client";

import { useQuery } from "@tanstack/react-query";
import { listApprovals, type ApprovalFilters } from "@/lib/api-client";

export function useApprovals(filters: ApprovalFilters = {}) {
  return useQuery({
    queryKey: ["approvals", filters],
    queryFn: () => listApprovals(filters),
    staleTime: 15_000,
    retry: false,
  });
}
