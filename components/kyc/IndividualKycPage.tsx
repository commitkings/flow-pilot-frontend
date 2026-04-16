"use client";

import { useRef, useState, useEffect } from "react";
import {
  Camera,
  CheckCircle2,
  Clock,
  Lock,
  Mail,
  ShieldCheck,
  TrendingUp,
  Upload,
  User,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { IndividualKycSubmission, KycLimitInfo } from "@/lib/api-types";
import {
  useSubmitIndividualKycLevel1,
  useSubmitIndividualKycLevel2,
  useSubmitIndividualKycLevel3,
} from "@/hooks/use-kyc-queries";

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return `₦${n.toLocaleString("en-NG")}`;
}

function StatusBadge({ status }: { status: string }) {
  if (status === "verified")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700">
        <CheckCircle2 className="h-3 w-3" /> Verified
      </span>
    );
  if (status === "pending")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
        <Clock className="h-3 w-3" /> Pending
      </span>
    );
  if (status === "rejected")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700">
        Rejected
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
      Not submitted
    </span>
  );
}

const INDIVIDUAL_NEXT_LEVEL: Record<number, { label: string; monthly: number; single: number; wallet: number }> = {
  0: { label: "Level 1 unlocks", monthly: 300_000, single: 50_000, wallet: 500_000 },
  1: { label: "Level 2 unlocks", monthly: 1_000_000, single: 200_000, wallet: 2_000_000 },
  2: { label: "Level 3 unlocks", monthly: 3_000_000, single: 500_000, wallet: 5_000_000 },
};

function LimitCard({ info, kyc_status }: { info: KycLimitInfo | null; kyc_status: string }) {
  if (!info) return null;
  const active = kyc_status === "verified" && info.kyc_level > 0;
  const nextLevel = INDIVIDUAL_NEXT_LEVEL[info.kyc_level];

  return (
    <div className={cn(
      "rounded-2xl border p-5 space-y-3",
      active ? "border-green-200 bg-green-50" : "border-border bg-muted/30"
    )}>
      <div className="flex items-center gap-2">
        <TrendingUp className={cn("h-4 w-4", active ? "text-green-600" : "text-muted-foreground")} />
        <p className="text-sm font-bold text-foreground">
          {active ? `Level ${info.kyc_level} Limits Active` : "No Active Limits"}
        </p>
      </div>
      {active ? (
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-0.5">
            <p className="text-xs text-muted-foreground">Monthly</p>
            <p className="text-sm font-black text-foreground">{fmt(info.monthly_limit)}</p>
          </div>
          <div className="space-y-0.5">
            <p className="text-xs text-muted-foreground">Per Transaction</p>
            <p className="text-sm font-black text-foreground">{fmt(info.single_limit)}</p>
          </div>
          <div className="space-y-0.5">
            <p className="text-xs text-muted-foreground">Wallet Cap</p>
            <p className="text-sm font-black text-foreground">{fmt(info.wallet_limit)}</p>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Complete Level 1 to activate your payout limits.</p>
      )}
      {/* Next level teaser */}
      {!info.at_max_level && nextLevel && (
        <div className="rounded-xl border border-brand/20 bg-brand/5 px-3 py-2 space-y-1">
          <p className="text-xs font-semibold text-brand">{nextLevel.label}</p>
          <p className="text-xs text-muted-foreground">
            {fmt(nextLevel.monthly)}/month &middot; {fmt(nextLevel.single)}/txn &middot; {fmt(nextLevel.wallet)} wallet
          </p>
        </div>
      )}
      {active && info.at_max_level && (
        <div className="flex items-start gap-2 rounded-xl border border-brand/20 bg-brand/5 px-3 py-2">
          <Mail className="h-3.5 w-3.5 text-brand mt-0.5 shrink-0" />
          <p className="text-xs text-muted-foreground">
            You&apos;re at the maximum level. To request higher limits, email{" "}
            <a href={`mailto:${info.support_email}`} className="font-semibold text-brand underline">
              {info.support_email}
            </a>
            .
          </p>
        </div>
      )}
    </div>
  );
}

// ── Level card wrapper ────────────────────────────────────────────────────────

