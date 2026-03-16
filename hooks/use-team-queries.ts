"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  listTeamMembers,
  inviteTeamMember,
  updateTeamMemberRole,
  removeTeamMember,
} from "@/lib/api-client";
import type { InviteMemberPayload } from "@/lib/api-types";

export function useTeamMembers() {
  return useQuery({
    queryKey: ["team-members"],
    queryFn: () => listTeamMembers({ limit: 200 }),
    staleTime: 15_000,
  });
}

export function useInviteMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: InviteMemberPayload) => inviteTeamMember(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["team-members"] });
      toast.success("Invitation sent successfully");
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to invite member");
    },
  });
}

export function useUpdateMemberRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ memberId, role }: { memberId: string; role: string }) =>
      updateTeamMemberRole(memberId, role),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["team-members"] });
      toast.success("Role updated");
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to update role");
    },
  });
}

export function useRemoveMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (memberId: string) => removeTeamMember(memberId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["team-members"] });
      toast.success("Member removed");
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to remove member");
    },
  });
}
