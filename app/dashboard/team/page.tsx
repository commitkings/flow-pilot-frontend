"use client";

import { useRef, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileText,
  Loader2,
  MoreHorizontal,
  Plus,
  Shield,
  Trash2,
  Upload,
  UserCheck,
  UserMinus,
  UserPlus,
  Users,
  UserX,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/status-badge";
import { PageHeader } from "@/components/ui/page-header";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { SearchInput } from "@/components/ui/form-fields";
import { DataTable, type TableColumn } from "@/components/ui/data-table";
import { useDashboardShell } from "@/components/dashboard-shell-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useDeleteMemberUser,
  useInviteMember,
  useRemoveMember,
  useResendInvitation,
  useRevokeInvitation,
  useTeamMembers,
  useToggleMemberStatus,
  useUpdateMemberRole,
} from "@/hooks/use-team-queries";
import { useAuth } from "@/context/auth-context";
import { importTeamMembers, getTeamImportTemplateUrl, getActiveSessions } from "@/lib/api-client";
import type { BulkImportResult } from "@/lib/api-client";
import type { TeamMember } from "@/lib/api-types";
import { useQuery } from "@tanstack/react-query";

// ── helpers ───────────────────────────────────────────────────────────────────

function getInitials(name: string | null): string {
  if (!name) return "??";
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// ── sub-components ────────────────────────────────────────────────────────────

function RoleChip({ role }: { role: string }) {
  return (
    <StatusBadge
      status={role === "approver" || role === "owner" ? "planning" : "pending"}
      label={role}
    />
  );
}

/** Actions for pending (not yet joined) invitations. */
function PendingInviteActions({ member }: { member: TeamMember }) {
  const revokeInvite = useRevokeInvitation();
  const resendInvite = useResendInvitation();
  const [confirmRevoke, setConfirmRevoke] = useState(false);

  const busy = revokeInvite.isPending || resendInvite.isPending;

  const handleRevoke = () => {
    if (!confirmRevoke) {
      setConfirmRevoke(true);
      setTimeout(() => setConfirmRevoke(false), 3000);
      return;
    }
    revokeInvite.mutate(member.id);
    setConfirmRevoke(false);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          disabled={busy}
          className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground data-[state=open]:bg-muted"
        >
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MoreHorizontal className="h-3.5 w-3.5" />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuItem
          onClick={() => resendInvite.mutate(member.id)}
          className="cursor-pointer gap-2"
        >
          <UserPlus className="h-3.5 w-3.5 text-muted-foreground" />
          <span>Resend invitation</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleRevoke}
          className={`cursor-pointer gap-2 focus:bg-destructive/10 ${
            confirmRevoke ? "text-destructive focus:text-destructive" : "text-muted-foreground"
          }`}
        >
          <XCircle className="h-3.5 w-3.5" />
          <span>{confirmRevoke ? "Tap again to confirm" : "Revoke invitation"}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Inline role-change + disable/enable + remove + delete dropdown, shown only to the business owner. */
function MemberActions({
  member,
  currentUserId,
}: {
  member: TeamMember;
  currentUserId: string;
}) {
  const updateRole = useUpdateMemberRole();
  const removeMember = useRemoveMember();
  const deleteUser = useDeleteMemberUser();
  const toggleStatus = useToggleMemberStatus();
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const isSelf = member.user_id === currentUserId;
  const isOwner = member.role === "owner";

  // Owners and self cannot be acted on via this menu; pending invites use PendingInviteActions
  if (isSelf || isOwner || member.is_pending) return null;

  const otherRole = member.role === "approver" ? "analyst" : "approver";
  const otherLabel = otherRole === "approver" ? "Approver" : "Analyst";

  const handleRoleChange = () => updateRole.mutate({ memberId: member.id, role: otherRole });
  const handleToggleStatus = () => toggleStatus.mutate({ memberId: member.id, isActive: !member.is_active });

  const handleRemove = () => {
    if (!confirmRemove) {
      setConfirmRemove(true);
      setConfirmDelete(false);
      setTimeout(() => setConfirmRemove(false), 3000);
      return;
    }
    removeMember.mutate(member.id);
    setConfirmRemove(false);
  };

  const handleDeleteUser = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      setConfirmRemove(false);
      setTimeout(() => setConfirmDelete(false), 3000);
      return;
    }
    deleteUser.mutate(member.id);
    setConfirmDelete(false);
  };

  const busy = updateRole.isPending || removeMember.isPending || toggleStatus.isPending || deleteUser.isPending;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          disabled={busy}
          className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground data-[state=open]:bg-muted"
        >
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MoreHorizontal className="h-3.5 w-3.5" />}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        {/* Role toggle — only available when member is active */}
        {member.is_active && (
          <DropdownMenuItem onClick={handleRoleChange} className="cursor-pointer gap-2">
            <Shield className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Change to <span className="font-semibold">{otherLabel}</span></span>
          </DropdownMenuItem>
        )}

        {/* Disable / Enable */}
        <DropdownMenuItem
          onClick={handleToggleStatus}
          className={`cursor-pointer gap-2 ${
            member.is_active
              ? "text-amber-600 focus:text-amber-700 focus:bg-amber-50"
              : "text-green-600 focus:text-green-700 focus:bg-green-50"
          }`}
        >
          {member.is_active ? (
            <><UserMinus className="h-3.5 w-3.5" /><span>Disable access</span></>
          ) : (
            <><UserPlus className="h-3.5 w-3.5" /><span>Re-enable access</span></>
          )}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Remove from org — two-tap confirm */}
        <DropdownMenuItem
          onClick={handleRemove}
          className={`cursor-pointer gap-2 focus:bg-destructive/10 ${
            confirmRemove ? "text-destructive focus:text-destructive" : "text-muted-foreground"
          }`}
        >
          <UserX className="h-3.5 w-3.5" />
          <span>{confirmRemove ? "Tap again to confirm" : "Remove from org"}</span>
        </DropdownMenuItem>

        {/* Delete user account — two-tap confirm */}
        <DropdownMenuItem
          onClick={handleDeleteUser}
          className={`cursor-pointer gap-2 focus:bg-destructive/10 ${
            confirmDelete ? "text-destructive focus:text-destructive font-semibold" : "text-destructive/70"
          }`}
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span>{confirmDelete ? "Tap again — cannot undo" : "Delete user account"}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ── main page ─────────────────────────────────────────────────────────────────