function LevelCard({
  level,
  title,
  subtitle,
  limitSummary,
  status,
  locked,
  submissionDetail,
  children,
}: {
  level: number;
  title: string;
  subtitle: string;
  limitSummary: string;
  status: string;
  locked?: boolean;
  submissionDetail?: React.ReactNode;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const isVerified = status === "verified";
  const isPending = status === "pending";
  const hasSubmission = isVerified || isPending;

  return (
    <div className={cn(
      "rounded-2xl border-2 transition-colors",
      isVerified ? "border-green-200 bg-green-50/30" :
      isPending ? "border-amber-200 bg-amber-50/30" :
      locked ? "border-border bg-muted/20 opacity-70" :
      "border-border bg-card"
    )}>
      <div
        className={cn("flex items-center gap-4 p-5", !locked && !isVerified && "cursor-pointer")}
        onClick={() => !locked && !isVerified && setOpen((o) => !o)}
      >
        <div className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-black",
          isVerified ? "bg-green-500 text-white" :
          isPending ? "bg-amber-400 text-white" :
          locked ? "bg-muted text-muted-foreground" :
          "bg-brand/10 text-brand border-2 border-brand"
        )}>
          {isVerified ? <CheckCircle2 className="h-5 w-5" /> :
           isPending ? <Clock className="h-5 w-5" /> :
           locked ? <Lock className="h-4 w-4" /> : level}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-bold text-foreground">{title}</p>
            <StatusBadge status={status} />
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
          <p className="text-xs text-brand font-semibold mt-1">{limitSummary}</p>
        </div>
        {!locked && !isVerified && (
          <span className="text-xs text-muted-foreground">
            {open ? "▲" : "▼"}
          </span>
        )}
      </div>

      {/* Submission summary — shown when pending or verified */}
      {hasSubmission && submissionDetail && (
        <div className="border-t border-border/40 px-5 pb-4 pt-3">
          {submissionDetail}
        </div>
      )}

      {open && !locked && !isVerified && (
        <div className="border-t border-border/60 px-5 pb-5 pt-4">
          {children}
        </div>
      )}
    </div>
  );
}

// ── Doc upload ────────────────────────────────────────────────────────────────

function DocUpload({
  label,
  accept,
  file,
  onChange,
}: {
  label: string;
  accept?: string;
  file: File | null;
  onChange: (f: File | null) => void;
}) {
  const ref = useRef<HTMLInputElement>(null!);
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-semibold text-muted-foreground">{label}</p>
      <div
        className={cn(
          "flex items-center justify-between gap-3 rounded-xl border p-3",
          file ? "border-green-200 bg-green-50" : "border-border"
        )}
      >
        {file ? (
          <>
            <span className="text-xs text-green-700 font-medium truncate">{file.name}</span>
            <button type="button" className="text-xs text-muted-foreground underline shrink-0" onClick={() => onChange(null)}>Remove</button>
          </>
        ) : (
          <>
            <span className="text-xs text-muted-foreground">No file chosen</span>
            <Button type="button" variant="outline" size="sm" className="rounded-full text-xs gap-1.5 shrink-0" onClick={() => ref.current?.click()}>
              <Upload className="h-3 w-3" /> Upload
            </Button>
          </>
        )}
      </div>
      <input ref={ref} type="file" accept={accept} className="hidden" onChange={(e) => onChange(e.target.files?.[0] ?? null)} />
    </div>
  );
}

// ── Level 1 form ──────────────────────────────────────────────────────────────

