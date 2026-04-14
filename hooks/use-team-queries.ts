"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  inviteTeamMember,
  listTeamMembers,
  removeTeamMember,
  toggleMemberStatus,
  updateTeamMemberRole,
} from "@/lib/api-client";
import type { InviteMemberPayload, InviteResult } from "@/lib/api-types";

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
    mutationFn: (payload: InviteMemberPayload) =>
      inviteTeamMember(payload) as Promise<InviteResult>,
    onSuccess: (result: InviteResult) => {
      qc.invalidateQueries({ queryKey: ["team-members"] });
      if (result.status === "added") {
        toast.success("Member added to your team");
      } else {
        toast.success("Invite email sent — they'll get a link to sign up");
      }
    },
    onError: (err) => {
      toast.error(
        err instanceof Error ? err.message : "Failed to invite member",
      );
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

export function useToggleMemberStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ memberId, isActive }: { memberId: string; isActive: boolean }) =>
      toggleMemberStatus(memberId, isActive),
    onSuccess: (_, { isActive }) => {
      qc.invalidateQueries({ queryKey: ["team-members"] });
      toast.success(isActive ? "Member re-enabled" : "Member disabled");
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to update member status");
    },
  });
}
