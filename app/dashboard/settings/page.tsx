"use client";

import { useRef, useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { getUserRole } from "@/lib/api-types";
import {
  AlertTriangle,
  Bell,
  Camera,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Copy,
  Download,
  FileUp,
  KeyRound,
  Loader2,
  LogOut,
  RefreshCw,
  Scale,
  Shield,
  ShieldCheck,
  ShieldOff,
  Trash2,
  Upload,
  User,
  Building2,
  Lock,
  AlertOctagon,
  Zap,
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
  useUpdateOrgConfig,
  useExportAccountData,
  useDeleteAccount,
  useDeleteSelfAccount,
  useImportAccountData,
  useRequestDeleteCode,
  useNotificationPreferences,
  useUpdateNotificationPreferences,
} from "@/hooks/use-settings-queries";
import { useUploadOrgLogo } from "@/hooks/use-kyc-queries";
import { CardSelect, PillSelect, type CardSelectOption } from "@/components/ui/select-fields";
import {
  use2FAStatus,
  use2FASetup,
  use2FAEnable,
  use2FADisable,
  useRegenerateBackupCodes,
  useSetOrgRequire2FA,
} from "@/hooks/use-2fa-queries";
import { ApprovalRulesSection } from "@/components/settings/ApprovalRulesSection";
import {
  useApprovalPinStatus,
  useSetupApprovalPin,
  useRemoveApprovalPin,
  useRequestPinReset,
  useConfirmPinReset,
} from "@/hooks/use-approval-pin";
import { cn } from "@/lib/utils";

type Tab = "profile" | "workspace" | "security" | "notifications" | "account";

export default function SettingsPage() {
  const { user, logout, refreshUser } = useAuth();
  const isOwner = getUserRole(user) === "owner";

  const [activeTab, setActiveTab] = useState<Tab>("profile");

  // Open the correct tab when navigated with ?tab=security etc.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("tab");
    if (t === "security" || t === "workspace" || t === "account" || t === "notifications") setActiveTab(t);
  }, []);

  const orgQuery = useOrgProfile();
  const connectionsQuery = useConnections();
  const updateProfile = useUpdateProfile();
  const uploadAvatarMut = useUploadAvatar();
  const removeAvatarMut = useRemoveAvatar();
  const changePasswordMut = useChangePassword();
  const updateOrg = useUpdateOrgProfile();
  const updateOrgConfigMut = useUpdateOrgConfig();
  const exportData = useExportAccountData();
  const deleteAccount = useDeleteAccount(() => logout());
  const deleteSelf = useDeleteSelfAccount(() => logout());
  const importData = useImportAccountData();
  const requestDeleteCode = useRequestDeleteCode();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importFileRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const uploadOrgLogoMut = useUploadOrgLogo();

  // Business configuration constants
  type RiskAppetite = "conservative" | "moderate" | "aggressive";
  const MONTHLY_VOLUMES = ["Below ₦1M", "₦1M–₦10M", "₦10M–₦50M", "₦50M–₦200M", "Above ₦200M"];
  const MONTHLY_PAYOUTS = ["Below 50", "50–200", "200–1000", "Above 1000"];
  const NIGERIAN_BANKS = ["Access Bank", "First Bank", "GTBank", "UBA", "Zenith Bank", "Stanbic IBTC", "Fidelity Bank", "Union Bank", "Polaris Bank", "Sterling Bank", "Wema Bank", "Other"];
  const USE_CASE_OPTIONS = ["Payroll Disbursement", "Vendor Payments", "Supplier Payments", "Contractor Payments", "Refunds and Reversals", "Inter-account Transfers"];
  const NIGERIAN_STATES = ["Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno", "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT - Abuja", "Gombe", "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba", "Yobe", "Zamfara"];
  const RISK_OPTIONS: CardSelectOption<RiskAppetite>[] = [
    { value: "conservative", title: "Conservative", description: "Strict risk controls. Only very low risk payouts auto-approved.", icon: <Shield className="h-5 w-5 text-brand" /> },
    { value: "moderate", title: "Moderate", description: "Balanced approach. Review borderline cases.", icon: <Scale className="h-5 w-5 text-brand" /> },
    { value: "aggressive", title: "Aggressive", description: "Speed-focused. Flag only high-risk payouts.", icon: <Zap className="h-5 w-5 text-brand" /> },
  ];

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

  // Approval PIN state
  const { data: pinStatusData } = useApprovalPinStatus();
  const hasPin = pinStatusData?.has_pin ?? false;
  const setupPin = useSetupApprovalPin();
  const removePin = useRemoveApprovalPin();
  const requestPinReset = useRequestPinReset();
  const confirmPinReset = useConfirmPinReset(() => setPinStep("idle"));
  const [pinStep, setPinStep] = useState<"idle" | "setup" | "removing" | "reset-requesting" | "reset-confirm">("idle");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [resetMethod, setResetMethod] = useState<"email" | "totp" | null>(null);
  const [resetCode, setResetCode] = useState("");
  const [resetNewPin, setResetNewPin] = useState("");
  const [resetConfirmPin, setResetConfirmPin] = useState("");

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
    await twoFADisable.mutateAsync(disablePw);
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

  const downloadBackupCodes = () => {
    const content = [
      "FlowPilot — 2FA Backup Codes",
      "Keep these codes somewhere safe. Each code can only be used once.",
      "",
      ...backupCodes,
    ].join("\n");
    const url = URL.createObjectURL(new Blob([content], { type: "text/plain" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "flowpilot-backup-codes.txt";
    a.click();
    URL.revokeObjectURL(url);
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

  // Populate profile fields when user data loads asynchronously
  useEffect(() => {
    if (user) {
      setFirstName((prev) => prev || (user.first_name ?? ""));
      setLastName((prev) => prev || (user.last_name ?? ""));      setJobTitle((prev) => prev || (user.job_title ?? ""));
      setDepartment((prev) => prev || (user.department ?? ""));
      setPhone((prev) => prev || (user.phone ?? ""));
      setTz(user.timezone ?? "Africa/Lagos");
    }
  }, [user]);

  // Password form state
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [changePwOtp, setChangePwOtp] = useState("");

  // Delete account verification state
  const [deleteOtp, setDeleteOtp] = useState("");
  const [deleteEmailCode, setDeleteEmailCode] = useState("");
  const [deleteCodeSent, setDeleteCodeSent] = useState(false);

  // Self-delete state (non-owners)
  const [selfDeleteOpen, setSelfDeleteOpen] = useState(false);
  const [selfDeleteConfirmText, setSelfDeleteConfirmText] = useState("");
  const [selfDeleteOtp, setSelfDeleteOtp] = useState("");
  const [selfDeleteEmailCode, setSelfDeleteEmailCode] = useState("");
  const [selfDeleteCodeSent, setSelfDeleteCodeSent] = useState(false);

  // Import state (owners)
  const [importOpen, setImportOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);

  // Org edit state
  const [orgEditing, setOrgEditing] = useState(false);
  const [orgForm, setOrgForm] = useState<Record<string, string>>({});

  // Business config edit state
  const [configEditing, setConfigEditing] = useState(false);
  const [configVolume, setConfigVolume] = useState("");
  const [configPayouts, setConfigPayouts] = useState("");
  const [configBank, setConfigBank] = useState("");
  const [configUseCases, setConfigUseCases] = useState<string[]>([]);
  const [configRisk, setConfigRisk] = useState<RiskAppetite | "">("");
  const [configMerchantId, setConfigMerchantId] = useState("");
  const [configMerchantState, setConfigMerchantState] = useState("");
  const [configDailyLimit, setConfigDailyLimit] = useState("");
  const [configSingleCap, setConfigSingleCap] = useState("");
  const [configRiskThreshold, setConfigRiskThreshold] = useState("");
  const [configLiquidityBuffer, setConfigLiquidityBuffer] = useState("");

  // Notification preferences
  const notifPrefsQuery = useNotificationPreferences();
  const updateNotifPrefs = useUpdateNotificationPreferences();
  const notifPrefs = notifPrefsQuery.data ?? {
    login_alerts: true,
    security_alerts: true,
    payout_updates: true,
    kyc_updates: true,
    api_key_warnings: true,
    wallet_alerts: true,
    scheduled_run_reminders: true,
  };

  const org = orgQuery.data;
  const isIndividual = org?.account_type === "individual";
  const connections = connectionsQuery.data?.connections ?? [];

  // org enforcement: use mutation result (most recent) or fall back to org profile data
  const isOrgEnforced: boolean = orgRequire2FA.data?.require_2fa ?? (org?.config?.require_2fa ?? false);

  const initials = [user?.first_name?.[0], user?.last_name?.[0]]
    .filter(Boolean)
    .join("")
    .toUpperCase() || user?.display_name?.slice(0, 2).toUpperCase() || "??";

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadAvatarMut.mutate(file);
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
      { current: currentPw, next: newPw, totpCode: is2FAEnabled ? changePwOtp : undefined },
      {
        onSuccess: () => {
          setCurrentPw("");
          setNewPw("");
          setConfirmPw("");
          setChangePwOtp("");
        },
      }
    );
  };

  const handleOrgSave = () => {
    updateOrg.mutate(orgForm, { onSuccess: () => setOrgEditing(false) });
  };

  const handleEditConfig = () => {
    setConfigVolume(org?.config?.monthly_txn_volume_range ?? "");
    setConfigPayouts(org?.config?.avg_monthly_payouts_range ?? "");
    setConfigBank(org?.config?.primary_bank ?? "");
    setConfigUseCases(org?.config?.primary_use_cases ?? []);
    setConfigRisk((org?.config?.risk_appetite as RiskAppetite | "") ?? "");
    setConfigMerchantId(org?.interswitch_merchant_id ?? "");
    setConfigMerchantState(org?.config?.merchant_state ?? "");
    setConfigDailyLimit(org?.config?.daily_payout_limit != null ? String(org.config.daily_payout_limit) : "");
    setConfigSingleCap(org?.config?.single_payout_cap != null ? String(org.config.single_payout_cap) : "");
    setConfigRiskThreshold(org?.config?.risk_alert_threshold != null ? String(org.config.risk_alert_threshold) : "");
    setConfigLiquidityBuffer(org?.config?.liquidity_alert_buffer != null ? String(org.config.liquidity_alert_buffer) : "");
    setConfigEditing(true);
  };

  const handleConfigSave = async () => {
    try {
      await Promise.all([
        updateOrgConfigMut.mutateAsync({
          monthly_txn_volume_range: configVolume || null,
          avg_monthly_payouts_range: configPayouts || null,
          primary_bank: configBank || null,
          primary_use_cases: configUseCases.length ? configUseCases : null,
          risk_appetite: configRisk || null,
          merchant_state: configMerchantState || null,
          daily_payout_limit: configDailyLimit ? parseFloat(configDailyLimit.replace(/,/g, "")) : null,
          single_payout_cap: configSingleCap ? parseFloat(configSingleCap.replace(/,/g, "")) : null,
          risk_alert_threshold: configRiskThreshold ? parseFloat(configRiskThreshold) : null,
          liquidity_alert_buffer: configLiquidityBuffer ? parseFloat(configLiquidityBuffer) : null,
        }),
        updateOrg.mutateAsync({ interswitch_merchant_id: configMerchantId || null }),
      ]);
      setConfigEditing(false);
    } catch {
      // errors handled by each hook's onError
    }
  };

  // Tab definitions
  const allTabs: { id: Tab; label: string; icon: React.ReactNode; ownerOnly?: boolean }[] = [
    { id: "profile",       label: "Profile",       icon: <User className="h-4 w-4" /> },
    { id: "workspace",     label: "Workspace",      icon: <Building2 className="h-4 w-4" /> },
    { id: "security",      label: "Security",       icon: <Lock className="h-4 w-4" /> },
    { id: "notifications", label: "Notifications",  icon: <Bell className="h-4 w-4" /> },
    { id: "account",       label: "Account",        icon: <AlertOctagon className="h-4 w-4" /> },
  ];
  const tabs = allTabs.filter((t) => {
    if (t.ownerOnly && !isOwner) return false;
    if (t.id === "workspace" && isIndividual) return false;
    return true;
  });

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
                <span className="relative inline-flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-muted text-2xl font-bold text-muted-foreground shadow-sm">
                  <span className="h-full w-full overflow-hidden rounded-full">
                    {user?.avatar_url ? (
                      <img src={user.avatar_url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center">{initials}</span>
                    )}
                  </span>
                  <span
                    className="absolute -bottom-1 -right-1 z-10 inline-flex h-8 w-8 cursor-pointer flex-col items-center justify-center rounded-full bg-brand p-1.5 text-white shadow-md transition-transform hover:scale-105"
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
                    <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploadAvatarMut.isPending} className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-transparent px-4 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:border-border hover:bg-muted/40 hover:text-foreground disabled:pointer-events-none disabled:opacity-40">
                      {uploadAvatarMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                      Upload New Photo
                    </button>
                    <button type="button" onClick={() => removeAvatarMut.mutate(undefined)} disabled={removeAvatarMut.isPending} className="inline-flex items-center rounded-full border border-destructive/30 bg-transparent px-4 py-2 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/10 disabled:pointer-events-none disabled:opacity-40">
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            </Section>

            <Section title="Personal Information" description="Review or update your identity details.">
              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">First Name</label>
                  <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} className="h-10 rounded-full" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Last Name</label>
                  <Input value={lastName} onChange={(e) => setLastName(e.target.value)} className="h-10 rounded-full" />
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
                  <Input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} className="h-10 rounded-full" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Department</label>
                  <Input value={department} onChange={(e) => setDepartment(e.target.value)} className="h-10 rounded-full" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Phone</label>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="h-10 rounded-full" />
                </div>

                {user?.date_of_birth && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Date of Birth</label>
                    <div className="relative">
                      <Input
                        defaultValue={new Date(user.date_of_birth).toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })}
                        disabled
                        className="h-10 rounded-full pr-24"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-muted-foreground">
                        Cannot change
                      </span>
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Timezone</label>
                  <select value={tz} onChange={(e) => setTz(e.target.value)} className="h-10 w-full rounded-full border border-border/60 bg-background px-4 text-sm outline-none transition-all focus:border-brand focus:ring-1 focus:ring-brand/10">
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
            {isOwner && (
              <Section title="Company Logo" description="Upload your company logo. Shown on reports and documents.">
                <div className="flex items-center gap-6">
                  <span className="relative inline-flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border border-border/60 bg-muted overflow-hidden shadow-sm">
                    {orgQuery.data?.logo_url ? (
                      <img src={orgQuery.data.logo_url} alt="Company logo" className="h-full w-full object-contain p-1" />
                    ) : (
                      <Building2 className="h-8 w-8 text-muted-foreground/40" />
                    )}
                  </span>
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) uploadOrgLogoMut.mutate(file);
                      e.target.value = "";
                    }}
                  />
                  <div className="space-y-1.5">
                    <p className="text-sm text-muted-foreground">PNG, JPG or SVG. Max 5 MB. Square format recommended.</p>
                    <button type="button" onClick={() => logoInputRef.current?.click()} disabled={uploadOrgLogoMut.isPending} className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-transparent px-4 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:border-border hover:bg-muted/40 hover:text-foreground disabled:pointer-events-none disabled:opacity-40">
                      {uploadOrgLogoMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                      {orgQuery.data?.logo_url ? "Change Logo" : "Upload Logo"}
                    </button>
                  </div>
                </div>
              </Section>
            )}

            <Section title="Business Information" description="Official company details and registration.">
              {orgQuery.isLoading ? (
                <div className="py-8 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" /></div>
              ) : orgEditing ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {["business_name", "business_type", "rc_number", "tax_id", "website", "city", "state", "country", "phone"].map((field) => (
                    <div key={field} className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground capitalize">{field.replace(/_/g, " ")}</label>
                      <Input className="h-10 rounded-full" defaultValue={(org as any)?.[field] ?? ""} onChange={(e) => setOrgForm((prev) => ({ ...prev, [field]: e.target.value }))} />
                    </div>
                  ))}
                  <div className="md:col-span-2 mt-2 flex gap-3 justify-end">
                    <button type="button" onClick={() => setOrgEditing(false)} className="inline-flex items-center rounded-full border border-border/60 bg-transparent px-4 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:border-border hover:bg-muted/40 hover:text-foreground">Cancel</button>
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
                      ["Website", org?.website],
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
                    <button type="button" onClick={() => setOrgEditing(true)} className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-transparent px-4 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:border-border hover:bg-muted/40 hover:text-foreground">
                      Edit Business Information
                    </button>
                  </div>
                </>
              )}
            </Section>

            <Section title="Business Configuration" description="Payout rules, risk profile, and financial thresholds set during onboarding.">
              {orgQuery.isLoading ? (
                <div className="py-8 text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" /></div>
              ) : configEditing ? (
                <div className="space-y-5">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">Monthly Transaction Volume</label>
                      <select value={configVolume} onChange={(e) => setConfigVolume(e.target.value)} className="h-10 w-full rounded-full border border-border/60 bg-background px-4 text-sm outline-none transition-all focus:border-brand focus:ring-1 focus:ring-brand/10">
                        <option value="">Select volume range</option>
                        {MONTHLY_VOLUMES.map((v) => <option key={v} value={v}>{v}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">Average Monthly Payouts</label>
                      <select value={configPayouts} onChange={(e) => setConfigPayouts(e.target.value)} className="h-10 w-full rounded-full border border-border/60 bg-background px-4 text-sm outline-none transition-all focus:border-brand focus:ring-1 focus:ring-brand/10">
                        <option value="">Select payout range</option>
                        {MONTHLY_PAYOUTS.map((v) => <option key={v} value={v}>{v}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">Primary Bank</label>
                      <select value={configBank} onChange={(e) => setConfigBank(e.target.value)} className="h-10 w-full rounded-full border border-border/60 bg-background px-4 text-sm outline-none transition-all focus:border-brand focus:ring-1 focus:ring-brand/10">
                        <option value="">Select primary bank</option>
                        {NIGERIAN_BANKS.map((v) => <option key={v} value={v}>{v}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">Interswitch Merchant ID</label>
                      <Input value={configMerchantId} onChange={(e) => setConfigMerchantId(e.target.value)} className="h-10 rounded-full" placeholder="Enter merchant account ID" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">Registered State</label>
                      <select value={configMerchantState} onChange={(e) => setConfigMerchantState(e.target.value)} className="h-10 w-full rounded-full border border-border/60 bg-background px-4 text-sm outline-none transition-all focus:border-brand focus:ring-1 focus:ring-brand/10">
                        <option value="">Select state</option>
                        {NIGERIAN_STATES.map((v) => <option key={v} value={v}>{v}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">Default Daily Payout Limit (₦)</label>
                      <Input inputMode="decimal" value={configDailyLimit} onChange={(e) => setConfigDailyLimit(e.target.value.replace(/[^0-9,.]/g, ""))} className="h-10 rounded-full" placeholder="e.g. 5,000,000" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">Single Payout Cap (₦)</label>
                      <Input inputMode="decimal" value={configSingleCap} onChange={(e) => setConfigSingleCap(e.target.value.replace(/[^0-9,.]/g, ""))} className="h-10 rounded-full" placeholder="e.g. 250,000" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">Risk Alert Threshold</label>
                      <Input inputMode="decimal" value={configRiskThreshold} onChange={(e) => setConfigRiskThreshold(e.target.value.replace(/[^0-9.]/g, "").replace(/(\..*?)\./g, "$1"))} className="h-10 rounded-full" placeholder="e.g. 0.35" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">Liquidity Alert Buffer (%)</label>
                      <Input inputMode="numeric" value={configLiquidityBuffer} onChange={(e) => setConfigLiquidityBuffer(e.target.value.replace(/\D/g, ""))} className="h-10 rounded-full" placeholder="e.g. 15" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Primary Use Cases</label>
                    <PillSelect
                      options={USE_CASE_OPTIONS}
                      selected={configUseCases}
                      onToggle={(v) => setConfigUseCases((prev) => prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v])}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Risk Appetite</label>
                    <CardSelect options={RISK_OPTIONS} selected={configRisk} onChange={setConfigRisk} />
                  </div>
                  <div className="flex gap-3 justify-end">
                    <button type="button" onClick={() => setConfigEditing(false)} className="inline-flex items-center rounded-full border border-border/60 bg-transparent px-4 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:border-border hover:bg-muted/40 hover:text-foreground">Cancel</button>
                    <Button className="rounded-full bg-brand text-white" onClick={handleConfigSave} disabled={updateOrgConfigMut.isPending || updateOrg.isPending}>
                      {(updateOrgConfigMut.isPending || updateOrg.isPending) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Save
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid gap-4 md:grid-cols-2">
                    {([
                      ["Monthly Transaction Volume", org?.config?.monthly_txn_volume_range],
                      ["Average Monthly Payouts", org?.config?.avg_monthly_payouts_range],
                      ["Primary Bank", org?.config?.primary_bank],
                      ["Risk Appetite", org?.config?.risk_appetite ? org.config.risk_appetite.charAt(0).toUpperCase() + org.config.risk_appetite.slice(1) : null],
                      ["Interswitch Merchant ID", org?.interswitch_merchant_id],
                      ["Registered State", org?.config?.merchant_state],
                      ["Daily Payout Limit", org?.config?.daily_payout_limit != null ? `₦${org.config.daily_payout_limit.toLocaleString()}` : null],
                      ["Single Payout Cap", org?.config?.single_payout_cap != null ? `₦${org.config.single_payout_cap.toLocaleString()}` : null],
                      ["Risk Alert Threshold", org?.config?.risk_alert_threshold != null ? String(org.config.risk_alert_threshold) : null],
                      ["Liquidity Alert Buffer", org?.config?.liquidity_alert_buffer != null ? `${org.config.liquidity_alert_buffer}%` : null],
                    ] as [string, string | null | undefined][]).map(([label, value]) => (
                      <div key={label} className="rounded-xl border border-border/50 bg-muted/20 px-4 py-3 text-sm shadow-sm">
                        <span className="text-xs font-medium text-muted-foreground">{label}</span>
                        <p className="mt-0.5 font-semibold text-foreground">{value || "—"}</p>
                      </div>
                    ))}
                  </div>
                  {org?.config?.primary_use_cases && org.config.primary_use_cases.length > 0 && (
                    <div className="mt-4">
                      <p className="text-xs font-medium text-muted-foreground mb-2">Primary Use Cases</p>
                      <div className="flex flex-wrap gap-2">
                        {org.config.primary_use_cases.map((uc) => (
                          <span key={uc} className="rounded-full border border-brand/30 bg-brand/5 px-3 py-1 text-xs font-medium text-brand">{uc}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="mt-5">
                    <button type="button" onClick={handleEditConfig} className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-transparent px-4 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:border-border hover:bg-muted/40 hover:text-foreground">
                      Edit Business Configuration
                    </button>
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
                  <Input type="password" placeholder="Current Password" className="h-10 rounded-full" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} />
                  <Input type="password" placeholder="New Password" className="h-10 rounded-full" value={newPw} onChange={(e) => setNewPw(e.target.value)} />
                  <Input type="password" placeholder="Confirm New Password" className="h-10 rounded-full" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} />
                  {newPw && confirmPw && newPw !== confirmPw && (
                    <p className="text-xs text-destructive">Passwords do not match</p>
                  )}
                  {is2FAEnabled && (
                    <div className="space-y-1.5 rounded-xl border border-border/60 bg-muted/40 p-3">
                      <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                        <ShieldCheck className="h-3.5 w-3.5 text-brand" />
                        Enter your authenticator code to confirm
                      </p>
                      <OtpInput length={6} value={changePwOtp} onChange={setChangePwOtp} />
                    </div>
                  )}
                  <div>
                    <Button className="mt-2 rounded-full px-6 shadow-sm" onClick={handlePasswordChange} disabled={changePasswordMut.isPending || !currentPw || !newPw || newPw !== confirmPw || (is2FAEnabled && changePwOtp.length < 6)}>
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
                  <button type="button" onClick={handleStartSetup} disabled={twoFASetup.isPending} className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-transparent px-4 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:border-border hover:bg-muted/40 hover:text-foreground disabled:pointer-events-none disabled:opacity-40">
                    {twoFASetup.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                    Enable 2FA
                  </button>
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
                      <button type="button" onClick={() => { setTwoFAStep("idle"); setTwoFASetupData(null); setTwoFACode(""); }} className="inline-flex items-center rounded-full border border-border/60 bg-transparent px-4 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:border-border hover:bg-muted/40 hover:text-foreground">
                        Cancel
                      </button>
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
                      <button type="button" onClick={copyBackupCodes} className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-transparent px-4 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:border-border hover:bg-muted/40 hover:text-foreground">
                        {backupCopied ? <><CheckCircle2 className="h-4 w-4 text-brand" />Copied!</> : <><Copy className="h-4 w-4" />Copy All</>}
                      </button>
                      <button type="button" onClick={downloadBackupCodes} className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-transparent px-4 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:border-border hover:bg-muted/40 hover:text-foreground">
                        <Download className="h-4 w-4" />Download
                      </button>
                      <Button className="rounded-full bg-brand px-6 text-white shadow-sm hover:opacity-90" onClick={() => setTwoFAStep("idle")}>Done</Button>
                    </div>
                  </div>
                )}

                {is2FAEnabled && twoFAStep === "idle" && (
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <button type="button" onClick={handleRegenBackup} disabled={regenBackup.isPending} className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-transparent px-4 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:border-border hover:bg-muted/40 hover:text-foreground disabled:pointer-events-none disabled:opacity-40">
                        {regenBackup.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                        Regenerate Backup Codes
                      </button>
                      <button type="button" onClick={() => { setTwoFAStep("disabling"); setDisablePw(""); }} className="inline-flex items-center gap-1.5 rounded-full border border-destructive/30 bg-transparent px-4 py-2 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/10">
                        <ShieldOff className="h-4 w-4" />Disable 2FA
                      </button>
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
                      <p className="text-sm font-semibold text-foreground">Enter your password to disable 2FA</p>
                    </div>
                    <div className="sm:max-w-sm">
                      <Input type="password" placeholder="Your account password" className="h-10 rounded-full" value={disablePw} onChange={(e) => setDisablePw(e.target.value)} />
                    </div>
                    <div className="flex gap-3">
                      <Button variant="destructive" className="rounded-full shadow-sm" onClick={handleDisable2FA} disabled={twoFADisable.isPending || !disablePw}>
                        {twoFADisable.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Disable 2FA
                      </Button>
                      <button type="button" onClick={() => setTwoFAStep("idle")} className="inline-flex items-center rounded-full border border-border/60 bg-transparent px-4 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:border-border hover:bg-muted/40 hover:text-foreground">Cancel</button>
                    </div>
                  </div>
                )}

                {isOwner && (
                  <div className="border-t border-border/50 pt-4 space-y-3">
                    <button type="button" className="flex w-full items-center justify-between text-sm font-semibold text-foreground" onClick={() => setShowOrgEnforce((p) => !p)}>
                      <div className="flex items-center gap-2">
                        <span>Organisation-wide 2FA Enforcement</span>
                        {isOrgEnforced && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-brand/10 px-2 py-0.5 text-xs font-semibold text-brand">
                            <CheckCircle2 className="h-3 w-3" />Enforced
                          </span>
                        )}
                      </div>
                      {showOrgEnforce ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                    </button>
                    {showOrgEnforce && (
                      <div className="rounded-2xl border border-border/60 bg-card p-4 space-y-3 shadow-sm">
                        <p className="text-sm text-muted-foreground">
                          {isOrgEnforced
                            ? "2FA is currently enforced for all team members. Members without 2FA are given a 24-hour grace period before access is restricted."
                            : "Require all team members to enable 2FA. Members without 2FA will have a 24-hour grace period before access is restricted."}
                        </p>
                        {isOrgEnforced ? (
                          <button type="button" onClick={() => orgRequire2FA.mutate(false)} disabled={orgRequire2FA.isPending} className="inline-flex items-center gap-1.5 rounded-full border border-destructive/30 bg-transparent px-4 py-2 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/10 disabled:pointer-events-none disabled:opacity-40">
                            {orgRequire2FA.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldOff className="h-4 w-4" />}
                            Remove Enforcement
                          </button>
                        ) : (
                          <Button className="rounded-full bg-brand px-6 text-white shadow-sm hover:opacity-90" onClick={() => orgRequire2FA.mutate(true)} disabled={orgRequire2FA.isPending}>
                            {orgRequire2FA.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                            Enforce 2FA for Team
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ── Approval PIN ── */}
              <div className="space-y-4 border-t border-border/50 pt-6">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-foreground">Approval PIN</h3>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      Set a 4–6 digit PIN that must be entered before confirming any payout approval.
                    </p>
                  </div>
                  <div className="shrink-0">
                    <StatusBadge status={hasPin ? "active" : "pending"} label={hasPin ? "Enabled" : "Not set"} />
                  </div>
                </div>

                {pinStep === "idle" && (
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => { setPinStep("setup"); setNewPin(""); setConfirmPin(""); }}
                      className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-transparent px-4 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:border-border hover:bg-muted/40 hover:text-foreground"
                    >
                      <Lock className="h-4 w-4" />
                      {hasPin ? "Change PIN" : "Set up PIN"}
                    </button>
                    {hasPin && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setPinStep("reset-requesting");
                            setResetCode(""); setResetNewPin(""); setResetConfirmPin(""); setResetMethod(null);
                          }}
                          className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-transparent px-4 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:border-border hover:bg-muted/40 hover:text-foreground"
                        >
                          Forgot PIN?
                        </button>
                        <button
                          type="button"
                          onClick={() => setPinStep("removing")}
                          className="inline-flex items-center gap-1.5 rounded-full border border-destructive/30 bg-transparent px-4 py-2 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/10"
                        >
                          Remove PIN
                        </button>
                      </>
                    )}
                  </div>
                )}

                {pinStep === "setup" && (
                  <div className="rounded-2xl border border-border/60 bg-card p-4 space-y-3 shadow-sm sm:max-w-sm">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground">New PIN (4–6 digits)</label>
                      <Input
                        type="password"
                        inputMode="numeric"
                        maxLength={6}
                        value={newPin}
                        onChange={(e) => setNewPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        placeholder="Enter PIN"
                        className="h-10 rounded-full"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground">Confirm PIN</label>
                      <Input
                        type="password"
                        inputMode="numeric"
                        maxLength={6}
                        value={confirmPin}
                        onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        placeholder="Re-enter PIN"
                        className="h-10 rounded-full"
                      />
                      {confirmPin && newPin !== confirmPin && (
                        <p className="text-xs text-destructive">PINs do not match</p>
                      )}
                    </div>
                    <div className="flex gap-3">
                      <Button
                        className="rounded-full bg-brand px-6 text-white shadow-sm hover:opacity-90"
                        disabled={newPin.length < 4 || newPin !== confirmPin || setupPin.isPending}
                        onClick={() => setupPin.mutate(newPin, { onSuccess: () => setPinStep("idle") })}
                      >
                        {setupPin.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Save PIN
                      </Button>
                      <button type="button" onClick={() => setPinStep("idle")} className="inline-flex items-center rounded-full border border-border/60 bg-transparent px-4 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:border-border hover:bg-muted/40 hover:text-foreground">
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {pinStep === "removing" && (
                  <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-4 space-y-3 sm:max-w-sm">
                    <p className="text-sm text-muted-foreground">Are you sure you want to remove your approval PIN? Approvals will no longer require PIN confirmation.</p>
                    <div className="flex gap-3">
                      <Button
                        variant="destructive"
                        className="rounded-full shadow-sm"
                        disabled={removePin.isPending}
                        onClick={() => removePin.mutate(undefined, { onSuccess: () => setPinStep("idle") })}
                      >
                        {removePin.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Remove PIN
                      </Button>
                      <button type="button" onClick={() => setPinStep("idle")} className="inline-flex items-center rounded-full border border-border/60 bg-transparent px-4 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:border-border hover:bg-muted/40 hover:text-foreground">
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {pinStep === "reset-requesting" && (
                  <div className="rounded-2xl border border-border/60 bg-card p-4 space-y-4 shadow-sm sm:max-w-sm">
                    <div>
                      <p className="text-sm font-bold text-foreground">Reset Approval PIN</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {resetMethod == null
                          ? "We'll send a verification code to verify your identity."
                          : resetMethod === "email"
                          ? "A 6-digit code has been sent to your email address."
                          : "Enter the code from your authenticator app."}
                      </p>
                    </div>
                    {resetMethod == null ? (
                      <div className="flex gap-3">
                        <Button
                          className="rounded-full bg-brand px-6 text-white shadow-sm hover:opacity-90"
                          disabled={requestPinReset.isPending}
                          onClick={() =>
                            requestPinReset.mutate(undefined, {
                              onSuccess: (data) => {
                                setResetMethod(data.method);
                                setPinStep("reset-confirm");
                              },
                            })
                          }
                        >
                          {requestPinReset.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                          Send Verification Code
                        </Button>
                        <button type="button" onClick={() => setPinStep("idle")} className="inline-flex items-center rounded-full border border-border/60 bg-transparent px-4 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:border-border hover:bg-muted/40 hover:text-foreground">
                          Cancel
                        </button>
                      </div>
                    ) : null}
                  </div>
                )}

                {pinStep === "reset-confirm" && (
                  <div className="rounded-2xl border border-border/60 bg-card p-4 space-y-3 shadow-sm sm:max-w-sm">
                    <p className="text-sm font-bold text-foreground">Enter verification code &amp; new PIN</p>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground">
                        {resetMethod === "totp" ? "Authenticator code" : "Email verification code"}
                      </label>
                      <Input
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        value={resetCode}
                        onChange={(e) => setResetCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        placeholder="6-digit code"
                        className="h-10 rounded-full"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground">New PIN (4–6 digits)</label>
                      <Input
                        type="password"
                        inputMode="numeric"
                        maxLength={6}
                        value={resetNewPin}
                        onChange={(e) => setResetNewPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        placeholder="New PIN"
                        className="h-10 rounded-full"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground">Confirm new PIN</label>
                      <Input
                        type="password"
                        inputMode="numeric"
                        maxLength={6}
                        value={resetConfirmPin}
                        onChange={(e) => setResetConfirmPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        placeholder="Re-enter new PIN"
                        className="h-10 rounded-full"
                      />
                      {resetConfirmPin && resetNewPin !== resetConfirmPin && (
                        <p className="text-xs text-destructive">PINs do not match</p>
                      )}
                    </div>
                    <div className="flex gap-3">
                      <Button
                        className="rounded-full bg-brand px-6 text-white shadow-sm hover:opacity-90"
                        disabled={
                          resetCode.length < 6 ||
                          resetNewPin.length < 4 ||
                          resetNewPin !== resetConfirmPin ||
                          confirmPinReset.isPending
                        }
                        onClick={() => confirmPinReset.mutate({ code: resetCode, new_pin: resetNewPin })}
                      >
                        {confirmPinReset.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Reset PIN
                      </Button>
                      <button type="button" onClick={() => setPinStep("idle")} className="inline-flex items-center rounded-full border border-border/60 bg-transparent px-4 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:border-border hover:bg-muted/40 hover:text-foreground">
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Section>
        )}

        {/* ════════════════ NOTIFICATIONS ════════════════ */}
        {activeTab === "notifications" && (
          <>
            <Section title="Email Notifications" description="Choose which emails FlowPilot sends to you. Security-critical alerts (e.g. account lockouts, password resets) are always sent.">
              <div className="divide-y divide-border/60">
                <NotifToggle
                  label="Login alerts"
                  description="Receive an email each time a successful sign-in is detected on your account."
                  checked={notifPrefs.login_alerts}
                  onChange={(v) => updateNotifPrefs.mutate({ login_alerts: v })}
                  loading={updateNotifPrefs.isPending}
                />
                <NotifToggle
                  label="Security alerts"
                  description="Emails when 2FA is enabled or disabled on your account."
                  checked={notifPrefs.security_alerts}
                  onChange={(v) => updateNotifPrefs.mutate({ security_alerts: v })}
                  loading={updateNotifPrefs.isPending}
                />
                <NotifToggle
                  label="Payout updates"
                  description="Notifications for payout runs awaiting your approval or when a run you created completes."
                  checked={notifPrefs.payout_updates}
                  onChange={(v) => updateNotifPrefs.mutate({ payout_updates: v })}
                  loading={updateNotifPrefs.isPending}
                />
                {!isIndividual && (
                  <NotifToggle
                    label="KYC updates"
                    description="Status emails when KYC documents are submitted or verified."
                    checked={notifPrefs.kyc_updates}
                    onChange={(v) => updateNotifPrefs.mutate({ kyc_updates: v })}
                    loading={updateNotifPrefs.isPending}
                  />
                )}
                <NotifToggle
                  label="API key expiry warnings"
                  description="Receive a warning email when an API key is approaching its expiry date."
                  checked={notifPrefs.api_key_warnings}
                  onChange={(v) => updateNotifPrefs.mutate({ api_key_warnings: v })}
                  loading={updateNotifPrefs.isPending}
                />
                {!isIndividual && (
                  <>
                    <NotifToggle
                      label="Wallet alerts"
                      description="Top-up confirmations and low-balance warnings for your organisation wallet."
                      checked={notifPrefs.wallet_alerts}
                      onChange={(v) => updateNotifPrefs.mutate({ wallet_alerts: v })}
                      loading={updateNotifPrefs.isPending}
                    />
                    <NotifToggle
                      label="Scheduled run reminders"
                      description="A heads-up email the day before a scheduled payout run fires."
                      checked={notifPrefs.scheduled_run_reminders}
                      onChange={(v) => updateNotifPrefs.mutate({ scheduled_run_reminders: v })}
                      loading={updateNotifPrefs.isPending}
                    />
                  </>
                )}
              </div>
            </Section>
          </>
        )}

        {/* ════════════════ ACCOUNT ════════════════ */}
        {activeTab === "account" && (
          <Section title="Account" description="Data export, session management, and destructive actions." variant="danger">
            <div className="space-y-4">
              {isOwner && (
                <>
                  <div className="flex flex-col justify-between gap-4 border-b border-destructive/20 pb-4 sm:flex-row sm:items-center">
                    <div>
                      <p className="font-bold text-foreground">Export All Data</p>
                      <p className="mt-0.5 text-sm text-muted-foreground">Download your full workspace data (runs, transactions, team, audit logs) as JSON.</p>
                    </div>
                    <button type="button" onClick={() => exportData.mutate()} disabled={exportData.isPending} className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border/60 bg-transparent px-4 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:border-border hover:bg-muted/40 hover:text-foreground disabled:pointer-events-none disabled:opacity-40">
                      {exportData.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                      Export Data
                    </button>
                  </div>

                  <div className="flex flex-col justify-between gap-4 border-b border-destructive/20 pb-4 sm:flex-row sm:items-center">
                    <div>
                      <p className="font-bold text-foreground">Import Data</p>
                      <p className="mt-0.5 text-sm text-muted-foreground">Restore your business profile, owner profile, and team from a previously exported JSON file.</p>
                    </div>
                    <button type="button" onClick={() => setImportOpen(true)} className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border/60 bg-transparent px-4 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:border-border hover:bg-muted/40 hover:text-foreground">
                      <Upload className="h-4 w-4" />
                      Import Data
                    </button>
                  </div>
                </>
              )}

              <div className="flex flex-col justify-between gap-4 border-b border-destructive/20 pb-4 sm:flex-row sm:items-center">
                <div>
                  <p className="font-bold text-foreground">Sign Out</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">Sign out of your current session on this device.</p>
                </div>
                <button type="button" onClick={() => logout()} className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-destructive/30 bg-transparent px-4 py-2 text-sm font-semibold text-destructive transition-colors hover:bg-destructive/10">
                  <LogOut className="h-4 w-4" /> Sign Out
                </button>
              </div>

              {isOwner ? (
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <div>
                    <p className="font-bold text-destructive">{isIndividual ? "Delete Account" : "Delete Organisation"}</p>
                    <p className="mt-0.5 text-sm text-destructive/80">
                      {isIndividual
                        ? "Permanently deletes your account and all associated data. This cannot be undone."
                        : "Permanently deactivates your workspace and removes access for all team members. Export your data first."}
                    </p>
                  </div>
                  <Button variant="destructive" className="shrink-0 rounded-full shadow-sm" onClick={() => { setDeleteOpen(true); setDeleteConfirmText(""); setDeleteOtp(""); setDeleteEmailCode(""); setDeleteCodeSent(false); }}>
                    <Trash2 className="mr-2 h-4 w-4" /> {isIndividual ? "Delete Account" : "Delete Organisation"}
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                  <div>
                    <p className="font-bold text-destructive">Delete Account</p>
                    <p className="mt-0.5 text-sm text-destructive/80">Permanently deactivates your account and removes you from the workspace. This cannot be undone.</p>
                  </div>
                  <Button variant="destructive" className="shrink-0 rounded-full shadow-sm" onClick={() => { setSelfDeleteOpen(true); setSelfDeleteConfirmText(""); setSelfDeleteOtp(""); setSelfDeleteEmailCode(""); setSelfDeleteCodeSent(false); }}>
                    <Trash2 className="mr-2 h-4 w-4" /> Delete Account
                  </Button>
                </div>
              )}
            </div>
          </Section>
        )}
      </div>

      {/* ── Delete Organisation Confirmation Modal (owners) ── */}
      {deleteOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl bg-card shadow-2xl border border-border animate-in zoom-in-95 duration-200 overflow-hidden">
            <div className="px-6 py-5 border-b border-border">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 mb-3">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Delete Organisation</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                This will permanently deactivate your entire workspace and remove access for all team members. This action <strong>cannot be undone</strong>.
              </p>
            </div>
            <div className="px-6 py-5 space-y-4">
              {/* Export advisory */}
              <div className="rounded-xl border border-border/60 bg-muted/20 px-4 py-3 text-sm">
                <p className="font-semibold text-foreground flex items-center gap-2">
                  <Download className="h-4 w-4 shrink-0" />
                  Export your data first
                </p>
                <p className="mt-1 text-muted-foreground">
                  We strongly recommend exporting your workspace data before deleting. You can restore it later if needed.
                </p>
                <button
                  type="button"
                  className="mt-2 text-xs font-semibold text-amber-800 underline underline-offset-2 hover:opacity-80"
                  onClick={() => { exportData.mutate(); }}
                  disabled={exportData.isPending}
                >
                  {exportData.isPending ? "Exporting…" : "Export data now →"}
                </button>
              </div>

              <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                <p className="font-semibold">What gets deleted:</p>
                <ul className="mt-1 list-disc pl-4 space-y-0.5 text-destructive/80">
                  <li>Your business workspace</li>
                  <li>All team members lose access</li>
                  <li>Your account is deactivated</li>
                </ul>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-foreground">
                  Type <span className="font-mono font-bold text-destructive">DELETE</span> to confirm
                </label>
                <Input value={deleteConfirmText} onChange={(e) => setDeleteConfirmText(e.target.value)} placeholder="DELETE" className="h-10 rounded-xl font-mono" autoComplete="off" />
              </div>

              {/* ── Verification ── */}
              {is2FAEnabled ? (
                <div className="space-y-1.5 rounded-xl border border-border/60 bg-muted/40 p-3">
                  <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-brand" />
                    Enter your authenticator code
                  </p>
                  <OtpInput length={6} value={deleteOtp} onChange={setDeleteOtp} />
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                    <KeyRound className="h-3.5 w-3.5" />
                    Verify your identity via email code
                  </p>
                  {!deleteCodeSent ? (
                    <Button variant="outline" className="rounded-full shadow-sm w-full" onClick={() => requestDeleteCode.mutate(undefined, { onSuccess: () => setDeleteCodeSent(true) })} disabled={requestDeleteCode.isPending}>
                      {requestDeleteCode.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Send Verification Code
                    </Button>
                  ) : (
                    <div className="space-y-1.5">
                      <p className="text-xs text-muted-foreground">Enter the 6-digit code sent to your email</p>
                      <OtpInput length={6} value={deleteEmailCode} onChange={setDeleteEmailCode} />
                      <button type="button" className="text-xs text-brand underline-offset-2 hover:underline" onClick={() => requestDeleteCode.mutate(undefined, { onSuccess: () => setDeleteCodeSent(true) })} disabled={requestDeleteCode.isPending}>
                        Resend code
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-border px-6 py-4">
              <Button variant="ghost" className="rounded-full px-6" onClick={() => setDeleteOpen(false)} disabled={deleteAccount.isPending}>Cancel</Button>
              <Button
                variant="destructive"
                className="rounded-full px-6 shadow-sm"
                disabled={
                  deleteConfirmText !== "DELETE" ||
                  deleteAccount.isPending ||
                  (is2FAEnabled ? deleteOtp.length < 6 : !deleteCodeSent || deleteEmailCode.length < 6)
                }
                onClick={() => deleteAccount.mutate(
                  is2FAEnabled ? { totp_code: deleteOtp } : { delete_code: deleteEmailCode }
                )}
              >
                {deleteAccount.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Deleting…</> : <><Trash2 className="mr-2 h-4 w-4" />Delete Organisation</>}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Account Modal (non-owners) ── */}
      {selfDeleteOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl bg-card shadow-2xl border border-border animate-in zoom-in-95 duration-200 overflow-hidden">
            <div className="px-6 py-5 border-b border-border">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 mb-3">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Delete Account</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                This will permanently deactivate your account and remove you from the workspace. You will lose all access. This action <strong>cannot be undone</strong>.
              </p>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-foreground">
                  Type <span className="font-mono font-bold text-destructive">DELETE</span> to confirm
                </label>
                <Input
                  value={selfDeleteConfirmText}
                  onChange={(e) => setSelfDeleteConfirmText(e.target.value)}
                  placeholder="DELETE"
                  className="h-10 rounded-xl font-mono"
                  autoComplete="off"
                />
              </div>

              {/* ── Identity verification ── */}
              {is2FAEnabled ? (
                <div className="space-y-1.5 rounded-xl border border-border/60 bg-muted/40 p-3">
                  <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-brand" />
                    Enter your authenticator code
                  </p>
                  <OtpInput length={6} value={selfDeleteOtp} onChange={setSelfDeleteOtp} />
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                    <KeyRound className="h-3.5 w-3.5" />
                    Verify your identity via email code
                  </p>
                  {!selfDeleteCodeSent ? (
                    <Button
                      variant="outline"
                      className="rounded-full shadow-sm w-full"
                      onClick={() => requestDeleteCode.mutate(undefined, { onSuccess: () => setSelfDeleteCodeSent(true) })}
                      disabled={requestDeleteCode.isPending}
                    >
                      {requestDeleteCode.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Send Verification Code
                    </Button>
                  ) : (
                    <div className="space-y-1.5">
                      <p className="text-xs text-muted-foreground">Enter the 6-digit code sent to your email</p>
                      <OtpInput length={6} value={selfDeleteEmailCode} onChange={setSelfDeleteEmailCode} />
                      <button
                        type="button"
                        className="text-xs text-brand underline-offset-2 hover:underline"
                        onClick={() => requestDeleteCode.mutate(undefined, { onSuccess: () => setSelfDeleteCodeSent(true) })}
                        disabled={requestDeleteCode.isPending}
                      >
                        Resend code
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-border px-6 py-4">
              <Button
                variant="ghost"
                className="rounded-full px-6"
                onClick={() => { setSelfDeleteOpen(false); setSelfDeleteOtp(""); setSelfDeleteEmailCode(""); setSelfDeleteCodeSent(false); }}
                disabled={deleteSelf.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                className="rounded-full px-6 shadow-sm"
                disabled={
                  selfDeleteConfirmText !== "DELETE" ||
                  deleteSelf.isPending ||
                  (is2FAEnabled ? selfDeleteOtp.length < 6 : !selfDeleteCodeSent || selfDeleteEmailCode.length < 6)
                }
                onClick={() => deleteSelf.mutate(
                  is2FAEnabled ? { totp_code: selfDeleteOtp } : { delete_code: selfDeleteEmailCode }
                )}
              >
                {deleteSelf.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Deleting…</> : <><Trash2 className="mr-2 h-4 w-4" />Delete Account</>}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Import Data Modal (owners) ── */}
      {importOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl bg-card shadow-2xl border border-border animate-in zoom-in-95 duration-200 overflow-hidden">
            <div className="px-6 py-5 border-b border-border">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand/10 mb-3">
                <FileUp className="h-5 w-5 text-brand" />
              </div>
              <h3 className="text-lg font-bold text-foreground">Import Workspace Data</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Upload a FlowPilot export JSON file to restore your business profile, personal profile, and team members.
              </p>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="rounded-xl border border-border/60 bg-muted/20 px-4 py-3 text-sm text-foreground/80">
                <p className="font-semibold">What gets restored:</p>
                <ul className="mt-1 list-disc pl-4 space-y-0.5 text-muted-foreground">
                  <li>Business profile fields (name, location, contact)</li>
                  <li>Your personal profile fields</li>
                  <li>Team members (re-invited or added directly)</li>
                </ul>
                <p className="mt-2 text-blue-600 text-xs">Existing data is never overwritten — only empty fields are filled in.</p>
              </div>

              <input
                ref={importFileRef}
                type="file"
                accept=".json,application/json"
                className="sr-only"
                onChange={(e) => setImportFile(e.target.files?.[0] ?? null)}
              />

              <div
                onClick={() => importFileRef.current?.click()}
                className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed py-8 transition-all ${
                  importFile
                    ? "border-brand/50 bg-brand/5"
                    : "border-border bg-muted/20 hover:border-brand/40 hover:bg-muted/40"
                }`}
              >
                <Upload className={`h-7 w-7 ${importFile ? "text-brand" : "text-muted-foreground"}`} />
                {importFile ? (
                  <div className="text-center">
                    <p className="text-sm font-semibold text-foreground">{importFile.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{(importFile.size / 1024).toFixed(1)} KB · Click to change</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="text-sm font-semibold text-foreground">Click to select your export file</p>
                    <p className="text-xs text-muted-foreground mt-1">flowpilot-export-*.json</p>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-border px-6 py-4">
              <Button variant="ghost" className="rounded-full px-6" onClick={() => { setImportOpen(false); setImportFile(null); }}>Cancel</Button>
              <Button
                className="rounded-full bg-brand px-6 text-white hover:opacity-90 shadow-sm"
                disabled={!importFile || importData.isPending}
                onClick={() => {
                  if (!importFile) return;
                  importData.mutate(importFile, {
                    onSuccess: () => { setImportOpen(false); setImportFile(null); },
                  });
                }}
              >
                {importData.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Importing…</> : <><Upload className="mr-2 h-4 w-4" />Import</>}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function NotifToggle({
  label,
  description,
  checked,
  onChange,
  loading,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  loading?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-6 py-4">
      <div className="space-y-0.5">
        <p className="text-sm font-semibold text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={loading}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand disabled:cursor-not-allowed disabled:opacity-50",
          checked ? "bg-brand" : "bg-muted"
        )}
      >
        <span
          className={cn(
            "pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm ring-0 transition-transform duration-200",
            checked ? "translate-x-5" : "translate-x-0"
          )}
        />
      </button>
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
