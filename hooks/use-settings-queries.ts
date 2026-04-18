"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useAuth } from "@/context/auth-context";
import {
  changePassword,
  deleteAccount,
  deleteSelfAccount,
  exportAccountData,
  getConnections,
  getNotificationPreferences,
  getOrgProfile,
  importAccountData,
  removeAvatar,
  requestDeleteCode,
  updateMe,
  updateNotificationPreferences,
  updateOrgConfig,
  updateOrgProfile,
  uploadAvatar,
} from "@/lib/api-client";
import type { NotificationPreferences, User } from "@/lib/api-types";

export function useOrgProfile() {
  return useQuery({
    queryKey: ["org-profile"],
    queryFn: () => getOrgProfile(),
    staleTime: 30_000,
  });
}

export function useConnections() {
  return useQuery({
    queryKey: ["connections"],
    queryFn: () => getConnections(),
    staleTime: 60_000,
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<User>) => updateMe(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["auth-user"] });
      toast.success("Profile updated");
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to update profile");
    },
  });
}

export function useUploadAvatar() {
  const qc = useQueryClient();
  const { refreshUser } = useAuth();
  return useMutation({
    mutationFn: (file: File) => uploadAvatar(file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["auth-user"] });
      refreshUser();
      toast.success("Avatar uploaded");
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to upload avatar");
    },
  });
}

export function useRemoveAvatar() {
  const qc = useQueryClient();
  const { refreshUser } = useAuth();
  return useMutation({
    mutationFn: () => removeAvatar(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["auth-user"] });
      refreshUser();
      toast.success("Avatar removed");
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to remove avatar");
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: ({ current, next, totpCode }: { current: string; next: string; totpCode?: string }) =>
      changePassword(current, next, totpCode),
    onSuccess: () => toast.success("Password updated successfully"),
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to change password");
    },
  });
}

export function useRequestDeleteCode() {
  return useMutation({
    mutationFn: () => requestDeleteCode(),
    onSuccess: () => toast.success("Verification code sent to your email"),
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to send verification code");
    },
  });
}

export function useUpdateOrgProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => updateOrgProfile(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["org-profile"] });
      toast.success("Organisation profile updated");
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to update organisation");
    },
  });
}

export function useUpdateOrgConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => updateOrgConfig(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["org-profile"] });
      toast.success("Business configuration updated");
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to update configuration");
    },
  });
}

export function useExportAccountData() {
  return useMutation({
    mutationFn: () => exportAccountData(),
    onSuccess: (blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "flowpilot-export.json";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Data exported successfully");
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to export data");
    },
  });
}

export function useDeleteAccount(onDeleted: () => void) {
  return useMutation({
    mutationFn: (params?: { totp_code?: string; delete_code?: string }) => deleteAccount(params),
    onSuccess: () => {
      toast.success("Organisation deleted. Signing you out…");
      onDeleted();
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to delete organisation");
    },
  });
}

export function useDeleteSelfAccount(onDeleted: () => void) {
  return useMutation({
    mutationFn: (params?: { totp_code?: string; delete_code?: string }) => deleteSelfAccount(params),
    onSuccess: () => {
      toast.success("Account deleted. Signing you out…");
      onDeleted();
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to delete account");
    },
  });
}

export function useImportAccountData() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => importAccountData(file),
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ["org-profile"] });
      qc.invalidateQueries({ queryKey: ["auth-user"] });
      qc.invalidateQueries({ queryKey: ["team-members"] });
      const restored = result.restored.join(", ");
      toast.success(`Data imported successfully — restored: ${restored}`);
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to import data");
    },
  });
}

export function useNotificationPreferences() {
  return useQuery({
    queryKey: ["notification-preferences"],
    queryFn: () => getNotificationPreferences(),
    staleTime: 30_000,
  });
}

export function useUpdateNotificationPreferences() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (prefs: Partial<NotificationPreferences>) => updateNotificationPreferences(prefs),
    onSuccess: (data) => {
      qc.setQueryData(["notification-preferences"], data);
      toast.success("Notification preferences saved");
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to save preferences");
    },
  });
}
