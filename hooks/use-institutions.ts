"use client";

import { useQuery } from "@tanstack/react-query";
import { listInstitutions } from "@/lib/api-client";

export function useInstitutions(enabled = true) {
  return useQuery({
    queryKey: ["institutions"],
    queryFn: listInstitutions,
    staleTime: 5 * 60_000, // institutions rarely change, cache for 5 min
    enabled,
  });
}
