"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  get2FAStatus,
  setup2FA,
  enable2FA,
  disable2FA,
  regenerateBackupCodes,
  setOrgRequire2FA,
} from "@/lib/api-client";

export function use2FAStatus() {
  return useQuery({
    queryKey: ["2fa-status"],
    queryFn: () => get2FAStatus(),
    staleTime: 30_000,
  });
}

export function use2FASetup() {
  return useMutation({
    mutationFn: () => setup2FA(),
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to start 2FA setup");
    },
  });
}

export function use2FAEnable() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (code: string) => enable2FA(code),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["2fa-status"] });
      qc.invalidateQueries({ queryKey: ["auth-user"] });
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to enable 2FA");
    },
  });
}

export function use2FADisable() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (password: string) => disable2FA(password),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["2fa-status"] });
      qc.invalidateQueries({ queryKey: ["auth-user"] });
      toast.success("Two-factor authentication disabled");
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to disable 2FA");
    },
  });
}

export function useRegenerateBackupCodes() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => regenerateBackupCodes(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["2fa-status"] });
      toast.success("New backup codes generated");
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to regenerate backup codes");
    },
  });
}

export function useSetOrgRequire2FA() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (require: boolean) => setOrgRequire2FA(require),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["org-profile"] });
      toast.success(
        data.require_2fa
          ? "2FA enforcement enabled for all team members"
          : "2FA enforcement disabled"
      );
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to update 2FA enforcement");
    },
  });
}
