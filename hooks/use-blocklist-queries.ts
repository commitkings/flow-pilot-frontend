"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  createBlocklistEntry,
  deleteBlocklistEntry,
  listBlocklistEntries,
  toggleBlocklistEntry,
  type CreateBlocklistEntryPayload,
} from "@/lib/api-blocklist";

export interface BlocklistFilters {
  search?: string;
  type?: string;
}

export function useBlocklist(filters: BlocklistFilters = {}) {
  return useQuery({
    queryKey: ["blocklist", filters],
    queryFn: () => listBlocklistEntries(filters),
    staleTime: 15_000,
    retry: false,
  });
}

export function useAddToBlocklist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateBlocklistEntryPayload) =>
      createBlocklistEntry(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["blocklist"] });
      toast.success("Entry added to blocklist");
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to add entry");
    },
  });
}

export function useRemoveFromBlocklist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteBlocklistEntry(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["blocklist"] });
      toast.success("Entry removed from blocklist");
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to remove entry");
    },
  });
}

export function useToggleBlocklistEntry() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      toggleBlocklistEntry(id, is_active),
    onSuccess: (_, { is_active }) => {
      qc.invalidateQueries({ queryKey: ["blocklist"] });
      toast.success(is_active ? "Entry activated" : "Entry suspended");
    },
    onError: (err) => {
      toast.error(
        err instanceof Error ? err.message : "Failed to update entry status"
      );
    },
  });
}
