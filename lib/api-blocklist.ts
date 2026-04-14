import apiClient from "./axios";

export type BlocklistEntryType = "account_number" | "beneficiary_name" | "bank_code";

export interface BlocklistEntry {
  id: string;
  type: BlocklistEntryType;
  value: string;
  reason: string;
  added_by: string;
  created_at: string;
  is_active: boolean;
}

export interface BlocklistListResponse {
  entries: BlocklistEntry[];
  total: number;
  limit: number;
  offset: number;
}

export type CreateBlocklistEntryPayload = {
  type: BlocklistEntryType;
  value: string;
  reason: string;
};

export function listBlocklistEntries(
  params?: { search?: string; type?: string }
): Promise<BlocklistListResponse> {
  return apiClient
    .get<BlocklistListResponse>("/org/blocklist", { params })
    .then((r) => r.data);
}

export function createBlocklistEntry(
  payload: CreateBlocklistEntryPayload
): Promise<BlocklistEntry> {
  return apiClient
    .post<BlocklistEntry>("/org/blocklist", payload)
    .then((r) => r.data);
}

export function deleteBlocklistEntry(id: string): Promise<{ status: string }> {
  return apiClient
    .delete<{ status: string }>(`/org/blocklist/${id}`)
    .then((r) => r.data);
}

export function toggleBlocklistEntry(
  id: string,
  is_active: boolean
): Promise<BlocklistEntry> {
  return apiClient
    .patch<BlocklistEntry>(`/org/blocklist/${id}`, { is_active })
    .then((r) => r.data);
}
