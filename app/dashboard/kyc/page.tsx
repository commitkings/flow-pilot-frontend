"use client";

import { useRef, useState } from "react";
import { useKycStatus, useSubmitKyc } from "@/hooks/use-kyc-queries";
import { useOrgProfile } from "@/hooks/use-settings-queries";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { KycBusinessType } from "@/lib/api-types";
import { IndividualKycPage } from "@/components/kyc/IndividualKycPage";
import type { KycLimitInfo } from "@/lib/api-types";
import {
  AlertCircle,
  Building2,
  CheckCircle2,
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
  X,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type BusinessTypeOption = {
  value: KycBusinessType;
  label: string;
  description: string;
  icon: string;
};

const BUSINESS_TYPES: BusinessTypeOption[] = [
  {
    value: "limited_company",
    label: "Limited Liability Company",
    description: "Registered with CAC as a private or public limited company (RC number)",
    icon: "🏢",
  },
  {
    value: "sole_proprietorship",
    label: "Sole Proprietorship",
    description: "Business Name registered with CAC, owned by one individual",
    icon: "👤",
  },
  {
    value: "partnership",
    label: "Partnership",
    description: "Two or more individuals operating under a registered business name",
    icon: "🤝",
  },
  {
    value: "ngo",
    label: "NGO / Non-Profit Organisation",
    description: "Registered charity, foundation, or non-governmental organisation",
    icon: "🌱",
  },
  {
    value: "mda",
    label: "Government Agency / MDA",
    description: "Ministry, Department, Agency, or government-owned enterprise",
    icon: "🏛️",
  },
];

const STEPS = [
  { id: 1, label: "Business Type",    short: "Type"     },
  { id: 2, label: "Business Details", short: "Details"  },
  { id: 3, label: "Director / Owner", short: "Director" },
  { id: 4, label: "Documents",        short: "Docs"     },
  { id: 5, label: "Review",           short: "Review"   },
];

const BUSINESS_TIERS = [
  { level: 1, label: "Level 1", requirements: "CAC + ID", monthly: 1_500_000, single: 300_000, wallet: 3_000_000 },
  { level: 2, label: "Level 2", requirements: "L1 + TIN + Address", monthly: 10_000_000, single: 2_000_000, wallet: 20_000_000 },
  { level: 3, label: "Level 3", requirements: "Full compliance", monthly: 50_000_000, single: 5_000_000, wallet: 100_000_000 },
];

function fmt(n: number) {
  return `₦${(n / 1_000_000).toFixed(0)}M`;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Field({
  label,
  hint,
  required,
  children,
  className,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label className="flex items-center gap-1 text-sm font-semibold text-foreground">
        {label}
        {required && <span className="text-destructive">*</span>}
        {!required && <span className="text-xs font-normal text-muted-foreground/60">(optional)</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
  inputMode,
  maxLength,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  maxLength?: number;
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      inputMode={inputMode}
      maxLength={maxLength}
      className="h-11 w-full rounded-xl border border-border bg-background px-4 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-brand focus:ring-2 focus:ring-brand/10"
    />
  );
}

function DocUpload({
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
    <div
      className={cn(
        "group relative rounded-xl border border-dashed p-4 transition-all",
        file
          ? "border-border bg-muted/20"
          : "border-border/60 bg-background hover:border-brand/40 hover:bg-brand/5 cursor-pointer",      )}
      onClick={() => !file && fileRef.current?.click()}
    >
      <input
        ref={fileRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        className="hidden"
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
      />

      {file ? (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
            <FileText className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
            <p className="text-xs text-muted-foreground">              {(file.size / 1024).toFixed(0)} KB · Uploaded
            </p>
          </div>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onChange(null); }}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-colors hover:border-destructive/40 hover:bg-destructive/5 hover:text-destructive"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-dashed border-border/80 bg-background transition-colors group-hover:border-brand/40">
            <Upload className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-brand" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-semibold text-foreground">{label}</p>
              {required && <span className="text-destructive text-sm">*</span>}
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
            <p className="mt-1.5 text-xs text-brand font-medium">Click to upload · PDF, JPG, PNG · Max 10 MB</p>
          </div>
        </div>
      )}
    </div>
  );
}

function DocLink({ label, url }: { label: string; url: string | null | undefined }) {
  if (!url) return (
    <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/30 px-4 py-3">
      <div className="h-8 w-8 shrink-0 rounded-lg bg-muted flex items-center justify-center">
        <FileText className="h-4 w-4 text-muted-foreground/40" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p className="text-xs text-muted-foreground/60">Not uploaded</p>
      </div>
    </div>
  );
  return (
    <a href={url} target="_blank" rel="noopener noreferrer"
      className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/20 px-4 py-3 transition-colors hover:bg-muted/40">
      <div className="h-8 w-8 shrink-0 rounded-lg bg-muted flex items-center justify-center">
        <FileText className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">Uploaded · Click to view</p>      </div>
      <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
    </a>
  );
}

function InfoRow({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={cn("space-y-1", className)}>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}

// ── Sidebar ───────────────────────────────────────────────────────────────────

function Sidebar({ step, businessType }: { step: number; businessType: KycBusinessType | "" }) {
  return (
    <div className="space-y-4">
      {/* Steps */}
      <div className="rounded-xl border border-border/60 bg-card p-5">
        <p className="mb-4 text-xs font-semibold text-muted-foreground">Progress</p>
        <ol>
          {STEPS.map((s, i) => {
            const done = s.id < step;
            const active = s.id === step;
            return (
              <li key={s.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all",
                    done   ? "bg-brand/80 text-white" :
                    active ? "bg-brand text-white ring-4 ring-brand/15" :
                             "bg-muted text-muted-foreground"
                  )}>
                    {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : s.id}
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={cn("my-1 w-px min-h-3.5 flex-1", done ? "bg-brand/30" : "bg-border/60")} />
                  )}
                </div>
                <div className={cn("flex-1 min-w-0", i < STEPS.length - 1 ? "pb-3" : "")}>
                  <p className={cn(
                    "text-sm font-medium leading-7",
                    active ? "text-foreground" : done ? "text-foreground/60" : "text-muted-foreground"
                  )}>{s.label}</p>
                </div>              </li>
            );
          })}
        </ol>
      </div>

      {/* What you need */}
      {businessType && step <= 4 && (
        <div className="rounded-xl border border-border/60 bg-card p-5 space-y-3">
          <p className="text-xs font-semibold text-muted-foreground">What you need</p>          <ul className="space-y-2">
            {[
              businessType !== "mda" && "RC / BN Registration Number",
              businessType !== "mda" && "Tax Identification Number (TIN)",
              (businessType === "limited_company" || businessType === "sole_proprietorship") && "Director BVN (11 digits)",
              businessType === "ngo" && "Trustee BVN (11 digits)",
              businessType === "mda" && "Officer BVN (11 digits)",
              businessType !== "mda" && "CAC Certificate (PDF/Image)",
              (businessType === "limited_company" || businessType === "sole_proprietorship" || businessType === "mda") && "Director/Officer Government ID",
              businessType === "ngo" && "Trustee Government ID",
              businessType === "partnership" && "Partner Representative ID",
            ].filter(Boolean).map((item) => (
              <li key={item as string} className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="h-1.5 w-1.5 rounded-full bg-brand/50 shrink-0" />                {item as string}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Security note */}
      <div className="rounded-xl border border-border/60 bg-background p-4 flex items-start gap-3">
        <ShieldCheck className="h-4 w-4 text-muted-foreground/60 shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          Documents are encrypted and stored securely. Used only for identity verification per CBN regulations.        </p>
      </div>
    </div>
  );
}

// ── Verified state ────────────────────────────────────────────────────────────

function VerifiedPage({
  submission,
  limit_info,
  onUpgrade,
}: {
  submission: NonNullable<import("@/lib/api-types").KycStatusResponse["submission"]>;
  limit_info: KycLimitInfo | null;
  onUpgrade: () => void;
}) {
  const typeLabel = BUSINESS_TYPES.find((t) => t.value === submission.business_type)?.label ?? submission.business_type ?? "—";
  let partnerList: string[] = [];
  if (submission.partner_names) {
    try { partnerList = JSON.parse(submission.partner_names); } catch { partnerList = [submission.partner_names]; }
  }
  const currentLevel = limit_info?.kyc_level ?? 1;
  const atMax = limit_info?.at_max_level ?? false;

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Main content */}
      <div className="space-y-5 lg:col-span-2">
        {/* Verified banner */}
        <div className="flex items-start gap-4 rounded-2xl border border-blue-200/70 bg-blue-50/40 p-5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100/80">
            <ShieldCheck className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-blue-900">Business Verified</p>
            <p className="mt-0.5 text-sm text-blue-700/80">
              Your business identity has been confirmed. You have full access to FlowPilot&apos;s payout capabilities.
            </p>
            {submission.verified_at && (
              <p className="mt-2 text-xs text-blue-500">                Verified {new Date(submission.verified_at).toLocaleDateString("en-NG", { dateStyle: "long" })}
              </p>
            )}
          </div>
        </div>

        {/* Business info */}
        <div className="rounded-2xl border border-border/60 bg-card shadow-sm">
          <div className="flex items-center gap-3 border-b border-border/60 px-6 py-4">
            <Building2 className="h-4 w-4 text-brand" />
            <p className="text-sm font-black uppercase tracking-wider text-muted-foreground">Business Information</p>
          </div>
          <div className="grid gap-5 p-6 sm:grid-cols-2">
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
        <div className="rounded-2xl border border-border/60 bg-card shadow-sm">
          <div className="flex items-center gap-3 border-b border-border/60 px-6 py-4">
            <FileText className="h-4 w-4 text-brand" />
            <p className="text-sm font-black uppercase tracking-wider text-muted-foreground">Submitted Documents</p>
          </div>
          <div className="grid gap-3 p-6 sm:grid-cols-2">
            {submission.has_cac_certificate && <DocLink label="CAC Certificate" url={submission.cac_certificate_url} />}
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

      {/* Limits sidebar */}
      <div className="space-y-4">
        {limit_info && currentLevel > 0 && (
          <div className="rounded-2xl border border-border/60 bg-card p-5 space-y-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-brand" />              <p className="text-sm font-bold text-foreground">Level {currentLevel} Limits</p>
            </div>
            <div className="space-y-3">
              {[
                ["Monthly Payout", fmt(limit_info.monthly_limit)],
                ["Per Payment", fmt(limit_info.single_limit)],
                ["Wallet Cap", fmt(limit_info.wallet_limit)],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">{k}</p>
                  <p className="text-sm font-black text-foreground">{v}</p>
                </div>
              ))}
            </div>
            {atMax && (
              <div className="flex items-start gap-2 rounded-xl border border-brand/20 bg-brand/5 px-3 py-2">
                <Mail className="h-3.5 w-3.5 text-brand mt-0.5 shrink-0" />
                <p className="text-xs text-muted-foreground">
                  At maximum level. For higher limits email{" "}
                  <a href={`mailto:${limit_info.support_email}`} className="font-semibold text-brand underline">{limit_info.support_email}</a>.
                </p>
              </div>
            )}
          </div>
        )}

        {!atMax && (
          <div className="rounded-2xl border border-border/60 bg-card p-5 space-y-3 shadow-sm">
            <p className="text-xs font-black uppercase tracking-wider text-muted-foreground">Upgrade limits</p>
            {BUSINESS_TIERS.map((tier) => {
              const done = currentLevel >= tier.level;
              const next = tier.level === currentLevel + 1;
              return (
                <div key={tier.level} className={cn(
                  "rounded-xl border p-3 space-y-2",
                  done ? "border-border/60 bg-muted/20" :                  next ? "border-brand/30 bg-brand/5" :
                  "border-border bg-muted/20 opacity-50"
                )}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-black",
                        done ? "bg-brand/70 text-white" : next ? "bg-brand text-white" : "bg-muted text-muted-foreground"                      )}>
                        {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : tier.level > currentLevel + 1 ? <Lock className="h-3 w-3" /> : tier.level}
                      </div>
                      <p className="text-xs font-bold text-foreground">{tier.label}</p>
                    </div>
                    {next && (
                      <Button size="sm" className="h-6 rounded-full px-3 text-[10px] bg-brand text-white hover:opacity-90" onClick={onUpgrade}>
                        Upgrade
                      </Button>
                    )}
                    {done && <span className="text-[10px] font-bold text-muted-foreground">Active</span>}                  </div>
                  <div className="flex gap-3 pl-8 text-[10px] text-muted-foreground">
                    <span>{fmt(tier.monthly)}/mo</span>
                    <span>{fmt(tier.single)}/txn</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main business KYC form ────────────────────────────────────────────────────

function BusinessKycForm({
  kyc_status,
  submission,
  limit_info,
}: {
  kyc_status: string;
  submission: import("@/lib/api-types").KycStatusResponse["submission"] | undefined;
  limit_info: KycLimitInfo | null;
}) {
  const submitMut = useSubmitKyc();
  const [showUpgradeForm, setShowUpgradeForm] = useState(false);
  const [step, setStep] = useState(1);
  const [businessType, setBusinessType] = useState<KycBusinessType | "">("");

  // Step 2: Business details
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [tinNumber, setTinNumber] = useState("");

  // Step 3: Director / Owner
  const [directorName, setDirectorName] = useState("");
  const [directorBvn, setDirectorBvn] = useState("");
  const [trusteeName, setTrusteeName] = useState("");
  const [trusteeBvn, setTrusteeBvn] = useState("");
  const [scumlNumber, setScumlNumber] = useState("");
  const [partnerNamesRaw, setPartnerNamesRaw] = useState("");
  const [authorizedOfficerName, setAuthorizedOfficerName] = useState("");
  const [authorizedOfficerBvn, setAuthorizedOfficerBvn] = useState("");

  // Step 4: Documents
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

  const isPending = kyc_status === "pending";

  // Step 3 label changes based on business type
  const step3Label =
    businessType === "ngo" ? "Trustee Details" :
    businessType === "mda" ? "Authorized Officer" :
    businessType === "partnership" ? "Partners" :
    "Director Details";

  const activeSteps = [...STEPS];
  activeSteps[2] = { ...activeSteps[2], label: step3Label, short: step3Label.split(" ")[0] };

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

  // ── Verified view ───────────────────────────────────────────────────────────
  if (kyc_status === "verified" && submission && !showUpgradeForm) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">Business Verification</h1>
          <p className="mt-1 text-sm text-muted-foreground">Your business is verified and in good standing.</p>
        </div>
        <VerifiedPage submission={submission} limit_info={limit_info} onUpgrade={() => setShowUpgradeForm(true)} />
      </div>
    );
  }

  // ── Form view ───────────────────────────────────────────────────────────────
  const canProceed = (() => {
    if (step === 1) return !!businessType;
    if (step === 2) {
      if (!businessType) return false;
      if (businessType === "mda") return true; // MDA has no reg/TIN in step 2
      return !!registrationNumber.trim() && !!tinNumber.trim();
    }
    if (step === 3) {
      if (!businessType) return false;
      if (businessType === "limited_company" || businessType === "sole_proprietorship")
        return !!directorName.trim() && directorBvn.trim().length === 11;
      if (businessType === "ngo")
        return !!trusteeName.trim() && trusteeBvn.trim().length === 11;
      if (businessType === "partnership")
        return !!partnerNamesRaw.trim();
      if (businessType === "mda")
        return !!authorizedOfficerName.trim() && authorizedOfficerBvn.trim().length === 11;
    }
    if (step === 4) {
      if (businessType === "mda") return !!mdaFile && !!authOfficerIdFile;
      if (businessType === "ngo") return !!cacFile && !!tinFile && !!trusteeIdFile;
      if (businessType === "partnership") return !!cacFile && !!tinFile && !!partnerIdFile;
      return !!cacFile && !!tinFile && !!dirIdFile;
    }
    return true;
  })();

  const renderStep = () => {
    // ── Step 1: Business Type ────────────────────────────────────────────────
    if (step === 1) return (
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-black text-foreground">What type of business are you registering?</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            This determines which documents and information we collect for verification.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-1">
          {BUSINESS_TYPES.map((opt) => (
            <label
              key={opt.value}
              className={cn(
                "flex cursor-pointer items-start gap-4 rounded-2xl border-2 p-4 transition-all",
                businessType === opt.value
                  ? "border-brand bg-brand/5 dark:bg-brand/10"
                  : "border-border/60 hover:border-brand/30 hover:bg-muted/30",
              )}
            >
              <input
                type="radio"
                name="business_type"
                value={opt.value}
                checked={businessType === opt.value}
                onChange={() => setBusinessType(opt.value)}
                className="mt-1 accent-brand"
              />
              <span className="text-xl leading-none mt-0.5">{opt.icon}</span>
              <div className="min-w-0 flex-1">
                <p className={cn(
                  "text-sm font-bold",
                  businessType === opt.value ? "text-brand" : "text-foreground"
                )}>{opt.label}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{opt.description}</p>
              </div>
              {businessType === opt.value && (
                <CheckCircle2 className="h-5 w-5 shrink-0 text-brand mt-0.5" />
              )}
            </label>
          ))}
        </div>
      </div>
    );

    // ── Step 2: Business Details (Reg + TIN) ─────────────────────────────────
    if (step === 2) return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-black text-foreground">Business Registration Details</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Enter your{" "}
            {BUSINESS_TYPES.find((t) => t.value === businessType)?.label}'s official registration information.
          </p>
        </div>

        {businessType === "mda" ? (
          <div className="rounded-xl border border-border/60 bg-muted/20 p-4 flex items-start gap-3">
            <AlertCircle className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-foreground/90">Government Agency / MDA</p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Government agencies are not required to provide a CAC registration number or TIN. You&apos;ll provide your authorized officer details in the next step.
              </p>
            </div>          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              label={businessType === "sole_proprietorship" ? "BN Number" : "RC / Registration Number"}
              required
              hint="As it appears on your CAC Certificate"
            >
              <TextInput
                value={registrationNumber}
                onChange={setRegistrationNumber}
                placeholder={businessType === "sole_proprietorship" ? "e.g. BN 1234567" : "e.g. RC 123456"}
              />
            </Field>

            <Field
              label="Tax Identification Number (TIN)"
              required
              hint="Issued by the Federal Inland Revenue Service (FIRS)"
            >
              <TextInput
                value={tinNumber}
                onChange={setTinNumber}
                placeholder="e.g. 12345678-0001"
              />
            </Field>
          </div>
        )}
      </div>
    );

    // ── Step 3: Director / Trustee / Partners / Officer ──────────────────────
    if (step === 3) {
      if (businessType === "limited_company" || businessType === "sole_proprietorship") return (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-black text-foreground">Director Information</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Provide the details of the principal director or business owner.
              The BVN is required for identity verification.
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Director Full Name" required hint="As it appears on their government-issued ID">
              <TextInput
                value={directorName}
                onChange={setDirectorName}
                placeholder="e.g. Adaeze Okonkwo"
              />
            </Field>
            <Field
              label="Director BVN"
              required
              hint="11-digit Bank Verification Number"
            >
              <TextInput
                value={directorBvn}
                onChange={(v) => setDirectorBvn(v.replace(/\D/g, "").slice(0, 11))}
                placeholder="00000000000"
                inputMode="numeric"
                maxLength={11}
              />
            </Field>
          </div>
          {directorBvn.length > 0 && directorBvn.length < 11 && (
            <p className="text-xs text-amber-600 flex items-center gap-1">
              <AlertCircle className="h-3.5 w-3.5" />
              BVN must be exactly 11 digits ({directorBvn.length}/11)
            </p>
          )}
        </div>
      );

      if (businessType === "ngo") return (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-black text-foreground">Trustee Information</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Provide the details of the registered trustee. BVN is required for identity verification.
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Trustee Full Name" required hint="As it appears on their government-issued ID">
              <TextInput value={trusteeName} onChange={setTrusteeName} placeholder="e.g. Chukwuemeka Nwankwo" />
            </Field>
            <Field label="Trustee BVN" required hint="11-digit Bank Verification Number">
              <TextInput
                value={trusteeBvn}
                onChange={(v) => setTrusteeBvn(v.replace(/\D/g, "").slice(0, 11))}
                placeholder="00000000000"
                inputMode="numeric"
                maxLength={11}
              />
            </Field>
          </div>
          {trusteeBvn.length > 0 && trusteeBvn.length < 11 && (
            <p className="text-xs text-amber-600 flex items-center gap-1">
              <AlertCircle className="h-3.5 w-3.5" />
              BVN must be exactly 11 digits ({trusteeBvn.length}/11)
            </p>
          )}
          <Field label="SCUML Registration Number" hint="Special Control Unit Against Money Laundering registration, if available">
            <TextInput value={scumlNumber} onChange={setScumlNumber} placeholder="SCUML-xxxxxxxx" />
          </Field>
        </div>
      );

      if (businessType === "partnership") return (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-black text-foreground">Partner Names</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              List all partners in your registered partnership, one per line.
            </p>
          </div>
          <Field label="Partner Names" required hint="One full name per line">
            <textarea
              value={partnerNamesRaw}
              onChange={(e) => setPartnerNamesRaw(e.target.value)}
              placeholder={"Olumide Adeyemi\nNkechi Obi\nEmeka Igwe"}
              rows={5}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground outline-none resize-none transition-all placeholder:text-muted-foreground focus:border-brand focus:ring-2 focus:ring-brand/10"
            />
          </Field>
        </div>
      );

      if (businessType === "mda") return (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-black text-foreground">Authorized Officer Details</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Provide details of the officer authorized to conduct financial operations on behalf of the agency.
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Officer Full Name" required hint="As it appears on their government-issued ID">
              <TextInput value={authorizedOfficerName} onChange={setAuthorizedOfficerName} placeholder="e.g. Benson Kachi" />
            </Field>
            <Field label="Officer BVN" required hint="11-digit Bank Verification Number">
              <TextInput
                value={authorizedOfficerBvn}
                onChange={(v) => setAuthorizedOfficerBvn(v.replace(/\D/g, "").slice(0, 11))}
                placeholder="00000000000"
                inputMode="numeric"
                maxLength={11}
              />
            </Field>
          </div>
          {authorizedOfficerBvn.length > 0 && authorizedOfficerBvn.length < 11 && (
            <p className="text-xs text-amber-600 flex items-center gap-1">
              <AlertCircle className="h-3.5 w-3.5" />
              BVN must be exactly 11 digits ({authorizedOfficerBvn.length}/11)
            </p>
          )}
        </div>
      );

      return null;
    }

    // ── Step 4: Documents ────────────────────────────────────────────────────
    if (step === 4) return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-black text-foreground">Upload Documents</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Upload clear, legible copies. PDF, JPG, or PNG only — max 10 MB each.
          </p>
        </div>
        <div className="space-y-4">
          {businessType !== "mda" && (
            <DocUpload
              label={
                businessType === "sole_proprietorship" ? "Business Name (BN) Registration Form" :
                businessType === "partnership" ? "Partnership Deed / CAC Certificate" :
                "CAC Certificate of Incorporation"
              }
              description="Official registration document issued by the Corporate Affairs Commission."
              required
              fileRef={cacRef}
              file={cacFile}
              onChange={setCacFile}
            />
          )}

          {businessType === "mda" && (
            <DocUpload
              label="MDA Authorization Letter"
              description="Official letter from the Ministry, Department, or Agency authorising financial operations."
              required
              fileRef={mdaRef}
              file={mdaFile}
              onChange={setMdaFile}
            />
          )}

          {businessType !== "mda" && (
            <DocUpload
              label="TIN Certificate / Document"
              description="FIRS-issued TIN certificate or official document showing your Tax Identification Number."
              required
              fileRef={tinRef}
              file={tinFile}
              onChange={setTinFile}
            />
          )}

          {(businessType === "limited_company" || businessType === "sole_proprietorship") && (
            <DocUpload
              label="Director / Owner Government-Issued ID"
              description="National ID card, international passport, or driver's licence — must be valid and not expired."
              required
              fileRef={dirIdRef}
              file={dirIdFile}
              onChange={setDirIdFile}
            />
          )}

          {businessType === "ngo" && (
            <DocUpload
              label="Trustee Government-Issued ID"
              description="National ID card, international passport, or driver's licence of the registered trustee."
              required
              fileRef={trusteeIdRef}
              file={trusteeIdFile}
              onChange={setTrusteeIdFile}
            />
          )}

          {businessType === "partnership" && (
            <DocUpload
              label="Partner Representative Government-Issued ID"
              description="National ID card, international passport, or driver's licence of one authorised partner."
              required
              fileRef={partnerIdRef}
              file={partnerIdFile}
              onChange={setPartnerIdFile}
            />
          )}

          {businessType === "mda" && (
            <DocUpload
              label="Authorized Officer Government-Issued ID"
              description="National ID card, international passport, or driver's licence of the authorized officer."
              required
              fileRef={authOfficerIdRef}
              file={authOfficerIdFile}
              onChange={setAuthOfficerIdFile}
            />
          )}

          {businessType === "ngo" && (
            <DocUpload
              label="SCUML Registration Letter"
              description="Special Control Unit Against Money Laundering registration letter, if available."
              fileRef={scumlRef}
              file={scumlFile}
              onChange={setScumlFile}
            />
          )}

          <DocUpload
            label="Proof of Business Address"
            description="Utility bill, bank statement, or government letter addressed to your registered business address."
            fileRef={poaRef}
            file={poaFile}
            onChange={setPoaFile}
          />
        </div>
      </div>
    );

    // ── Step 5: Review & Submit ──────────────────────────────────────────────
    if (step === 5) {
      const typeLabel = BUSINESS_TYPES.find((t) => t.value === businessType)?.label ?? businessType;
      const partnerList = partnerNamesRaw.split("\n").map((n) => n.trim()).filter(Boolean);
      const uploadedDocs = [
        cacFile && "CAC / Registration Certificate",
        tinFile && "TIN Document",
        dirIdFile && "Director / Owner ID",
        trusteeIdFile && "Trustee ID",
        partnerIdFile && "Partner Representative ID",
        mdaFile && "MDA Authorization Letter",
        authOfficerIdFile && "Authorized Officer ID",
        scumlFile && "SCUML Letter",
        poaFile && "Proof of Address",
      ].filter(Boolean) as string[];

      return (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-black text-foreground">Review & Submit</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Double-check everything before submitting. Incorrect information may delay verification.
            </p>
          </div>

          <div className="rounded-2xl border border-border/60 bg-muted/20 overflow-hidden">
            <div className="border-b border-border/60 px-5 py-3">
              <p className="text-xs font-black uppercase tracking-wider text-muted-foreground">Business Details</p>
            </div>
            <div className="grid gap-4 p-5 sm:grid-cols-2">
              <InfoRow label="Business Type" value={typeLabel ?? "—"} />
              {registrationNumber && <InfoRow label="Registration Number" value={registrationNumber} />}
              {tinNumber && <InfoRow label="TIN" value={tinNumber} />}
              {directorName && <InfoRow label="Director" value={directorName} />}
              {directorBvn && <InfoRow label="Director BVN" value={`•••• ${directorBvn.slice(-4)}`} />}
              {trusteeName && <InfoRow label="Trustee" value={trusteeName} />}
              {trusteeBvn && <InfoRow label="Trustee BVN" value={`•••• ${trusteeBvn.slice(-4)}`} />}
              {scumlNumber && <InfoRow label="SCUML Number" value={scumlNumber} />}
              {authorizedOfficerName && <InfoRow label="Authorized Officer" value={authorizedOfficerName} />}
              {authorizedOfficerBvn && <InfoRow label="Officer BVN" value={`•••• ${authorizedOfficerBvn.slice(-4)}`} />}
              {partnerList.length > 0 && (
                <InfoRow label="Partners" value={partnerList.join(", ")} className="sm:col-span-2" />
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-border/60 bg-muted/20 overflow-hidden">
            <div className="border-b border-border/60 px-5 py-3">
              <p className="text-xs font-black uppercase tracking-wider text-muted-foreground">
                Documents ({uploadedDocs.length} uploaded)
              </p>
            </div>
            <div className="p-5">
              {uploadedDocs.length === 0 ? (
                <p className="text-sm text-muted-foreground">No documents uploaded.</p>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  {uploadedDocs.map((doc) => (
                    <div key={doc} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-brand/70 shrink-0" />                      <span className="text-foreground font-medium">{doc}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-border/60 bg-muted/20 p-4 flex items-start gap-3">
            <AlertCircle className="h-4 w-4 text-muted-foreground/60 shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground">              By submitting, you confirm that all provided information is accurate and that the uploaded documents are genuine. Providing false information is a violation of our Terms of Service.
            </p>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-foreground">
          {showUpgradeForm ? "Upgrade KYC Level" : "Business Verification"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {showUpgradeForm
            ? "Submit additional documents to unlock higher payment limits."
            : "Complete verification to unlock payouts and higher transaction limits."}
        </p>
      </div>

      {showUpgradeForm && (
        <button
          type="button"
          onClick={() => setShowUpgradeForm(false)}
          className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Back to verification details
        </button>
      )}

      {isPending && (
        <div className="flex items-start gap-3 rounded-xl border border-border/60 bg-muted/20 p-4">
          <Clock className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-foreground">Verification in Progress</p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              We&apos;ve received your documents. Review typically completes within 10 minutes. You can resubmit if needed.            </p>
          </div>
        </div>
      )}

      {kyc_status === "not_submitted" && (
        <div className="flex items-start gap-3 rounded-xl border border-border/60 bg-muted/20 p-4">
          <AlertCircle className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
          <p className="text-sm text-foreground/80">            To create payouts, we need to verify your business identity. Complete the steps below — review typically completes within 10 minutes.
          </p>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        {/* Sidebar */}
        <div className="lg:sticky lg:top-6 lg:self-start">
          <Sidebar step={step} businessType={businessType} />
        </div>

        {/* Form card */}
        <div className="rounded-2xl border border-border/60 bg-card shadow-sm overflow-hidden">
          {/* Card body */}
          <div className="p-6 sm:p-8">
            {renderStep()}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between border-t border-border/60 bg-background px-6 py-4 sm:px-8">            <Button
              variant="outline"
              className="rounded-full"
              onClick={() => setStep((s) => Math.max(1, s - 1))}
              disabled={step === 1}
            >
              Back
            </Button>

            {step < 5 ? (
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

// ── Page entry ────────────────────────────────────────────────────────────────

export default function KycPage() {
  const { data, isLoading } = useKycStatus();
  const { data: orgProfile, isLoading: orgLoading } = useOrgProfile();

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
        <IndividualKycPage
          kyc_status={data?.kyc_status ?? "not_submitted"}
          kyc_level={kycLevel}
          limit_info={data?.limit_info ?? null}
          individual_submission={data?.individual_submission ?? null}
        />
      </div>
    );
  }

  return (
    <div className="pb-16">
      <BusinessKycForm
        kyc_status={data?.kyc_status ?? "not_submitted"}
        submission={data?.submission}
        limit_info={data?.limit_info ?? null}
      />
    </div>
  );
}