export default function TeamPage() {
  const { inviteOpen, setInviteOpen } = useDashboardShell();
  const { user } = useAuth();
  const [teamQuery, setTeamQuery] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("analyst");

  // ── Bulk import state ──────────────────────────────────────────────────────
  const [importOpen, setImportOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importResults, setImportResults] = useState<BulkImportResult | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading, isError } = useTeamMembers();
  const { data: sessionData } = useQuery({
    queryKey: ["org-sessions"],
    queryFn: getActiveSessions,
    refetchInterval: 30_000, // refresh every 30s
  });
  const inviteMutation = useInviteMember();

  const members = data?.members ?? [];

  // Derive the current user's role in this org
  const currentUserRole = useMemo(() => {
    if (!user || !members.length) return null;
    return members.find((m) => m.user_id === user.id)?.role ?? null;
  }, [user, members]);

  const isOwner = currentUserRole === "owner";

  const filteredMembers = useMemo(
    () =>
      members.filter(
        (m) =>
          (m.user?.display_name ?? "")
            .toLowerCase()
            .includes(teamQuery.toLowerCase()) ||
          (m.user?.email ?? "")
            .toLowerCase()
            .includes(teamQuery.toLowerCase()),
      ),
    [members, teamQuery],
  );

  const totalCount = members.length;
  const ownerApproverCount = members.filter(
    (m) => m.role === "owner" || m.role === "approver",
  ).length;
  const analystCount = members.filter((m) => m.role === "analyst").length;

  // Build columns — conditionally add Actions for owners
  const columns = useMemo<TableColumn<TeamMember>[]>(() => {
    const base: TableColumn<TeamMember>[] = [
      {
        id: "member",
        header: "Member",
        cell: (member) => (
          <div className="flex items-center gap-3">
            {member.user?.avatar_url ? (
              <img
                src={member.user.avatar_url}
                alt=""
                className={`h-8 w-8 rounded-full object-cover${!member.is_active ? " opacity-40 grayscale" : ""}`}
              />
            ) : (
              <span className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground${!member.is_active ? " opacity-40" : ""}`}>
                {getInitials(member.user?.display_name ?? null)}
              </span>
            )}
            <div>
              <p className={`font-medium ${member.is_active ? "text-foreground" : "text-muted-foreground"}`}>
                {member.user?.display_name ?? (member.is_pending ? "Invited" : "Unknown")}{" "}
                {member.role === "owner" ? "👑" : ""}
                {member.user_id === user?.id ? (
                  <span className="ml-1.5 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                    You
                  </span>
                ) : null}
                {member.is_pending ? (
                  <span className="ml-1.5 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                    Pending Invite
                  </span>
                ) : !member.is_active ? (
                  <span className="ml-1.5 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                    Disabled
                  </span>
                ) : null}
              </p>
              <p className="text-xs text-muted-foreground">
                {member.user?.email ?? "—"}
              </p>
            </div>
          </div>
        ),
      },
      {
        id: "role",
        header: "Role",
        cell: (member) => <RoleChip role={member.role} />,
      },
      {
        id: "joinedAt",
        header: "Joined",
        cell: (member) => (
          <span className="text-muted-foreground">
            {member.joined_at
              ? new Date(member.joined_at).toLocaleDateString("en-NG", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              : "—"}
          </span>
        ),
      },
      {
        id: "createdAt",
        header: "Added",
        cell: (member) => (
          <span className="text-muted-foreground">
            {new Date(member.created_at).toLocaleDateString("en-NG", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        ),
      },
    ];

    if (isOwner) {
      base.push({
        id: "actions",
        header: "",
        cell: (member) => (
          <div className="flex justify-end">
            {member.is_pending ? (
              <PendingInviteActions member={member} />
            ) : (
              <MemberActions member={member} currentUserId={user?.id ?? ""} />
            )}
          </div>
        ),
      });
    }

    return base;
  }, [isOwner, user?.id]);

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.name.endsWith(".csv")) {
      setImportFile(file);
      setImportResults(null);
    } else {
      toast.error("Please drop a .csv file.");
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImportFile(file);
      setImportResults(null);
    }
    e.target.value = "";
  };

  const handleImport = async () => {
    if (!importFile) return;
    setImportLoading(true);
    try {
      const result = await importTeamMembers(importFile);
      setImportResults(result);
      const { added, invited, skipped, failed } = result.summary;
      if (failed === 0) {
        toast.success(`Import done — ${added} added, ${invited} invited, ${skipped} skipped.`);
      } else {
        toast.warning(`Import finished with ${failed} error(s).`);
      }
    } catch {
      toast.error("Import failed. Please check the file and try again.");
    } finally {
      setImportLoading(false);
    }
  };

  const handleCloseImport = () => {
    setImportOpen(false);
    setImportFile(null);
    setImportResults(null);
    setDragOver(false);
  };

  const handleInvite = () => {
    if (!inviteEmail.trim()) return;
    inviteMutation.mutate(
      { email: inviteEmail.trim(), role: inviteRole },
      {
        onSuccess: () => {
          setInviteEmail("");
          setInviteRole("analyst");
          setInviteOpen(false);
        },
      },
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title="Team Members"
          description="Manage who has access to your FlowPilot workspace and control what they can do."
        />
        {isOwner && (
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              onClick={() => setImportOpen(true)}
              className="h-10 rounded-full border-border px-4 font-semibold text-foreground hover:bg-muted"
            >
              <Upload className="mr-1.5 h-4 w-4" />
              Import CSV
            </Button>
            <Button
              onClick={() => setInviteOpen(true)}
              className="h-10 rounded-full bg-primary px-5 text-primary-foreground font-semibold shadow-sm hover:opacity-90"
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Invite Member
            </Button>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-blue-200 bg-blue-50/50 px-5 py-4 text-sm text-blue-900 shadow-sm">
        <p className="font-semibold mb-1">Role Permissions</p>
        FlowPilot has two roles.{" "}
        <span className="font-bold">Analysts</span> can view runs, transactions,
        and reports but cannot approve payouts or start runs.{" "}
        <span className="font-bold">Approvers</span> have full access including
        creating runs and approving disbursements.
      </div>

      {/* Metric cards */}
      <div className="grid gap-4 sm:grid-cols-4">
        <MetricCard
          label="Total Members"
          value={isLoading ? "…" : String(totalCount)}
          subtext="In your workspace"
          icon={<Users className="h-4 w-4" />}
          accent="brand"
        />
        <MetricCard
          label="Online Now"
          value={sessionData ? String(sessionData.active_count) : "…"}
          subtext="Active in last 15 min"
          icon={
            <span className="relative flex h-4 w-4 items-center justify-center">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-50" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500" />
            </span>
          }
          accent="green"
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

      {/* Table */}
      <div>
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
                <p className="text-base font-black text-foreground">
                  No team members found
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {teamQuery
                    ? "No matches for your search query."
                    : "You haven't invited any team members yet."}
                </p>
                {!teamQuery && isOwner && (
                  <Button
                    onClick={() => setInviteOpen(true)}
                    variant="outline"
                    className="mt-4 rounded-full border-brand/30 text-brand hover:bg-brand/5 hover:border-brand"
                  >
                    <Plus className="mr-1.5 h-4 w-4" />
                    Invite your first member
                  </Button>
                )}
              </div>
            }
          />
        )}
      </div>

      {/* ── Bulk Import Modal ────────────────────────────────────────────────── */}
      {importOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-2xl bg-card shadow-2xl border border-border animate-in zoom-in-95 duration-200 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-border">
              <div>
                <h3 className="text-xl font-bold tracking-tight text-foreground">Import Team Members</h3>
                <p className="text-sm text-muted-foreground mt-0.5">Upload a CSV to add or invite multiple people at once.</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full text-muted-foreground shrink-0"
                onClick={handleCloseImport}
              >
                ×
              </Button>
            </div>

            <div className="px-6 py-5 space-y-5">
              {/* Template download */}
              <div className="flex items-center justify-between rounded-xl border border-border bg-muted/40 px-4 py-3">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">CSV Template</p>
                    <p className="text-xs text-muted-foreground">email, role, first_name, last_name</p>
                  </div>
                </div>
                <a
                  href={getTeamImportTemplateUrl()}
                  download="team_import_template.csv"
                  className="flex items-center gap-1.5 rounded-full border border-brand/30 bg-brand/5 px-3 py-1.5 text-xs font-semibold text-brand transition-all hover:bg-brand/10"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download
                </a>
              </div>

              {/* Drop zone */}
              {!importResults && (
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleFileDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed py-10 transition-all ${
                    dragOver
                      ? "border-brand bg-brand/5"
                      : importFile
                      ? "border-brand/50 bg-brand/5"
                      : "border-border bg-muted/20 hover:border-brand/40 hover:bg-muted/40"
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    className="sr-only"
                    onChange={handleFileSelect}
                  />
                  <Upload className={`h-8 w-8 ${importFile ? "text-brand" : "text-muted-foreground"}`} />
                  {importFile ? (
                    <div className="text-center">
                      <p className="text-sm font-semibold text-foreground">{importFile.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">{(importFile.size / 1024).toFixed(1)} KB · Click to change</p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <p className="text-sm font-semibold text-foreground">Drop your CSV here</p>
                      <p className="text-xs text-muted-foreground mt-1">or click to browse files</p>
                    </div>
                  )}
                </div>
              )}

              {/* Results */}
              {importResults && (
                <div className="space-y-3">
                  {/* Summary bar */}
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { label: "Added", value: importResults.summary.added, color: "text-green-600 bg-green-50 border-green-200" },
                      { label: "Invited", value: importResults.summary.invited, color: "text-blue-600 bg-blue-50 border-blue-200" },
                      { label: "Skipped", value: importResults.summary.skipped, color: "text-amber-600 bg-amber-50 border-amber-200" },
                      { label: "Failed", value: importResults.summary.failed, color: "text-destructive bg-destructive/5 border-destructive/20" },
                    ].map(({ label, value, color }) => (
                      <div key={label} className={`rounded-xl border px-3 py-2 text-center ${color}`}>
                        <p className="text-lg font-bold">{value}</p>
                        <p className="text-[10px] font-semibold uppercase tracking-wide">{label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Per-row results */}
                  <div className="max-h-52 overflow-y-auto rounded-xl border border-border">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 bg-muted/80 backdrop-blur-sm">
                        <tr>
                          <th className="px-3 py-2 text-left text-[10px] font-black uppercase tracking-wider text-muted-foreground">#</th>
                          <th className="px-3 py-2 text-left text-[10px] font-black uppercase tracking-wider text-muted-foreground">Email</th>
                          <th className="px-3 py-2 text-left text-[10px] font-black uppercase tracking-wider text-muted-foreground">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {importResults.results.map((row) => (
                          <tr key={row.line} className="hover:bg-muted/30">
                            <td className="px-3 py-2 text-xs text-muted-foreground">{row.line}</td>
                            <td className="px-3 py-2 font-medium text-foreground max-w-[180px] truncate">{row.email}</td>
                            <td className="px-3 py-2">
                              <div className="flex items-center gap-1.5">
                                {row.status === "added" && <CheckCircle2 className="h-3.5 w-3.5 text-green-600 shrink-0" />}
                                {row.status === "invited" && <CheckCircle2 className="h-3.5 w-3.5 text-blue-600 shrink-0" />}
                                {row.status === "skipped" && <AlertCircle className="h-3.5 w-3.5 text-amber-500 shrink-0" />}
                                {row.status === "error" && <XCircle className="h-3.5 w-3.5 text-destructive shrink-0" />}
                                <span className={`text-xs font-medium capitalize ${
                                  row.status === "added" ? "text-green-600"
                                  : row.status === "invited" ? "text-blue-600"
                                  : row.status === "skipped" ? "text-amber-600"
                                  : "text-destructive"
                                }`}>
                                  {row.status}
                                </span>
                                {row.reason && (
                                  <span className="text-xs text-muted-foreground">· {row.reason}</span>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 border-t border-border px-6 py-4">
              <Button variant="ghost" className="rounded-full px-6" onClick={handleCloseImport}>
                {importResults ? "Close" : "Cancel"}
              </Button>
              {!importResults && (
                <Button
                  className="rounded-full bg-brand px-6 text-white hover:opacity-90 shadow-sm"
                  disabled={!importFile || importLoading}
                  onClick={handleImport}
                >
                  {importLoading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Importing…</>
                  ) : (
                    <><Upload className="mr-2 h-4 w-4" />Import</>
                  )}
                </Button>
              )}
              {importResults && (
                <Button
                  variant="outline"
                  className="rounded-full px-6"
                  onClick={() => { setImportFile(null); setImportResults(null); }}
                >
                  Import Another
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Invite Modal ─────────────────────────────────────────────────────── */}
      {inviteOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-200 border border-border">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xl font-bold tracking-tight text-foreground">
                Invite a Team Member
              </h3>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full text-muted-foreground"
                onClick={() => setInviteOpen(false)}
              >
                ×
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mb-6">
              They&apos;ll get an email to join your FlowPilot workspace. If
              they don&apos;t have an account yet, we&apos;ll send them a
              sign-up link.
            </p>

            <div className="space-y-4">
              <Input
                type="email"
                placeholder="Email address"
                className="h-11 rounded-xl"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleInvite()}
              />

              <div>
                <p className="text-sm font-semibold mb-3 text-foreground">
                  Select Role
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {(["analyst", "approver"] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setInviteRole(r)}
                      className={`rounded-xl border p-4 text-left transition-all ${
                        inviteRole === r
                          ? "border-2 border-brand bg-brand/5"
                          : "border-border hover:border-brand/50 hover:bg-muted/50"
                      }`}
                    >
                      <p
                        className={`font-bold text-sm mb-1 capitalize ${
                          inviteRole === r ? "text-brand" : "text-foreground"
                        }`}
                      >
                        {r}
                      </p>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {r === "analyst"
                          ? "Can view runs, transactions, reports, and forecasts."
                          : "Can create runs and approve payouts."}
                      </p>
                    </button>
                  ))}
                </div>
                <p className="mt-3 text-xs text-muted-foreground leading-relaxed">
                  You can change a member&apos;s role at any time from this
                  page.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 mt-2 border-t border-border/50">
                <Button
                  variant="ghost"
                  className="rounded-full px-6"
                  onClick={() => setInviteOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="rounded-full bg-brand px-6 text-white hover:opacity-90 shadow-sm"
                  onClick={handleInvite}
                  disabled={inviteMutation.isPending || !inviteEmail.trim()}
                  loading={inviteMutation.isPending}
                >
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
