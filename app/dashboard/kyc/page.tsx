"use client";

import { useRef, useState } from "react";
import { useKycStatus, useSubmitKyc } from "@/hooks/use-kyc-queries";
import { useOrgProfile } from "@/hooks/use-settings-queries";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { KycBusinessType } from "@/lib/api-types";
import { IndividualKycPage } from "@/components/kyc/IndividualKycPage";
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  ExternalLink,
  FileText,
  Lock,
  Loader2,
  Mail,
  ShieldCheck,
  TrendingUp,
  Upload,
  User,
} from "lucide-react";
import type { KycLimitInfo } from "@/lib/api-types";

// ── Types ────────────────────────────────────────────────────────────────────

type BusinessTypeOption = {
  value: KycBusinessType;
  label: string;
  description: string;
};

const BUSINESS_TYPES: BusinessTypeOption[] = [
  { value: "limited_company",     label: "Limited Liability Company",    description: "Registered with CAC as a private or public limited company (RC number)" },
  { value: "ngo",                 label: "NGO / Non-Profit Organisation", description: "Registered charity, foundation, or non-governmental organisation" },
  { value: "sole_proprietorship", label: "Sole Proprietorship",           description: "Business Name registered with CAC, owned by one individual" },
  { value: "partnership",         label: "Partnership",                   description: "Two or more individuals operating under a registered business name" },
  { value: "mda",                 label: "Government Agency / MDA",       description: "Ministry, Department, Agency, or government-owned enterprise" },
];

// ── Sub-components ────────────────────────────────────────────────────────────

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }, (_, i) => (
        <div key={i} className="flex items-center gap-2">
          <div
            className={cn(
              "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black transition-colors",
              i + 1 < current
                ? "bg-brand text-white"
                : i + 1 === current
                ? "border-2 border-brand bg-brand/10 text-brand"
                : "border-2 border-border bg-muted text-muted-foreground",
            )}
          >
            {i + 1 < current ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
          </div>
          {i < total - 1 && (
            <div className={cn("h-0.5 w-6 rounded-full", i + 1 < current ? "bg-brand" : "bg-border")} />
          )}
        </div>
      ))}
    </div>
  );
}

function DocUploadField({
  label,
  description,
  required,
  fileRef,
  file,
  onChange,
}: {
  label: string;
  description: string;
  required?: boolean;
  fileRef: React.RefObject<HTMLInputElement>;
  file: File | null;
  onChange: (f: File | null) => void;
}) {
  return (
    <div className="rounded-xl border border-border/60 p-4 space-y-2">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">
            {label}
            {required && <span className="ml-1 text-destructive">*</span>}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        </div>
        {file ? (
          <div className="flex items-center gap-2 shrink-0">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span className="text-xs text-green-600 font-medium max-w-[120px] truncate">{file.name}</span>
            <button type="button" className="text-xs text-muted-foreground underline" onClick={() => onChange(null)}>
              Remove
            </button>
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="shrink-0 rounded-full text-xs gap-1.5"
            onClick={() => fileRef.current?.click()}
          >
            <Upload className="h-3.5 w-3.5" />
            Upload
          </Button>
        )}
      </div>
      <input
        ref={fileRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        className="hidden"
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
      />
    </div>
  );
}

function DocLink({ label, url }: { label: string; url: string | null | undefined }) {
  if (!url) return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30 shrink-0" />
      <span>{label}</span>
      <span className="text-xs text-muted-foreground/60">(not uploaded)</span>
    </div>
  );
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 text-sm text-brand hover:underline"
    >
      <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
      <span>{label}</span>
      <ExternalLink className="h-3.5 w-3.5 opacity-60" />
    </a>
  );
}

// ── Business limits + tiers ───────────────────────────────────────────────────

function fmt(n: number) {
  return `₦${n.toLocaleString("en-NG")}`;
}