function Level1Form() {
  const [idType, setIdType] = useState<"nin" | "bvn">("bvn");
  const [idValue, setIdValue] = useState("");
  const mut = useSubmitIndividualKycLevel1();

  const isValid = idValue.replace(/\D/g, "").length >= 10;

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <p className="text-xs font-semibold text-muted-foreground">Identity Type</p>
        <div className="flex gap-2">
          {(["bvn", "nin"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setIdType(t)}
              className={cn(
                "flex-1 rounded-xl border-2 py-2.5 text-sm font-bold transition-colors",
                idType === t ? "border-brand bg-brand/5 text-brand" : "border-border text-muted-foreground hover:border-brand/40"
              )}
            >
              {t.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-muted-foreground">
          {idType === "bvn" ? "BVN (11 digits)" : "NIN (11 digits)"}
          <span className="ml-1 text-destructive">*</span>
        </label>
        <Input
          value={idValue}
          onChange={(e) => setIdValue(e.target.value.replace(/\D/g, "").slice(0, 11))}
          placeholder={`Enter your ${idType.toUpperCase()}`}
          inputMode="numeric"
          className="h-11 rounded-xl"
        />
      </div>
      <Button
        type="button"
        disabled={!isValid || mut.isPending}
        onClick={() => mut.mutate({ id_type: idType, id_value: idValue })}
        className="w-full h-11 rounded-full font-bold"
      >
        {mut.isPending ? "Submitting…" : `Submit ${idType.toUpperCase()}`}
      </Button>
    </div>
  );
}

// ── Level 2 form ──────────────────────────────────────────────────────────────

function Level2Form() {
  const [address, setAddress] = useState("");
  const [poaFile, setPoaFile] = useState<File | null>(null);
  const mut = useSubmitIndividualKycLevel2();

  const isValid = address.trim().length >= 10;

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-muted-foreground">
          Residential Address <span className="text-destructive">*</span>
        </label>
        <textarea
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="e.g. 12 Bode Thomas Street, Surulere, Lagos"
          className="w-full min-h-20 rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground resize-none outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
        />
      </div>
      <DocUpload
        label="Proof of Address (utility bill, bank statement — optional)"
        accept=".pdf,.jpg,.jpeg,.png"
        file={poaFile}
        onChange={setPoaFile}
      />
      <Button
        type="button"
        disabled={!isValid || mut.isPending}
        onClick={() => mut.mutate({ address: address.trim(), proof_of_address: poaFile ?? undefined })}
        className="w-full h-11 rounded-full font-bold"
      >
        {mut.isPending ? "Submitting…" : "Submit Address"}
      </Button>
    </div>
  );
}

// ── Shared camera component ────────────────────────────────────────────────────

function LiveCamera({
  onCapture,
  onClose,
  facingMode,
  onToggleFacing,
  purpose,
}: {
  onCapture: (file: File, filename: string) => void;
  onClose: () => void;
  facingMode: "user" | "environment";
  onToggleFacing: () => void;
  purpose?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [consented, setConsented] = useState(false);

  useEffect(() => {
    if (!consented) return;
    let active = true;
    setError(null);
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } } })
      .then((stream) => {
        if (!active) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
      })
      .catch(() => setError("Camera access denied. Please allow camera access in your browser settings and try again."));
    return () => {
      active = false;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [facingMode, consented]);

  // Consent gate — shown before requesting camera permission
  if (!consented) {
    return (
      <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-3">
        <div className="flex items-start gap-3">
          <Camera className="h-5 w-5 text-brand mt-0.5 shrink-0" />
          <div className="space-y-1">
            <p className="text-sm font-bold text-foreground">Camera access required</p>
            <p className="text-xs text-muted-foreground">
              {purpose ?? "Your browser will ask for permission to use your camera."}
              {" "}We only use your camera for this verification — no images are stored without your submission.
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            className="rounded-full gap-1.5 text-xs"
            onClick={() => setConsented(true)}
          >
            <Camera className="h-3.5 w-3.5" /> Allow Camera
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="rounded-full text-xs text-muted-foreground"
            onClick={onClose}
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  function capture(filename: string) {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      if (blob) onCapture(new File([blob], filename, { type: "image/jpeg" }), filename);
    }, "image/jpeg", 0.92);
  }

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 space-y-2">
        <p className="text-xs text-destructive">{error}</p>
        <button type="button" onClick={onClose} className="text-xs underline text-muted-foreground">Cancel</button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-xl border border-border bg-black">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full"
          style={{ maxHeight: 280, objectFit: "cover" }}
        />
        <button
          type="button"
          onClick={onClose}
          className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
        >
          <X className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onToggleFacing}
          title={facingMode === "user" ? "Switch to rear camera" : "Switch to front camera"}
          className="absolute left-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 text-xs font-bold"
        >
          ↺
        </button>
        <div className="absolute bottom-2 left-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] text-white/80">
          {facingMode === "user" ? "Front" : "Rear"}
        </div>
      </div>
      <Button
        type="button"
        onClick={() => capture(facingMode === "user" ? "selfie.jpg" : "id-photo.jpg")}
        className="w-full h-11 rounded-full font-bold gap-2"
      >
        <Camera className="h-4 w-4" /> Capture
      </Button>
    </div>
  );
}

