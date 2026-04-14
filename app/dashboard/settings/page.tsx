"use client";

import { useRef, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { getUserRole } from "@/lib/api-types";
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Copy,
  KeyRound,
  Loader2,
  LogOut,
  RefreshCw,
  ShieldCheck,
  ShieldOff,
  Trash2,
  User,
  Building2,
  Lock,
  AlertOctagon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/status-badge";
import { PageHeader } from "@/components/ui/page-header";
import { OtpInput } from "@/components/ui/form-fields";
import {
  useOrgProfile,
  useConnections,
  useUpdateProfile,
  useUploadAvatar,
  useRemoveAvatar,
  useChangePassword,
  useUpdateOrgProfile,
  useExportAccountData,
  useDeleteAccount,
} from "@/hooks/use-settings-queries";
import {
  use2FAStatus,
  use2FASetup,
  use2FAEnable,
  use2FADisable,
  useRegenerateBackupCodes,
  useSetOrgRequire2FA,
} from "@/hooks/use-2fa-queries";
import { ApprovalRulesSection } from "@/components/settings/ApprovalRulesSection";
import { cn } from "@/lib/utils";

type Tab = "profile" | "workspace" | "security" | "account";

export default function SettingsPage() {
  const { user, logout, refreshUser } = useAuth();
  const isOwner = getUserRole(user) === "owner";

  const [activeTab, setActiveTab] = useState<Tab>("profile");

  const orgQuery = useOrgProfile();
  const connectionsQuery = useConnections();
  const updateProfile = useUpdateProfile();
  const uploadAvatarMut = useUploadAvatar();
  const removeAvatarMut = useRemoveAvatar();
  const changePasswordMut = useChangePassword();
  const updateOrg = useUpdateOrgProfile();
  const exportData = useExportAccountData();
  const deleteAccount = useDeleteAccount(() => logout());
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 2FA hooks
  const twoFAStatus = use2FAStatus();
  const twoFASetup = use2FASetup();
  const twoFAEnable = use2FAEnable();
  const twoFADisable = use2FADisable();
  const regenBackup = useRegenerateBackupCodes();
  const orgRequire2FA = useSetOrgRequire2FA();

  // 2FA UI state
  type TwoFAStep = "idle" | "scanning" | "confirming" | "backup-shown" | "disabling";
  const [twoFAStep, setTwoFAStep] = useState<TwoFAStep>("idle");
  const [twoFASetupData, setTwoFASetupData] = useState<{ secret: string; qr_code: string } | null>(null);
  const [twoFACode, setTwoFACode] = useState("");
  const [disablePw, setDisablePw] = useState("");
  const [disableCode, setDisableCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [backupCopied, setBackupCopied] = useState(false);
  const [showOrgEnforce, setShowOrgEnforce] = useState(false);

  const handleStartSetup = async () => {
    const data = await twoFASetup.mutateAsync();
    setTwoFASetupData(data);
    setTwoFACode("");
    setTwoFAStep("scanning");
  };

  const handleEnable2FA = async () => {
    const result = await twoFAEnable.mutateAsync(twoFACode);
    setBackupCodes(result.backup_codes);
    setTwoFAStep("backup-shown");
    setTwoFACode("");
  };

  const handleDisable2FA = async () => {
    await twoFADisable.mutateAsync({ password: disablePw, code: disableCode });
    setTwoFAStep("idle");
    setDisablePw("");
    setDisableCode("");
  };

  const handleRegenBackup = async () => {
    const result = await regenBackup.mutateAsync();
    setBackupCodes(result.backup_codes);
    setTwoFAStep("backup-shown");
  };

  const copyBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join("\n"));
    setBackupCopied(true);
    setTimeout(() => setBackupCopied(false), 2000);
  };

  const is2FAEnabled = twoFAStatus.data?.totp_enabled ?? false;

  // Delete account confirmation modal state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  // Profile form state
  const [firstName, setFirstName] = useState(user?.first_name ?? "");
  const [lastName, setLastName] = useState(user?.last_name ?? "");
  const [jobTitle, setJobTitle] = useState(user?.job_title ?? "");
  const [department, setDepartment] = useState(user?.department ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [tz, setTz] = useState(user?.timezone ?? "Africa/Lagos");

  // Password form state
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");

  // Org edit state
  const [orgEditing, setOrgEditing] = useState(false);
  const [orgForm, setOrgForm] = useState<Record<string, string>>({});

  const org = orgQuery.data;
  const connections = connectionsQuery.data?.connections ?? [];

  const initials = [user?.first_name?.[0], user?.last_name?.[0]]
    .filter(Boolean)
    .join("")
    .toUpperCase() || user?.display_name?.slice(0, 2).toUpperCase() || "??";

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadAvatarMut.mutate(file, { onSuccess: () => refreshUser() });
    }
  };

  const handleProfileSave = () => {
    updateProfile.mutate(
      {
        first_name: firstName || undefined,
        last_name: lastName || undefined,
        job_title: jobTitle || undefined,
        department: department || undefined,
        phone: phone || undefined,
        timezone: tz || undefined,
      } as any,
      { onSuccess: () => refreshUser() }
    );
  };

  const handlePasswordChange = () => {
    if (newPw !== confirmPw) return;
    changePasswordMut.mutate(
      { current: currentPw, next: newPw },
      {
        onSuccess: () => {
          setCurrentPw("");
          setNewPw("");
          setConfirmPw("");
        },
      }
    );
  };

  const handleOrgSave = () => {
    updateOrg.mutate(orgForm, { onSuccess: () => setOrgEditing(false) });
  };

  // Tab definitions
  const allTabs: { id: Tab; label: string; icon: React.ReactNode; ownerOnly?: boolean }[] = [
    { id: "profile",   label: "Profile",   icon: <User className="h-4 w-4" /> },
    { id: "workspace", label: "Workspace",  icon: <Building2 className="h-4 w-4" /> },
    { id: "security",  label: "Security",   icon: <Lock className="h-4 w-4" /> },
    { id: "account",   label: "Account",    icon: <AlertOctagon className="h-4 w-4" /> },
  ];
  const tabs = allTabs.filter((t) => !t.ownerOnly || isOwner);

  return (
    <div className="mx-auto max-w-4xl pb-16">
      <PageHeader title="Settings" description="Manage your profile, workspace, and developer access." />

      {/* ── Tab Navigation ── */}
      <div className="mt-6 flex overflow-x-auto border-b border-border gap-1 pb-px scrollbar-none">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-t-lg px-4 py-2.5 text-sm font-semibold transition-all",
              activeTab === tab.id
                ? "border-b-2 border-brand text-brand"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab Content ── */}
      <div className="mt-8 space-y-8">

        {/* ════════════════ PROFILE ════════════════ */}
        {activeTab === "profile" && (
          <>
            <Section title="Profile Photo" description="Update your avatar.">
              <div className="flex items-center gap-6">
                <span className="relative inline-flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-muted text-2xl font-bold text-muted-foreground shadow-sm overflow-hidden">
                  {user?.avatar_url ? (
                    <img src={user.avatar_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    initials
                  )}
                  <span
                    className="absolute bottom-0 right-0 inline-flex h-8 w-8 cursor-pointer flex-col items-center justify-center rounded-full bg-brand p-1.5 text-white shadow-md transition-transform hover:scale-105"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Camera className="h-4 w-4" />
                  </span>
                </span>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                <div className="space-y-1.5">
                  <p className="text-sm text-muted-foreground">
                    Upload a square image, minimum 200×200px. JPG or PNG only.
                  </p>
                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    <Button variant="outline" className="rounded-full shadow-sm" onClick={() => fileInputRef.current?.click()} disabled={uploadAvatarMut.isPending}>
                      {uploadAvatarMut.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Upload New Photo
                    </Button>
                    <Button variant="ghost" className="rounded-full text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => removeAvatarMut.mutate(undefined, { onSuccess: () => refreshUser() })} disabled={removeAvatarMut.isPending}>
                      Remove
                    </Button>
                  </div>
                </div>
              </div>
            </Section>

            <Section title="Personal Information" description="Review or update your identity details.">
              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">First Name</label>
                  <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} className="h-10 rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Last Name</label>
                  <Input value={lastName} onChange={(e) => setLastName(e.target.value)} className="h-10 rounded-xl" />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-medium text-muted-foreground">Email Address</label>
                  <div className="relative">
                    <Input defaultValue={user?.email ?? ""} disabled className="h-10 rounded-xl pr-28" />
                    <span className="absolute right-2 top-1/2 -translate-y-1/2">
                      <StatusBadge status="verified" label="Verified" />
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Job Title</label>
                  <Input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} className="h-10 rounded-xl" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Department</label>
                  <Input value={department} onChange={(e) => setDepartment(e.target.value)} className="h-10 rounded-xl" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Phone</label>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="h-10 rounded-xl" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Timezone</label>
                  <select value={tz} onChange={(e) => setTz(e.target.value)} className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-brand">
                    <option value="Africa/Lagos">Africa/Lagos (WAT, UTC+1)</option>
                    <option value="Africa/Accra">Africa/Accra (GMT, UTC+0)</option>
                    <option value="Europe/London">Europe/London (GMT/BST)</option>
                    <option value="America/New_York">America/New York (EST/EDT)</option>
                  </select>
                </div>
              </div>
              <div className="mt-5 flex justify-end">
                <Button className="rounded-full bg-brand px-6 text-white shadow-sm hover:opacity-90" onClick={handleProfileSave} disabled={updateProfile.isPending}>
                  {updateProfile.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Save Changes
                </Button>
              </div>
            </Section>
          </>
        )}

        {/* ════════════════ WORKSPACE ════════════════ */}
        {activeTab === "workspace" && (
          <>
            <Section title="Business Information" description="Official company details and registration.">
              {orgQuery.isLoading ? (
                <div className="py-8 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" /></div>
              ) : orgEditing ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {["business_name", "business_type", "rc_number", "tax_id", "city", "state", "country", "phone"].map((field) => (
                    <div key={field} className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground capitalize">{field.replace(/_/g, " ")}</label>
                      <Input className="h-10 rounded-xl" defaultValue={(org as any)?.[field] ?? ""} onChange={(e) => setOrgForm((prev) => ({ ...prev, [field]: e.target.value }))} />
                    </div>
                  ))}
                  <div className="md:col-span-2 mt-2 flex gap-3 justify-end">
                    <Button variant="ghost" className="rounded-full" onClick={() => setOrgEditing(false)}>Cancel</Button>
                    <Button className="rounded-full bg-brand text-white" onClick={handleOrgSave} disabled={updateOrg.isPending}>
                      {updateOrg.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Save
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid gap-4 md:grid-cols-2">
                    {[
                      ["Business Name", org?.business_name],
                      ["Business Type", org?.business_type],
                      ["RC Number", org?.rc_number],
                      ["Tax ID", org?.tax_id],
                      ["City", org?.city],
                      ["State", org?.state],
                      ["Country", org?.country],
                      ["Phone", org?.phone],
                    ].map(([label, value]) => (
                      <div key={label as string} className="rounded-xl border border-border/50 bg-muted/20 px-4 py-3 text-sm shadow-sm">
                        <span className="text-xs font-medium text-muted-foreground">{label}</span>
                        <p className="mt-0.5 font-semibold text-foreground">{(value as string) || "—"}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-5">
                    <Button variant="outline" className="rounded-full shadow-sm" onClick={() => setOrgEditing(true)}>
                      Edit Business Information
                    </Button>
                  </div>
                </>
              )}
            </Section>

            <Section title="Connected Accounts" description="Manage single sign-on and external integrations.">
              <div className="space-y-3">
                {connectionsQuery.isLoading ? (
                  <div className="py-8 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" /></div>
                ) : (
                  connections.map((conn) => (
                    <div key={conn.provider} className="flex items-center justify-between rounded-xl border border-border/60 bg-card p-4 shadow-sm transition-all hover:border-brand/30">
                      <div>
                        <p className="font-semibold text-foreground capitalize">{conn.provider}</p>
                        <p className="mt-0.5 text-sm text-muted-foreground">{conn.connected ? conn.email : "Not connected"}</p>
                      </div>
                      <StatusBadge status={conn.connected ? "active" : "pending"} label={conn.connected ? "Connected" : "Not connected"} />
                    </div>
                  ))
                )}
              </div>
            </Section>

            {isOwner && (
              <Section title="Approval Workflow" description="Define multi-approver rules for high-value or high-risk runs.">
                <ApprovalRulesSection />
              </Section>
            )}
          </>
        )}

        {/* ════════════════ SECURITY ════════════════ */}
        {activeTab === "security" && (
          <Section title="Security & Authentication" description="Manage your password and two-factor authentication.">
            <div className="space-y-8">
              {/* ── Change Password ── */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-foreground">Change Password</h3>
                <div className="grid gap-3 sm:max-w-md">
                  <Input type="password" placeholder="Current Password" className="h-10 rounded-xl" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} />
                  <Input type="password" placeholder="New Password" className="h-10 rounded-xl" value={newPw} onChange={(e) => setNewPw(e.target.value)} />
                  <Input type="password" placeholder="Confirm New Password" className="h-10 rounded-xl" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} />
                  {newPw && confirmPw && newPw !== confirmPw && (
                    <p className="text-xs text-destructive">Passwords do not match</p>
                  )}
                  <div>
                    <Button className="mt-2 rounded-full px-6 shadow-sm" onClick={handlePasswordChange} disabled={changePasswordMut.isPending || !currentPw || !newPw || newPw !== confirmPw}>
                      {changePasswordMut.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Update Password
                    </Button>
                  </div>
                </div>
              </div>

              {/* ── Two-Factor Authentication ── */}
              <div className="space-y-4 border-t border-border/50 pt-6">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-foreground">Two-Factor Authentication (2FA)</h3>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      Add an extra layer of security by requiring a one-time code at login.
                    </p>
                  </div>
                  <div className="shrink-0">
                    {twoFAStatus.isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    ) : (
                      <StatusBadge status={is2FAEnabled ? "active" : "pending"} label={is2FAEnabled ? "Enabled" : "Disabled"} />
                    )}
                  </div>
                </div>

                {!is2FAEnabled && twoFAStep === "idle" && (
                  <Button variant="outline" className="rounded-full shadow-sm" onClick={handleStartSetup} disabled={twoFASetup.isPending}>
                    {twoFASetup.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                    Enable 2FA
                  </Button>
                )}

                {twoFAStep === "scanning" && twoFASetupData && (
                  <div className="space-y-5 rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
                    <p className="text-sm font-semibold text-foreground">Step 1 — Scan the QR code with your authenticator app</p>
                    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
                      <img src={`data:image/png;base64,${twoFASetupData.qr_code}`} alt="2FA QR Code" className="h-40 w-40 rounded-xl border border-border/60 shadow-sm" />
                      <div className="min-w-0 flex-1 space-y-2">
                        <p className="text-xs text-muted-foreground">Can&apos;t scan? Enter this key manually in your app:</p>
                        <code className="block break-all rounded-lg bg-muted px-3 py-2 font-mono text-xs text-foreground">{twoFASetupData.secret}</code>
                        <p className="text-xs text-muted-foreground">Works with Google Authenticator, Authy, 1Password, and any TOTP app.</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-foreground">Step 2 — Enter the 6-digit code from your app to confirm</p>
                      <OtpInput length={6} value={twoFACode} onChange={setTwoFACode} />
                    </div>
                    <div className="flex gap-3">
                      <Button className="rounded-full bg-brand px-6 text-white shadow-sm hover:opacity-90" onClick={handleEnable2FA} disabled={twoFAEnable.isPending || twoFACode.length < 6}>
                        {twoFAEnable.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Confirm & Enable
                      </Button>
                      <Button variant="ghost" className="rounded-full" onClick={() => { setTwoFAStep("idle"); setTwoFASetupData(null); setTwoFACode(""); }}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                {twoFAStep === "backup-shown" && (
                  <div className="space-y-4 rounded-2xl border border-brand/20 bg-brand/5 p-5 shadow-sm">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
                      <div>
                        <p className="font-semibold text-foreground">2FA is now enabled!</p>
                        <p className="mt-0.5 text-sm text-muted-foreground">Save these backup codes somewhere safe. Each can only be used once.</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {backupCodes.map((c) => (
                        <code key={c} className="rounded-lg border border-border/60 bg-background px-3 py-2 text-center font-mono text-xs font-semibold tracking-wider text-foreground">{c}</code>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <Button variant="outline" className="rounded-full shadow-sm" onClick={copyBackupCodes}>
                        {backupCopied ? <><CheckCircle2 className="mr-2 h-4 w-4 text-brand" />Copied!</> : <><Copy className="mr-2 h-4 w-4" />Copy All</>}
                      </Button>
                      <Button className="rounded-full bg-brand px-6 text-white shadow-sm hover:opacity-90" onClick={() => setTwoFAStep("idle")}>Done</Button>
                    </div>
                  </div>
                )}

                {is2FAEnabled && twoFAStep === "idle" && (
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <Button variant="outline" className="rounded-full shadow-sm" onClick={handleRegenBackup} disabled={regenBackup.isPending}>
                        {regenBackup.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                        Regenerate Backup Codes
                      </Button>
                      <Button variant="outline" className="rounded-full border-destructive/30 text-destructive shadow-sm hover:bg-destructive/10" onClick={() => { setTwoFAStep("disabling"); setDisablePw(""); setDisableCode(""); }}>
                        <ShieldOff className="mr-2 h-4 w-4" />Disable 2FA
                      </Button>
                    </div>
                    {twoFAStatus.data && (
                      <p className="text-xs text-muted-foreground">{twoFAStatus.data.backup_codes_remaining} backup code{twoFAStatus.data.backup_codes_remaining !== 1 ? "s" : ""} remaining</p>
                    )}
                  </div>
                )}

                {twoFAStep === "disabling" && (
                  <div className="space-y-4 rounded-2xl border border-destructive/20 bg-destructive/5 p-5 shadow-sm">
                    <div className="flex items-center gap-2">
                      <KeyRound className="h-4 w-4 text-destructive" />
                      <p className="text-sm font-semibold text-foreground">Confirm your identity to disable 2FA</p>
                    </div>
                    <div className="grid gap-3 sm:max-w-sm">
                      <Input type="password" placeholder="Your account password" className="h-10 rounded-xl" value={disablePw} onChange={(e) => setDisablePw(e.target.value)} />
                      <div className="space-y-1.5">
                        <p className="text-xs text-muted-foreground">Current authenticator code</p>
                        <OtpInput length={6} value={disableCode} onChange={setDisableCode} />
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Button variant="destructive" className="rounded-full shadow-sm" onClick={handleDisable2FA} disabled={twoFADisable.isPending || !disablePw || disableCode.length < 6}>
                        {twoFADisable.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Disable 2FA
                      </Button>
                      <Button variant="ghost" className="rounded-full" onClick={() => setTwoFAStep("idle")}>Cancel</Button>
                    </div>
                  </div>
                )}

                {isOwner && (
                  <div className="border-t border-border/50 pt-4 space-y-3">
                    <button type="button" className="flex w-full items-center justify-between text-sm font-semibold text-foreground" onClick={() => setShowOrgEnforce((p) => !p)}>
                      <span>Organisation-wide 2FA Enforcement</span>
                      {showOrgEnforce ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                    </button>
                    {showOrgEnforce && (
                      <div className="rounded-2xl border border-border/60 bg-card p-4 space-y-3 shadow-sm">
                        <p className="text-sm text-muted-foreground">
                          Require all team members to enable 2FA. Members without 2FA will have a 24-hour grace period before access is restricted.
                        </p>
                        <div className="flex gap-3">
                          <Button className="rounded-full bg-brand px-6 text-white shadow-sm hover:opacity-90" onClick={() => orgRequire2FA.mutate(true)} disabled={orgRequire2FA.isPending}>
                            {orgRequire2FA.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Enforce 2FA for Team
                          </Button>
                          <Button variant="outline" className="rounded-full shadow-sm" onClick={() => orgRequire2FA.mutate(false)} disabled={orgRequire2FA.isPending}>
                            Remove Enforcement
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </Section>
        )}

        {/* ════════════════ ACCOUNT ════════════════ */}
        {activeTab === "account" && (
          <Section title="Account" description="Data export, session management, and destructive actions." variant="danger">
            <div className="space-y-4">
              {isOwner && (
                <div className="flex flex-col justify-between gap-4 border-b border-destructive/20 pb-4 sm:flex-row sm:items-center">
                  <div>
                    <p className="font-bold text-foreground">Export All Data</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">Download your full workspace data (runs, transactions, team, audit logs) as JSON.</p>
                  </div>
                  <Button variant="outline" className="shrink-0 rounded-full" onClick={() => exportData.mutate()} disabled={exportData.isPending}>
                    {exportData.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Export Data
                  </Button>
                </div>
              )}

              <div className="flex flex-col justify-between gap-4 border-b border-destructive/20 pb-4 sm:flex-row sm:items-center">
                <div>
                  <p className="font-bold text-foreground">Sign Out</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">Sign out of your current session on this device.</p>
                </div>
                <Button variant="outline" className="shrink-0 rounded-full border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => logout()}>
                  <LogOut className="mr-2 h-4 w-4" /> Sign Out
                </Button>
              </div>

              {isOwner && (
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <div>
                    <p className="font-bold text-destructive">Delete Account</p>
                    <p className="mt-0.5 text-sm text-destructive/80">Permanently deactivates your account and entire workspace. This cannot be undone.</p>
                  </div>
                  <Button variant="destructive" className="shrink-0 rounded-full shadow-sm" onClick={() => { setDeleteOpen(true); setDeleteConfirmText(""); }}>
                    <Trash2 className="mr-2 h-4 w-4" /> Delete Account
                  </Button>
                </div>
              )}
            </div>
          </Section>
        )}
      </div>

      {/* ── Delete Account Confirmation Modal ── */}
      {deleteOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl bg-card shadow-2xl border border-border animate-in zoom-in-95 duration-200 overflow-hidden">
            <div className="px-6 py-5 border-b border-border">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 mb-3">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Delete Account &amp; Workspace</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                This will permanently deactivate your account, your business workspace, and remove dashboard access for all team members. This action <strong>cannot be undone</strong>.
              </p>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                <p className="font-semibold">What gets deleted:</p>
                <ul className="mt-1 list-disc pl-4 space-y-0.5 text-destructive/80">
                  <li>Your account and login access</li>
                  <li>Your business workspace</li>
                  <li>All team members lose access</li>
                </ul>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-foreground">
                  Type <span className="font-mono font-bold text-destructive">DELETE</span> to confirm
                </label>
                <Input value={deleteConfirmText} onChange={(e) => setDeleteConfirmText(e.target.value)} placeholder="DELETE" className="h-10 rounded-xl font-mono" autoComplete="off" />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-border px-6 py-4">
              <Button variant="ghost" className="rounded-full px-6" onClick={() => setDeleteOpen(false)} disabled={deleteAccount.isPending}>Cancel</Button>
              <Button variant="destructive" className="rounded-full px-6 shadow-sm" disabled={deleteConfirmText !== "DELETE" || deleteAccount.isPending} onClick={() => deleteAccount.mutate()}>
                {deleteAccount.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Deleting…</> : <><Trash2 className="mr-2 h-4 w-4" />Delete Everything</>}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Section({
  title,
  description,
  children,
  variant = "default",
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  variant?: "default" | "danger";
}) {
  return (
    <div className="space-y-5 py-6 md:rounded-3xl md:p-8">
      <div>
        <h2 className={`text-xl font-bold tracking-tight ${variant === "danger" ? "text-destructive" : "text-foreground"}`}>
          {title}
        </h2>
        {description && (
          <p className={`mt-1 text-sm ${variant === "danger" ? "text-destructive/80" : "text-muted-foreground"}`}>
            {description}
          </p>
        )}
      </div>
      <div>{children}</div>
    </div>
  );
}
