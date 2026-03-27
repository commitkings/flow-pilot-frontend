/**
 * axios.ts — Configured Axios instance for FlowPilot API
 *
 * - Base URL from NEXT_PUBLIC_API_BASE_URL (defaults to local dev)
 * - Request interceptor: attaches Bearer token when present
 * - Response interceptor: normalises API errors into ApiError, clears token on 401
 */

import axios, { type AxiosError, type AxiosResponse } from "axios";
import { getToken, clearToken } from "./token-storage";
import { ApiError } from "./api-types";

const apiClient = axios.create({
  baseURL: "/api/proxy",
  headers: { "Content-Type": "application/json" },
});

// ── Request interceptor — attach auth token ───────────────────────────────────

apiClient.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response interceptor — normalise errors ───────────────────────────────────

apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError<{ detail?: string | Array<{ msg: string }> }>) => {
    const status = error.response?.status ?? 0;

    if (status === 401) clearToken();

    const raw = error.response?.data?.detail;
    let detail: string;
    if (typeof raw === "string") {
      detail = raw;
    } else if (Array.isArray(raw)) {
      detail = raw.map((e) => e.msg).join("; ");
    } else {
      detail = error.response?.statusText ?? error.message ?? "Unexpected error";
    }

    return Promise.reject(new ApiError(status, { detail }));
  },
);

export default apiClient;
