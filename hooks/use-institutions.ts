"use client";

import { useQuery } from "@tanstack/react-query";
import { listInstitutions } from "@/lib/api-client";
import { ApiError } from "@/lib/api-types";
import type { InstitutionsResponse } from "@/lib/api-types";

const EMPTY: InstitutionsResponse = { count: 0, source: "empty", data: [] };

export function useInstitutions(enabled = true) {
  return useQuery({
    queryKey: ["institutions"],
    queryFn: async () => {
      try {
        return await listInstitutions();
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) return EMPTY;
        throw err;
      }
    },
    staleTime: 5 * 60_000,
    enabled,
  });
}