const BUSINESS_TIERS = [
  {
    level: 1,
    label: "Level 1 — Basic",
    requirements: "CAC Certificate + Director/Owner ID",
    monthly: 1_500_000,
    single: 300_000,
    wallet: 3_000_000,
  },
  {
    level: 2,
    label: "Level 2 — Standard",
    requirements: "Level 1 + TIN Document + Proof of Address",
    monthly: 10_000_000,
    single: 2_000_000,
    wallet: 20_000_000,
  },
  {
    level: 3,
    label: "Level 3 — Full",
    requirements: "Level 2 + all compliance documents",
    monthly: 50_000_000,
    single: 5_000_000,
    wallet: 100_000_000,
  },
];

function BusinessLimitsSection({
  limit_info,
  onUpgrade,
}: {
  limit_info: KycLimitInfo | null;
  onUpgrade: () => void;
}) {
  const currentLevel = limit_info?.kyc_level ?? 1;
  const atMax = limit_info?.at_max_level ?? false;

  return (
    <div className="space-y-4">
      {/* Active limits card */}
      {limit_info && currentLevel > 0 && (
        <div className="rounded-2xl border border-green-200 bg-green-50 p-5 space-y-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-green-600" />
            <p className="text-sm font-bold text-foreground">
              Level {currentLevel} Limits Active
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground">Monthly</p>
              <p className="text-sm font-black text-foreground">{fmt(limit_info.monthly_limit)}</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground">Per Payment</p>
              <p className="text-sm font-black text-foreground">{fmt(limit_info.single_limit)}</p>
            </div>
            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground">Wallet Cap</p>
              <p className="text-sm font-black text-foreground">{fmt(limit_info.wallet_limit)}</p>
            </div>
          </div>
          {atMax && (
            <div className="flex items-start gap-2 rounded-xl border border-brand/20 bg-brand/5 px-3 py-2">
              <Mail className="h-3.5 w-3.5 text-brand mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground">
                You&apos;re at the maximum level. To request higher limits, email{" "}
                <a href={`mailto:${limit_info.support_email}`} className="font-semibold text-brand underline">
                  {limit_info.support_email}
                </a>.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Tier upgrade cards */}
      {!atMax && (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-foreground">Upgrade for higher limits</p>
          {BUSINESS_TIERS.map((tier) => {
            const done = currentLevel >= tier.level;
            const next = tier.level === currentLevel + 1;
            const locked = tier.level > currentLevel + 1;
            return (
              <div
                key={tier.level}
                className={cn(
                  "rounded-2xl border-2 p-4 space-y-2 transition-colors",
                  done ? "border-green-200 bg-green-50/40" :
                  next ? "border-brand/40 bg-brand/5" :
                  "border-border bg-muted/20 opacity-60"
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-black",
                      done ? "bg-green-500 text-white" :
                      next ? "bg-brand text-white" :
                      "bg-muted text-muted-foreground"
                    )}>
                      {done ? <CheckCircle2 className="h-4 w-4" /> :
                       locked ? <Lock className="h-3.5 w-3.5" /> : tier.level}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">{tier.label}</p>
                      <p className="text-xs text-muted-foreground">{tier.requirements}</p>
                    </div>
                  </div>
                  {next && (
                    <Button
                      size="sm"
                      className="rounded-full shrink-0 text-xs bg-brand text-white hover:opacity-90"
                      onClick={onUpgrade}
                    >
                      Upgrade
                    </Button>
                  )}
                  {done && (
                    <span className="text-xs font-semibold text-green-600">Active</span>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-2 pl-11">
                  <div>
                    <p className="text-[10px] text-muted-foreground">Monthly</p>
                    <p className="text-xs font-bold text-foreground">{fmt(tier.monthly)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">Per Payment</p>
                    <p className="text-xs font-bold text-foreground">{fmt(tier.single)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">Wallet Cap</p>
                    <p className="text-xs font-bold text-foreground">{fmt(tier.wallet)}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Verified read-only card ───────────────────────────────────────────────────

function VerifiedCard({ submission }: { submission: NonNullable<import("@/lib/api-types").KycStatusResponse["submission"]> }) {
  const typeLabel = BUSINESS_TYPES.find((t) => t.value === submission.business_type)?.label ?? submission.business_type ?? "—";
  let partnerList: string[] = [];
  if (submission.partner_names) {
    try { partnerList = JSON.parse(submission.partner_names); } catch { partnerList = [submission.partner_names]; }
  }

  return (
    <div className="space-y-6">
      {/* Status banner */}
      <div className="rounded-2xl border border-green-200 bg-green-50 p-6 flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-green-100">
          <ShieldCheck className="h-6 w-6 text-green-600" />
        </div>
        <div>
          <p className="font-semibold text-green-800">Business Verified</p>
          <p className="mt-1 text-sm text-green-700">
            Your business identity has been confirmed. You have full access to the FlowPilot platform.
          </p>
          {submission.verified_at && (
            <p className="mt-1 text-xs text-green-600">
              Verified on {new Date(submission.verified_at).toLocaleDateString("en-NG", { dateStyle: "long" })}
            </p>
          )}
        </div>
      </div>

      {/* Business info */}
      <div className="rounded-2xl border border-border/60 bg-card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-brand" />
          <p className="text-sm font-black uppercase tracking-wider text-muted-foreground">Business Information</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <InfoRow label="Business Type" value={typeLabel} />
          {submission.registration_number && <InfoRow label="Registration Number" value={submission.registration_number} />}
          {submission.tin_number && <InfoRow label="TIN Number" value={submission.tin_number} />}
          {submission.director_name && <InfoRow label="Director" value={submission.director_name} />}
          {submission.trustee_name && <InfoRow label="Trustee" value={submission.trustee_name} />}
          {submission.scuml_number && <InfoRow label="SCUML Number" value={submission.scuml_number} />}
          {submission.authorized_officer_name && <InfoRow label="Authorized Officer" value={submission.authorized_officer_name} />}
          {partnerList.length > 0 && <InfoRow label="Partners" value={partnerList.join(", ")} className="sm:col-span-2" />}
        </div>
      </div>

      {/* Documents */}
      <div className="rounded-2xl border border-border/60 bg-card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-brand" />
          <p className="text-sm font-black uppercase tracking-wider text-muted-foreground">Submitted Documents</p>
        </div>
        <p className="text-xs text-muted-foreground">Click any document to view it in your browser. Links expire after 1 hour.</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {submission.has_cac_certificate && <DocLink label="CAC Certificate / Registration" url={submission.cac_certificate_url} />}
          {submission.has_tin_document && <DocLink label="TIN Document" url={submission.tin_document_url} />}
          {submission.has_director_id && <DocLink label="Director / Owner ID" url={submission.director_id_url} />}
          {submission.has_proof_of_address && <DocLink label="Proof of Address" url={submission.proof_of_address_url} />}
          {submission.trustee_id_url && <DocLink label="Trustee ID" url={submission.trustee_id_url} />}
          {submission.partner_id_url && <DocLink label="Partner Representative ID" url={submission.partner_id_url} />}
          {submission.scuml_letter_url && <DocLink label="SCUML Letter" url={submission.scuml_letter_url} />}
          {submission.mda_letter_url && <DocLink label="MDA Authorization Letter" url={submission.mda_letter_url} />}
          {submission.authorized_officer_id_url && <DocLink label="Authorized Officer ID" url={submission.authorized_officer_id_url} />}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={cn("space-y-0.5", className)}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}

// ── Step form ─────────────────────────────────────────────────────────────────

export default function KycPage() {
  const { data, isLoading } = useKycStatus();
  const { data: orgProfile, isLoading: orgLoading } = useOrgProfile();
  const submitMut = useSubmitKyc();

  // Branch based on account_type
  const accountType = orgProfile?.account_type ?? "business";
  const kycLevel = orgProfile?.kyc_level ?? 0;

  if (isLoading || orgLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (accountType === "individual") {
    return (
      <div className="mx-auto max-w-2xl pb-16">
        <PageHeader
          title="Identity Verification (KYC)"
          description="Verify your identity to unlock payout capabilities and higher limits."
        />
        <div className="mt-8">
          <IndividualKycPage
            kyc_status={data?.kyc_status ?? "not_submitted"}
            kyc_level={kycLevel}
            limit_info={data?.limit_info ?? null}
            individual_submission={data?.individual_submission ?? null}
          />
        </div>
      </div>
    );
  }

  const [showUpgradeForm, setShowUpgradeForm] = useState(false);
  const [step, setStep] = useState(1);
  const [businessType, setBusinessType] = useState<KycBusinessType | "">("");

  // ── Step 2: Business info ──────────────────────────────────
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [tinNumber, setTinNumber] = useState("");
  const [directorName, setDirectorName] = useState("");
  const [directorBvn, setDirectorBvn] = useState("");
  const [trusteeName, setTrusteeName] = useState("");
  const [trusteeBvn, setTrusteeBvn] = useState("");
  const [scumlNumber, setScumlNumber] = useState("");
  const [partnerNamesRaw, setPartnerNamesRaw] = useState(""); // newline-separated input
  const [authorizedOfficerName, setAuthorizedOfficerName] = useState("");
  const [authorizedOfficerBvn, setAuthorizedOfficerBvn] = useState("");

  // ── Step 3: Documents ──────────────────────────────────────
  const cacRef = useRef<HTMLInputElement>(null!);
  const tinRef = useRef<HTMLInputElement>(null!);
  const poaRef = useRef<HTMLInputElement>(null!);
  const dirIdRef = useRef<HTMLInputElement>(null!);
  const trusteeIdRef = useRef<HTMLInputElement>(null!);
  const partnerIdRef = useRef<HTMLInputElement>(null!);
  const scumlRef = useRef<HTMLInputElement>(null!);
  const mdaRef = useRef<HTMLInputElement>(null!);
  const authOfficerIdRef = useRef<HTMLInputElement>(null!);

  const [cacFile, setCacFile] = useState<File | null>(null);
  const [tinFile, setTinFile] = useState<File | null>(null);
  const [poaFile, setPoaFile] = useState<File | null>(null);
  const [dirIdFile, setDirIdFile] = useState<File | null>(null);
  const [trusteeIdFile, setTrusteeIdFile] = useState<File | null>(null);
  const [partnerIdFile, setPartnerIdFile] = useState<File | null>(null);
  const [scumlFile, setScumlFile] = useState<File | null>(null);
  const [mdaFile, setMdaFile] = useState<File | null>(null);
  const [authOfficerIdFile, setAuthOfficerIdFile] = useState<File | null>(null);

  const kyc_status = data?.kyc_status ?? "not_submitted";
  const submission = data?.submission;

  const handleSubmit = () => {
    const fd = new FormData();
    if (businessType) fd.append("business_type", businessType);
    if (registrationNumber.trim()) fd.append("registration_number", registrationNumber.trim());
    if (tinNumber.trim()) fd.append("tin_number", tinNumber.trim());
    if (directorName.trim()) fd.append("director_name", directorName.trim());
    if (directorBvn.trim()) fd.append("director_bvn", directorBvn.trim());
    if (trusteeName.trim()) fd.append("trustee_name", trusteeName.trim());
    if (trusteeBvn.trim()) fd.append("trustee_bvn", trusteeBvn.trim());
    if (scumlNumber.trim()) fd.append("scuml_number", scumlNumber.trim());
    if (partnerNamesRaw.trim()) {
      const names = partnerNamesRaw.split("\n").map((n) => n.trim()).filter(Boolean);
      fd.append("partner_names", JSON.stringify(names));
    }
    if (authorizedOfficerName.trim()) fd.append("authorized_officer_name", authorizedOfficerName.trim());
    if (authorizedOfficerBvn.trim()) fd.append("authorized_officer_bvn", authorizedOfficerBvn.trim());
    if (cacFile) fd.append("cac_certificate", cacFile);
    if (tinFile) fd.append("tin_document", tinFile);
    if (poaFile) fd.append("proof_of_address", poaFile);
    if (dirIdFile) fd.append("director_id", dirIdFile);
    if (trusteeIdFile) fd.append("trustee_id", trusteeIdFile);
    if (partnerIdFile) fd.append("partner_id", partnerIdFile);
    if (scumlFile) fd.append("scuml_letter", scumlFile);
    if (mdaFile) fd.append("mda_letter", mdaFile);
    if (authOfficerIdFile) fd.append("authorized_officer_id", authOfficerIdFile);

    submitMut.mutate(fd, {
      onSuccess: () => { setStep(1); setShowUpgradeForm(false); },
    });
  };

  // ── Verified: show read-only card + limits ────────────────
  if (kyc_status === "verified" && submission && !showUpgradeForm) {
    return (
      <div className="mx-auto max-w-2xl pb-16">
        <PageHeader
          title="Business Verification (KYC)"
          description="Your business has been verified. You have full access to FlowPilot."
        />
        <div className="mt-8 space-y-6">
          <VerifiedCard submission={submission} />
          <BusinessLimitsSection
            limit_info={data?.limit_info ?? null}
            onUpgrade={() => setShowUpgradeForm(true)}
          />
        </div>
      </div>
    );
  }

  // ── Pending: show status + allow resubmission ─────────────
  const isPending = kyc_status === "pending";

  // ── Step rendering ────────────────────────────────────────

  const renderStep = () => {
    switch (step) {
      // ── Step 1: Business Type ──────────────────────────────
      case 1:
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Choose the type that best describes your organisation. This determines which documents we collect.
            </p>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Business Type</label>
                <div className="relative">
                  <select
                    value={businessType}
                    onChange={(e) => setBusinessType(e.target.value as KycBusinessType | "")}
                    className="w-full appearance-none rounded-xl border border-border bg-background px-4 py-3 pr-10 text-sm font-medium text-foreground outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/20"
                  >
                    <option value="" disabled>Select your business type…</option>
                    {BUSINESS_TYPES.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                </div>
              </div>
              {businessType && (
                <div className="rounded-xl border border-brand/20 bg-brand/5 px-4 py-3">
                  <p className="text-sm text-muted-foreground">
                    {BUSINESS_TYPES.find((t) => t.value === businessType)?.description}
                  </p>
                </div>
              )}
            </div>
          </div>
        );

      // ── Step 2: Business Information ───────────────────────
      case 2:
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Provide the registered details for your {BUSINESS_TYPES.find((t) => t.value === businessType)?.label ?? "organisation"}.
            </p>
            <div className="grid gap-3 md:grid-cols-2">
              {/* RC / BN / MDA Code — all types except MDA have registration number */}
              {businessType !== "mda" && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">
                    {businessType === "sole_proprietorship" ? "BN Number" : "RC / Registration Number"}
                  </label>
                  <Input
                    value={registrationNumber}
                    onChange={(e) => setRegistrationNumber(e.target.value)}
                    placeholder={businessType === "sole_proprietorship" ? "BN 1234567" : "RC 123456"}
                    className="h-10 rounded-xl"
                  />
                </div>
              )}

              {/* TIN — required for LLC, Partnership; optional for others */}
              {businessType !== "mda" && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">
                    TIN Number
                    {(businessType === "limited_company" || businessType === "partnership") ? (
                      <span className="ml-1 text-destructive">*</span>
                    ) : (
                      <span className="ml-1 text-muted-foreground/60">(optional)</span>
                    )}
                  </label>
                  <Input
                    value={tinNumber}
                    onChange={(e) => setTinNumber(e.target.value)}
                    placeholder="e.g. 1234567-0001"
                    className="h-10 rounded-xl"
                  />
                </div>
              )}

              {/* LLC / Sole Prop: Director */}
              {(businessType === "limited_company" || businessType === "sole_proprietorship") && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">
                      Director Full Name <span className="text-destructive">*</span>
                    </label>
                    <Input
                      value={directorName}
                      onChange={(e) => setDirectorName(e.target.value)}
                      placeholder="e.g. Adaeze Okonkwo"
                      className="h-10 rounded-xl"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">Director BVN (optional)</label>
                    <Input
                      value={directorBvn}
                      onChange={(e) => setDirectorBvn(e.target.value.replace(/\D/g, "").slice(0, 11))}
                      placeholder="11-digit BVN"
                      inputMode="numeric"
                      className="h-10 rounded-xl"
                    />
                  </div>
                </>
              )}

              {/* NGO: Trustee */}
              {businessType === "ngo" && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">
                      Trustee Full Name <span className="text-destructive">*</span>
                    </label>
                    <Input
                      value={trusteeName}
                      onChange={(e) => setTrusteeName(e.target.value)}
                      placeholder="e.g. Chukwuemeka Nwankwo"
                      className="h-10 rounded-xl"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">Trustee BVN (optional)</label>
                    <Input
                      value={trusteeBvn}
                      onChange={(e) => setTrusteeBvn(e.target.value.replace(/\D/g, "").slice(0, 11))}
                      placeholder="11-digit BVN"
                      inputMode="numeric"
                      className="h-10 rounded-xl"
                    />
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-xs font-semibold text-muted-foreground">SCUML Registration Number (optional)</label>
                    <Input
                      value={scumlNumber}
                      onChange={(e) => setScumlNumber(e.target.value)}
                      placeholder="SCUML-xxxxxxxx"
                      className="h-10 rounded-xl"
                    />
                  </div>
                </>
              )}

              {/* Partnership: Partner names */}
              {businessType === "partnership" && (
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-semibold text-muted-foreground">
                    Partner Names <span className="text-destructive">*</span>
                  </label>
                  <textarea
                    value={partnerNamesRaw}
                    onChange={(e) => setPartnerNamesRaw(e.target.value)}
                    placeholder={"Enter each partner's full name on a new line:\nOlumide Adeyemi\nNkechi Obi"}
                    className="w-full min-h-20 rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground resize-none outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                  />
                  <p className="text-xs text-muted-foreground/60">One partner per line.</p>
                </div>
              )}

              {/* MDA: Authorized Officer */}
              {businessType === "mda" && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">
                      Authorized Officer Name <span className="text-destructive">*</span>
                    </label>
                    <Input
                      value={authorizedOfficerName}
                      onChange={(e) => setAuthorizedOfficerName(e.target.value)}
                      placeholder="e.g. Benson Kachi"
                      className="h-10 rounded-xl"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground">Officer BVN (optional)</label>
                    <Input
                      value={authorizedOfficerBvn}
                      onChange={(e) => setAuthorizedOfficerBvn(e.target.value.replace(/\D/g, "").slice(0, 11))}
                      placeholder="11-digit BVN"
                      inputMode="numeric"
                      className="h-10 rounded-xl"
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        );

      // ── Step 3: Documents ──────────────────────────────────
      case 3:
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Upload the required documents. PDF, JPG, or PNG only. Max 10 MB per file.
            </p>
            <div className="space-y-3">
              {/* CAC Certificate — required for all except MDA */}
              {businessType !== "mda" && (
                <DocUploadField
                  label={
                    businessType === "sole_proprietorship"
                      ? "Business Name (BN) Registration Form"
                      : businessType === "partnership"
                      ? "Partnership Deed / CAC Certificate"
                      : "CAC Certificate of Incorporation"
                  }
                  description="Official registration certificate issued by the Corporate Affairs Commission."
                  required
                  fileRef={cacRef}
                  file={cacFile}
                  onChange={setCacFile}
                />
              )}

              {/* MDA Letter — required for MDA */}
              {businessType === "mda" && (
                <DocUploadField
                  label="MDA Authorization Letter"
                  description="Official letter from the Ministry, Department, or Agency authorising financial operations."
                  required
                  fileRef={mdaRef}
                  file={mdaFile}
                  onChange={setMdaFile}
                />
              )}

              {/* TIN Document — optional for LLC/Sole Prop/NGO, required for Partnership */}
              {businessType !== "mda" && (
                <DocUploadField
                  label="TIN Document"
                  description="FIRS-issued TIN certificate or official document showing your tax identification number."
                  required={businessType === "partnership"}
                  fileRef={tinRef}
                  file={tinFile}
                  onChange={setTinFile}
                />
              )}

              {/* Director / Owner ID — required for LLC, Sole Prop, MDA */}
              {(businessType === "limited_company" || businessType === "sole_proprietorship" || businessType === "mda") && (
                <DocUploadField
                  label={businessType === "mda" ? "Authorized Officer Government-Issued ID" : "Director / Owner Government-Issued ID"}
                  description="National ID card, international passport, or driver's licence."
                  required
                  fileRef={businessType === "mda" ? authOfficerIdRef : dirIdRef}
                  file={businessType === "mda" ? authOfficerIdFile : dirIdFile}
                  onChange={businessType === "mda" ? setAuthOfficerIdFile : setDirIdFile}
                />
              )}

              {/* Trustee ID — required for NGO */}
              {businessType === "ngo" && (
                <DocUploadField
                  label="Trustee Government-Issued ID"
                  description="National ID card, international passport, or driver's licence of the trustee."
                  required
                  fileRef={trusteeIdRef}
                  file={trusteeIdFile}
                  onChange={setTrusteeIdFile}
                />
              )}

              {/* Partner Representative ID — required for Partnership */}
              {businessType === "partnership" && (
                <DocUploadField
                  label="Partner Representative Government-Issued ID"
                  description="National ID card, international passport, or driver's licence of one partner."
                  required
                  fileRef={partnerIdRef}
                  file={partnerIdFile}
                  onChange={setPartnerIdFile}
                />
              )}

              {/* SCUML Letter — optional for NGO */}
              {businessType === "ngo" && (
                <DocUploadField
                  label="SCUML Registration Letter (optional)"
                  description="Special Control Unit Against Money Laundering registration letter, if available."
                  fileRef={scumlRef}
                  file={scumlFile}
                  onChange={setScumlFile}
                />
              )}

              {/* Proof of Address — optional for all */}
              <DocUploadField
                label="Proof of Business Address (optional)"
                description="Utility bill, bank statement, or government letter addressed to your registered business address."
                fileRef={poaRef}
                file={poaFile}
                onChange={setPoaFile}
              />
            </div>
          </div>
        );

      // ── Step 4: Review & Submit ────────────────────────────
      case 4: {
        const typeLabel = BUSINESS_TYPES.find((t) => t.value === businessType)?.label ?? businessType;
        const partnerList = partnerNamesRaw.split("\n").map((n) => n.trim()).filter(Boolean);
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Review your details before submitting. You can go back to make changes.
            </p>

            <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-3">
              <p className="text-xs font-black uppercase tracking-wider text-muted-foreground">Business Details</p>
              <div className="grid gap-2 sm:grid-cols-2 text-sm">
                <InfoRow label="Business Type" value={typeLabel ?? "—"} />
                {registrationNumber && <InfoRow label="Registration No." value={registrationNumber} />}
                {tinNumber && <InfoRow label="TIN" value={tinNumber} />}
                {directorName && <InfoRow label="Director" value={directorName} />}
                {trusteeName && <InfoRow label="Trustee" value={trusteeName} />}
                {scumlNumber && <InfoRow label="SCUML No." value={scumlNumber} />}
                {authorizedOfficerName && <InfoRow label="Authorized Officer" value={authorizedOfficerName} />}
                {partnerList.length > 0 && (
                  <InfoRow label="Partners" value={partnerList.join(", ")} className="sm:col-span-2" />
                )}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-3">
              <p className="text-xs font-black uppercase tracking-wider text-muted-foreground">Documents</p>
              <div className="grid gap-1.5 sm:grid-cols-2">
                {[
                  ["CAC / Registration", cacFile],
                  ["TIN Document", tinFile],
                  ["Director / Owner ID", dirIdFile],
                  ["Trustee ID", trusteeIdFile],
                  ["Partner ID", partnerIdFile],
                  ["SCUML Letter", scumlFile],
                  ["MDA Letter", mdaFile],
                  ["Authorized Officer ID", authOfficerIdFile],
                  ["Proof of Address", poaFile],
                ].filter(([, f]) => f).map(([label, f]) => (
                  <div key={label as string} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                    <span className="text-foreground">{label as string}</span>
                    <span className="text-xs text-muted-foreground truncate max-w-[100px]">{(f as File).name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      }

      default:
        return null;
    }
  };

  const canProceedStep1 = !!businessType;
  const canProceedStep2 = (() => {
    if (!businessType) return false;
    if (businessType === "limited_company" || businessType === "sole_proprietorship") return !!directorName.trim();
    if (businessType === "ngo") return !!trusteeName.trim();
    if (businessType === "partnership") return !!partnerNamesRaw.trim();
    if (businessType === "mda") return !!authorizedOfficerName.trim();
    return true;
  })();
  const canProceedStep3 = (() => {
    if (!businessType) return false;
    if (businessType === "mda") return !!mdaFile && !!authOfficerIdFile;
    if (businessType === "ngo") return !!cacFile && !!trusteeIdFile;
    if (businessType === "partnership") return !!cacFile && !!tinFile && !!partnerIdFile;
    return !!cacFile && !!dirIdFile; // LLC, sole_prop
  })();

  const canProceed = step === 1 ? canProceedStep1 : step === 2 ? canProceedStep2 : step === 3 ? canProceedStep3 : true;

  return (
    <div className="mx-auto max-w-2xl pb-16">
      <PageHeader
        title={showUpgradeForm ? "Upgrade Your KYC Level" : "Business Verification (KYC)"}
        description={showUpgradeForm ? "Submit additional documents to unlock higher payment limits." : "Submit your business documents to unlock full platform access."}
      />

      <div className="mt-8 space-y-6">
        {/* Upgrade mode — back button */}
        {showUpgradeForm && (
          <button
            type="button"
            onClick={() => setShowUpgradeForm(false)}
            className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            ← Back to verification details
          </button>
        )}

        {/* Pending status card */}
        {isPending && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 flex items-start gap-3">
            <Clock className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-800">Verification in Progress</p>
              <p className="mt-1 text-sm text-amber-700">
                We've received your documents and are reviewing them. You'll be notified within 10 minutes.
                You can resubmit below if you need to update any documents.
              </p>
            </div>
          </div>
        )}

        {/* Not-submitted info banner */}
        {kyc_status === "not_submitted" && (
          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
            <p className="text-sm text-blue-800">
              To create payouts, we need to verify your business identity.
              Complete the steps below. Review typically completes within 10 minutes.
            </p>
          </div>
        )}

        {/* Step form card */}
        <div className="rounded-2xl border border-border/60 bg-white p-6 space-y-6">
          {/* Step indicator + label */}
          <div className="space-y-3">
            <StepIndicator current={step} total={4} />
            <div>
              <p className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                Step {step} of 4
              </p>
              <h3 className="text-base font-black text-foreground mt-0.5">
                {step === 1 ? "Business Type" : step === 2 ? "Business Information" : step === 3 ? "Documents" : "Review & Submit"}
              </h3>
            </div>
          </div>

          {/* Step content */}
          {renderStep()}

          {/* Navigation buttons */}
          <div className="flex items-center justify-between pt-2 border-t border-border/40">
            <Button
              variant="outline"
              className="rounded-full"
              onClick={() => setStep((s) => Math.max(1, s - 1))}
              disabled={step === 1}
            >
              Back
            </Button>

            {step < 4 ? (
              <Button
                className="rounded-full bg-brand px-8 text-white hover:opacity-90 gap-1.5"
                onClick={() => setStep((s) => s + 1)}
                disabled={!canProceed}
              >
                Continue
                <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                className="rounded-full bg-brand px-8 text-white shadow-sm hover:opacity-90"
                onClick={handleSubmit}
                disabled={submitMut.isPending}
              >
                {submitMut.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isPending ? "Resubmit Documents" : "Submit for Verification"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