// ── Level 3 form ──────────────────────────────────────────────────────────────

function Level3Form() {
  const [govIdFile, setGovIdFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [activeCamera, setActiveCamera] = useState<"govid" | "selfie" | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  const [selfieFacing, setSelfieFacing] = useState<"user" | "environment">("user");
  const mut = useSubmitIndividualKycLevel3();

  return (
    <div className="space-y-5">
      {/* Step 1 — Government ID */}
      <div className="space-y-2">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Step 1 — Government ID</p>
        <p className="text-sm text-muted-foreground">
          Upload or photograph your NIN card, international passport, or driver&apos;s licence. Image or PDF, max 10 MB.
        </p>

        {activeCamera === "govid" ? (
          <LiveCamera
            facingMode={facingMode}
            onToggleFacing={() => setFacingMode((m) => m === "environment" ? "user" : "environment")}
            onCapture={(f) => { setGovIdFile(f); setActiveCamera(null); }}
            onClose={() => setActiveCamera(null)}
            purpose="We need to photograph your government-issued ID document."
          />
        ) : (
          <div className="space-y-2">
            <DocUpload
              label="Government-Issued Photo ID"
              accept=".pdf,.jpg,.jpeg,.png"
              file={govIdFile}
              onChange={setGovIdFile}
            />
            <button
              type="button"
              onClick={() => setActiveCamera("govid")}
              className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:border-brand/60 hover:text-brand"
            >
              <Camera className="h-4 w-4" /> Take Photo of ID
            </button>
          </div>
        )}
      </div>

      {/* Step 2 — Liveness selfie */}
      <div className="space-y-2 border-t border-border/60 pt-4">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Step 2 — Liveness Check</p>
        <p className="text-sm text-muted-foreground">
          Take a live selfie using your front camera so we can confirm it&apos;s really you. This must be taken live — no uploads.
        </p>

        {activeCamera === "selfie" ? (
          <LiveCamera
            facingMode={selfieFacing}
            onToggleFacing={() => setSelfieFacing((m) => m === "user" ? "environment" : "user")}
            onCapture={(f) => { setSelfieFile(f); setActiveCamera(null); }}
            onClose={() => setActiveCamera(null)}
            purpose="We need to take a live selfie to confirm it's really you (liveness check)."
          />
        ) : selfieFile ? (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-green-200 bg-green-50 p-3">
            <span className="text-xs text-green-700 font-medium">Selfie captured</span>
            <button type="button" className="text-xs text-muted-foreground underline" onClick={() => setSelfieFile(null)}>
              Retake
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => { setSelfieFacing("user"); setActiveCamera("selfie"); }}
            className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-brand/40 bg-brand/5 py-3 text-sm font-semibold text-brand transition-colors hover:bg-brand/10"
          >
            <Camera className="h-4 w-4" /> Take Liveness Selfie
          </button>
        )}
      </div>

      <Button
        type="button"
        disabled={!govIdFile || !selfieFile || mut.isPending}
        onClick={() => govIdFile && selfieFile && mut.mutate({ govId: govIdFile, selfie: selfieFile })}
        className="w-full h-11 rounded-full font-bold"
      >
        {mut.isPending ? "Uploading…" : "Submit Government ID & Selfie"}
      </Button>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function IndividualKycPage({
  kyc_status,
  kyc_level,
  limit_info,
  individual_submission,
}: {
  kyc_status: string;
  kyc_level: number;
  limit_info: KycLimitInfo | null;
  individual_submission: IndividualKycSubmission | null;
}) {
  const sub = individual_submission;

  const l1Status = sub?.level_1_status ?? "not_submitted";
  const l2Status = sub?.level_2_status ?? "not_submitted";
  const l3Status = sub?.level_3_status ?? "not_submitted";

  return (
    <div className="space-y-6">
      {/* Header banner */}
      <div className="rounded-2xl border border-border/60 bg-muted/20 p-5 flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand/10">
          <User className="h-5 w-5 text-brand" />
        </div>
        <div>
          <p className="text-sm font-bold text-foreground">Individual Identity Verification</p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Complete verification levels to increase your monthly payout limits. Each level unlocks higher limits.
          </p>
        </div>
      </div>

      {/* Current limits */}
      <LimitCard info={limit_info} kyc_status={kyc_status} />

      {/* Level cards */}
      <div className="space-y-3">
        <LevelCard
          level={1}
          title="Level 1 — Identity"
          subtitle="Submit your BVN or NIN to verify your identity."
          limitSummary="Unlocks: ₦300k/month · ₦50k/txn · ₦500k wallet"
          status={l1Status}
          submissionDetail={sub?.level_1_masked_value ? (
            <div className="flex flex-wrap gap-3 text-xs">
              <span className="text-muted-foreground">
                <span className="font-semibold text-foreground">{sub.level_1_type?.toUpperCase()}</span>
                {" "}submitted
              </span>
              <span className="font-mono text-foreground tracking-widest">{sub.level_1_masked_value}</span>
              {sub.level_1_verified_at && (
                <span className="text-green-600">Verified {new Date(sub.level_1_verified_at).toLocaleDateString()}</span>
              )}
            </div>
          ) : undefined}
        >
          <Level1Form />
        </LevelCard>

        <LevelCard
          level={2}
          title="Level 2 — Address"
          subtitle="Confirm your residential address with optional proof of address."
          limitSummary="Unlocks: ₦1m/month · ₦200k/txn · ₦2m wallet"
          status={l2Status}
          locked={l1Status !== "verified"}
          submissionDetail={sub?.level_2_address ? (
            <div className="space-y-1.5 text-xs">
              <p className="text-muted-foreground">
                <span className="font-semibold text-foreground">Address:</span>{" "}{sub.level_2_address}
              </p>
              {sub.level_2_document_uploaded && (
                <p className="text-muted-foreground">
                  <span className="font-semibold text-foreground">Proof of address:</span>{" "}document submitted
                </p>
              )}
              {sub.level_2_verified_at && (
                <p className="text-green-600">Verified {new Date(sub.level_2_verified_at).toLocaleDateString()}</p>
              )}
            </div>
          ) : undefined}
        >
          <Level2Form />
        </LevelCard>

        <LevelCard
          level={3}
          title="Level 3 — Government ID"
          subtitle="Upload a government-issued photo ID (NIN card, passport, or driver's licence)."
          limitSummary="Unlocks: ₦3m/month · ₦500k/txn · ₦5m wallet"
          status={l3Status}
          locked={l2Status !== "verified"}
          submissionDetail={(sub?.level_3_document_uploaded || sub?.level_3_selfie_uploaded) ? (
            <div className="flex flex-wrap gap-3 text-xs">
              {sub?.level_3_document_uploaded && (
                <span className="text-muted-foreground"><span className="font-semibold text-foreground">Government ID:</span> document submitted</span>
              )}
              {sub?.level_3_selfie_uploaded && (
                <span className="text-muted-foreground"><span className="font-semibold text-foreground">Liveness selfie:</span> captured</span>
              )}
              {sub?.level_3_verified_at && (
                <span className="text-green-600">Verified {new Date(sub.level_3_verified_at).toLocaleDateString()}</span>
              )}
            </div>
          ) : undefined}
        >
          <Level3Form />
        </LevelCard>
      </div>

      {/* Max level contact */}
      {l3Status === "verified" && limit_info?.at_max_level && (
        <div className="rounded-2xl border border-brand/20 bg-brand/5 p-5 flex items-start gap-3">
          <ShieldCheck className="h-5 w-5 text-brand shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-foreground">Fully Verified</p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              All levels complete. Need higher limits? Email{" "}
              <a href={`mailto:${limit_info.support_email}`} className="font-semibold text-brand underline">
                {limit_info.support_email}
              </a>
              .
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
