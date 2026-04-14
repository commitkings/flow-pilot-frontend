/**
 * api-wallet.ts — Wallet API client
 */

import apiClient from "./axios";

export interface Wallet {
  id: string;
  business_id: string;
  balance: number;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface WalletTransaction {
  id: string;
  type: "credit" | "debit";
  amount: number;
  reference: string;
  description: string | null;
  run_id: string | null;
  balance_before: number;
  balance_after: number;
  created_at: string;
}

export interface WalletTransactionListResponse {
  transactions: WalletTransaction[];
  total: number;
  limit: number;
  offset: number;
}

export interface TopUpPayload {
  amount: number;
  reference: string;
  description?: string;
}

export interface TopUpResponse {
  balance: number;
  amount_credited: number;
  reference: string;
  already_processed: boolean;
}

export function fetchWallet(businessId: string): Promise<Wallet> {
  return apiClient
    .get<Wallet>("/wallet", { params: { business_id: businessId } })
    .then((r) => r.data);
}

export function fetchWalletTransactions(
  businessId: string,
  limit = 20,
  offset = 0,
): Promise<WalletTransactionListResponse> {
  return apiClient
    .get<WalletTransactionListResponse>("/wallet/transactions", {
      params: { business_id: businessId, limit, offset },
    })
    .then((r) => r.data);
}

export function topUpWallet(
  businessId: string,
  payload: TopUpPayload,
): Promise<TopUpResponse> {
  return apiClient
    .post<TopUpResponse>("/wallet/topup", payload, {
      params: { business_id: businessId },
    })
    .then((r) => r.data);
}
