"use client";

import { useMemo, useState } from "react";
import { Loader2, Plus, Users, UserCheck, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/status-badge";
import { PageHeader } from "@/components/ui/page-header";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { SearchInput } from "@/components/ui/form-fields";
import { DataTable, type TableColumn } from "@/components/ui/data-table";
import { useDashboardShell } from "@/components/dashboard-shell-context";
import {
  useTeamMembers,
  useInviteMember,
  useRemoveMember,
  useUpdateMemberRole,
} from "@/hooks/use-team-queries";
import type { TeamMember } from "@/lib/api-types";

function getInitials(name: string | null): string {
  if (!name) return "??";
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const columns: TableColumn<TeamMember>[] = [
  {
    id: "member",
    header: "Member",
    cell: (member) => (
      <div className="flex items-center gap-2">
        {member.user?.avatar_url ? (
          <img src={member.user.avatar_url} alt="" className="h-8 w-8 rounded-full object-cover" />
        ) : (
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
            {getInitials(member.user?.display_name ?? null)}
          </span>
        )}
        <div>
          <p className="font-medium text-foreground">
            {member.user?.display_name ?? "Unknown"} {member.role === "owner" ? "👑" : ""}
          </p>
          <p className="text-xs text-muted-foreground">{member.user?.email ?? "—"}</p>
        </div>
      </div>
    ),
  },
  {
    id: "role",
    header: "Role",
    cell: (member) => (
      <StatusBadge
        status={member.role === "approver" || member.role === "owner" ? "planning" : "pending"}
        label={member.role}
      />
    ),
  },
  {
    id: "joinedAt",
    header: "Joined",
    cell: (member) => (
      <span className="text-muted-foreground">
        {member.joined_at
          ? new Date(member.joined_at).toLocaleDateString("en-NG", { month: "short", day: "numeric", year: "numeric" })
          : "—"}
      </span>
    ),
  },
  {
    id: "createdAt",
    header: "Added",
    cell: (member) => (
      <span className="text-muted-foreground">
        {new Date(member.created_at).toLocaleDateString("en-NG", { month: "short", day: "numeric", year: "numeric" })}
      </span>
    ),
  },
];

export default function TeamPage() {
  const { inviteOpen, setInviteOpen } = useDashboardShell();
  const [teamQuery, setTeamQuery] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("analyst");

  const { data, isLoading, isError } = useTeamMembers();
  const inviteMutation = useInviteMember();

  const members = data?.members ?? [];

  const filteredMembers = useMemo(
    () =>
      members.filter(
        (m) =>
          (m.user?.display_name ?? "").toLowerCase().includes(teamQuery.toLowerCase()) ||
          (m.user?.email ?? "").toLowerCase().includes(teamQuery.toLowerCase())
      ),
    [members, teamQuery]
  );

  const totalCount = members.length;
  const ownerApproverCount = members.filter(
    (m) => m.role === "owner" || m.role === "approver"
  ).length;
  const analystCount = members.filter((m) => m.role === "analyst").length;

  const handleInvite = () => {
    if (!inviteEmail) return;
    inviteMutation.mutate(
      { email: inviteEmail, role: inviteRole },
      {
        onSuccess: () => {
          setInviteEmail("");
          setInviteRole("analyst");
          setInviteOpen(false);
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <PageHeader
          title="Team Members"
          description="Manage who has access to your FlowPilot workspace and control what they can do."
        />
      </div>

      <div className="rounded-xl border border-blue-200 bg-blue-50/50 px-5 py-4 text-sm text-blue-900 shadow-sm transition-colors">
        <p className="font-semibold mb-1">Role Permissions</p>
        FlowPilot has two roles. <span className="font-bold">Analysts</span> can view runs, transactions, and reports but cannot approve payouts or start runs. <span className="font-bold">Approvers</span> have full access including creating runs and approving disbursements.
      </div>

      {/* Metric cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard
          label="Total Members"
          value={isLoading ? "…" : String(totalCount)}
          subtext="In your workspace"
          icon={<Users className="h-4 w-4" />}
          accent="brand"
        />
        <MetricCard
          label="Approvers"
          value={isLoading ? "…" : String(ownerApproverCount)}
          subtext="Owners & Approvers"
          icon={<UserCheck className="h-4 w-4" />}
          accent="green"
        />
        <MetricCard
          label="Analysts"
          value={isLoading ? "…" : String(analystCount)}
          subtext="View-only access"
          icon={<UserX className="h-4 w-4" />}
          accent="amber"
        />
      </div>

      <div className="">
        {/* Toolbar */}
        <div className="flex flex-col gap-4 py-4 md:flex-row md:items-center md:justify-between">
          <SearchInput
            value={teamQuery}
            onChange={setTeamQuery}
            placeholder="Search by name or email…"
            className="w-full md:w-80"
          />
        </div>

        {isLoading ? (
          <div className="py-16 text-center">
            <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : isError ? (
          <div className="py-12 text-center text-sm text-destructive">
            Failed to load team members. Please refresh.
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={filteredMembers}
            keyExtractor={(member) => member.id}
            emptyState={
              <div className="py-12 text-center">
                <p className="text-base font-black text-foreground">No team members found</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {teamQuery ? "No matches for your search query." : "You have not invited any team members yet."}
                </p>
              </div>
            }
          />
        )}
      </div>

      {/* Invite Modal */}
      {inviteOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-200 border border-border">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xl font-bold tracking-tight text-foreground">Invite a Team Member</h3>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setInviteOpen(false)}>×</Button>
            </div>
            <p className="text-sm text-muted-foreground mb-6">They will receive an email invitation to join your FlowPilot workspace.</p>

            <div className="space-y-4">
              <div className="space-y-3">
                <Input
                  placeholder="Email Address"
                  className="h-11 rounded-xl"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>

              <div className="pt-2">
                <p className="text-sm font-semibold mb-3 text-foreground">Select Role</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    className={`rounded-xl border p-4 text-left transition-all ${
                      inviteRole === "analyst"
                        ? "border-2 border-brand bg-brand/5"
                        : "border-border hover:border-brand/50 hover:bg-muted/50"
                    }`}
                    onClick={() => setInviteRole("analyst")}
                  >
                    <p className={`font-bold text-sm mb-1 ${inviteRole === "analyst" ? "text-brand" : "text-foreground"}`}>Analyst</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">Can view runs, transactions, reports, and forecasts.</p>
                  </button>
                  <button
                    type="button"
                    className={`rounded-xl border p-4 text-left transition-all ${
                      inviteRole === "approver"
                        ? "border-2 border-brand bg-brand/5"
                        : "border-border hover:border-brand/50 hover:bg-muted/50"
                    }`}
                    onClick={() => setInviteRole("approver")}
                  >
                    <p className={`font-bold text-sm mb-1 ${inviteRole === "approver" ? "text-brand" : "text-foreground"}`}>Approver</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">Can create runs and approve payouts.</p>
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
                  You can change a member&apos;s role at any time from the Team settings.
                </p>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 mt-6 border-t border-border/50">
                <Button variant="ghost" className="rounded-full px-6" onClick={() => setInviteOpen(false)}>Cancel</Button>
                <Button
                  className="rounded-full bg-brand px-6 text-white hover:opacity-90 shadow-sm transition-all hover:shadow"
                  onClick={handleInvite}
                  disabled={inviteMutation.isPending || !inviteEmail}
                >
                  {inviteMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Send Invitation
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
