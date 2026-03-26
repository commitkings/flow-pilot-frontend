"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  changePassword,
  exportAccountData,
  getConnections,
  getOrgProfile,
  removeAvatar,
  updateMe,
  updateOrgProfile,
  uploadAvatar,
} from "@/lib/api-client";
import type { User } from "@/lib/api-types";

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
  return useMutation({
    mutationFn: (file: File) => uploadAvatar(file),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["auth-user"] });
      toast.success("Avatar uploaded");
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to upload avatar");
    },
  });
}

export function useRemoveAvatar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => removeAvatar(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["auth-user"] });
      toast.success("Avatar removed");
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to remove avatar");
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: ({ current, next }: { current: string; next: string }) =>
      changePassword(current, next),
    onSuccess: () => toast.success("Password updated successfully"),
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to change password");
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
