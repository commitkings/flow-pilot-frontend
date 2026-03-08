"use client";

import { useMemo, useState } from "react";
import { Plus, Users, UserCheck, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/status-badge";
import { teamMembers } from "@/lib/mock-data";
import { PageHeader } from "@/components/ui/page-header";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { SearchInput } from "@/components/ui/form-fields";
import { DataTable, type TableColumn } from "@/components/ui/data-table";
import { useDashboardShell } from "@/components/dashboard-shell-context";

type TeamMember = typeof teamMembers[0];

const columns: TableColumn<TeamMember>[] = [
  {
    id: "member",
    header: "Member",
    cell: (member) => (
      <div className="flex items-center gap-2">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
          {member.initials}
        </span>
        <div>
          <p className="font-medium text-foreground">
            {member.name} {member.owner ? "👑" : ""}
          </p>
          <p className="text-xs text-muted-foreground">{member.email}</p>
        </div>
      </div>
    ),
  },
  {
    id: "role",
    header: "Role",
    cell: (member) => (
      <StatusBadge
        status={member.role === "Approver" ? "planning" : "pending"}
        label={member.role}
      />
    ),
  },
  {
    id: "status",
    header: "Status",
    cell: (member) => (
      <StatusBadge
        status={member.status.toLowerCase() as "active" | "invited" | "suspended" | "pending"}
        label={member.status}
      />
    ),
  },
  {
    id: "dateAdded",
    header: "Date Added",
    cell: (member) => <span className="text-muted-foreground">{member.dateAdded}</span>,
  },
  {
    id: "lastActive",
    header: "Last Active",
    cell: (member) => <span className="text-muted-foreground">{member.lastActive}</span>,
  },
  {
    id: "actions",
    header: "Actions",
    cell: () => (
      <button type="button" className="text-muted-foreground hover:text-foreground">
        •••
      </button>
    ),
  },
];

export default function TeamPage() {
  const { inviteOpen, setInviteOpen } = useDashboardShell();
  const [teamQuery, setTeamQuery] = useState("");

  const filteredMembers = useMemo(
    () =>
      teamMembers.filter((member) =>
        member.name.toLowerCase().includes(teamQuery.toLowerCase()) ||
        member.email.toLowerCase().includes(teamQuery.toLowerCase())
      ),
    [teamQuery]
  );

  const activeCount = teamMembers.filter((m) => m.status === "Active").length;
  const invitedCount = teamMembers.filter((m) => m.status === "Invited").length;
  const suspendedCount = teamMembers.filter((m) => m.status === "Suspended").length;

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
          value={String(teamMembers.length)}
          subtext="In your workspace"
          icon={<Users className="h-4 w-4" />}
          accent="brand"
        />
        <MetricCard
          label="Active"
          value={String(activeCount)}
          subtext="Currently operational"
          icon={<UserCheck className="h-4 w-4" />}
          accent="green"
        />
        <MetricCard
          label="Pending or Suspended"
          value={String(invitedCount + suspendedCount)}
          subtext="Requires attention"
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

        {/* Table */}
        <DataTable
          columns={columns}
          data={filteredMembers}
          keyExtractor={(member) => member.email}
          emptyState={
            <div className="py-12 text-center">
              <p className="text-base font-black text-foreground">No team members found</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {teamQuery ? "No matches for your search query." : "You have not invited any team members yet."}
              </p>
            </div>
          }
        />
      </div>

      {/* Legacy Invite Modal */}
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
                <Input placeholder="Full Name" className="h-11 rounded-xl" />
                <Input placeholder="Email Address" className="h-11 rounded-xl" />
              </div>

              <div className="pt-2">
                <p className="text-sm font-semibold mb-3 text-foreground">Select Role</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <button type="button" className="rounded-xl border border-border p-4 text-left transition-all hover:border-brand/50 hover:bg-muted/50">
                    <p className="font-bold text-sm mb-1 text-foreground">Analyst</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">Can view runs, transactions, reports, and forecasts.</p>
                  </button>
                  <button type="button" className="rounded-xl border-2 border-brand bg-brand/5 p-4 text-left transition-all">
                    <p className="font-bold text-sm mb-1 text-brand">Approver</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">Can create runs and approve payouts.</p>
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
                  You can change a member&apos;s role at any time from the Team settings.
                </p>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 mt-6 border-t border-border/50">
                <Button variant="ghost" className="rounded-full px-6" onClick={() => setInviteOpen(false)}>Cancel</Button>
                <Button className="rounded-full bg-brand px-6 text-white hover:opacity-90 shadow-sm transition-all hover:shadow">Send Invitation</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
