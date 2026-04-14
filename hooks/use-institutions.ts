"use client";

import { useQuery } from "@tanstack/react-query";
import { listInstitutions } from "@/lib/api-client";
import type { InstitutionsResponse } from "@/lib/api-types";

const EMPTY: InstitutionsResponse = { total: 0, count: 0, source: "empty", data: [] };

interface UseInstitutionsParams {
  enabled?: boolean;
  search?: string;
  institution_type?: string;
  limit?: number;
  offset?: number;
}

export function useInstitutions({ enabled = true, search, institution_type, limit = 50, offset = 0 }: UseInstitutionsParams = {}) {
  return useQuery({
    queryKey: ["institutions", search, institution_type, limit, offset],
    queryFn: async () => {
      try {
        return await listInstitutions({ search, institution_type, limit, offset });
      } catch {
        return EMPTY;
      }
    },
    staleTime: 5 * 60_000,
    enabled,
  });
}
