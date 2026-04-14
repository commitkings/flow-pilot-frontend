"use client";

import { useRef, useState } from "react";
import { useKycStatus, useSubmitKyc } from "@/hooks/use-kyc-queries";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  Clock,
  FileText,
  Loader2,
  ShieldCheck,
  Upload,
  Building2,
  User,
  AlertCircle,
} from "lucide-react";

// ── Sub-components ─────────────────────────────────────────────────────────────

function StatusCard({ kyc_status }: { kyc_status: string }) {
  if (kyc_status === "verified") {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50 p-6 flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-green-100">
          <ShieldCheck className="h-6 w-6 text-green-600" />
        </div>
        <div>
          <p className="font-semibold text-green-800">Business Verified</p>
          <p className="mt-1 text-sm text-green-700">
            Your business identity has been verified. You have full access to the FlowPilot platform.
          </p>
        </div>
      </div>
    );
  }
  if (kyc_status === "pending") {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-100">
          <Clock className="h-6 w-6 text-amber-600" />
        </div>
        <div>
          <p className="font-semibold text-amber-800">Verification in Progress</p>
          <p className="mt-1 text-sm text-amber-700">
            We've received your documents and are reviewing them. You'll be notified within 10 minutes.
            You can resubmit below if you need to update any documents.
          </p>
        </div>
      </div>
    );
  }
  return null;
}

function DocUploadField({
  label,
  description,
  fileRef,
  file,
  onChange,
}: {
  label: string;
  description: string;
  fileRef: React.RefObject<HTMLInputElement>;
  file: File | null;
  onChange: (f: File | null) => void;
}) {
  return (
    <div className="rounded-xl border border-border/60 p-4 space-y-2">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-foreground">{label}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        </div>
        {file ? (
          <div className="flex items-center gap-2 shrink-0">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span className="text-xs text-green-600 font-medium max-w-[120px] truncate">{file.name}</span>
            <button
              type="button"
              className="text-xs text-muted-foreground underline"
              onClick={() => onChange(null)}
            >
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

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function KycPage() {
  const { data, isLoading } = useKycStatus();
  const submitMut = useSubmitKyc();

  // File refs and state
  const cacRef = useRef<HTMLInputElement>(null!);
  const tinRef = useRef<HTMLInputElement>(null!);
  const dirIdRef = useRef<HTMLInputElement>(null!);
  const poaRef = useRef<HTMLInputElement>(null!);

  const [cacFile, setCacFile] = useState<File | null>(null);
  const [tinFile, setTinFile] = useState<File | null>(null);
  const [dirIdFile, setDirIdFile] = useState<File | null>(null);
  const [poaFile, setPoaFile] = useState<File | null>(null);
  const [directorName, setDirectorName] = useState("");
  const [directorBvn, setDirectorBvn] = useState("");

  const kyc_status = data?.kyc_status ?? "not_submitted";
  const submission = data?.submission;

  const hasAnyInput = cacFile || tinFile || dirIdFile || poaFile || directorName.trim();

  const handleSubmit = () => {
    const fd = new FormData();
    if (cacFile) fd.append("cac_certificate", cacFile);
    if (tinFile) fd.append("tin_document", tinFile);
    if (dirIdFile) fd.append("director_id", dirIdFile);
    if (poaFile) fd.append("proof_of_address", poaFile);
    if (directorName.trim()) fd.append("director_name", directorName.trim());
    if (directorBvn.trim()) fd.append("director_bvn", directorBvn.trim());

    submitMut.mutate(fd, {
      onSuccess: () => {
        setCacFile(null);
        setTinFile(null);
        setDirIdFile(null);
        setPoaFile(null);
        setDirectorName("");
        setDirectorBvn("");
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl pb-16">
      <PageHeader
        title="Business Verification (KYC)"
        description="Submit your business documents to unlock full platform access."
      />

      <div className="mt-8 space-y-6">
        {/* Status card */}
        {kyc_status !== "not_submitted" && <StatusCard kyc_status={kyc_status} />}

        {/* What we need banner */}
        {kyc_status === "not_submitted" && (
          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
            <p className="text-sm text-blue-800">
              To create payout runs, we need to verify your business identity.
              Upload the required documents below. Review typically completes within 10 minutes.
            </p>
          </div>
        )}

        {/* If already verified, show submitted docs summary */}
        {submission && (
          <div className="rounded-2xl border border-border/60 bg-muted/20 p-5 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Submitted Documents
            </p>
            <div className="grid grid-cols-2 gap-2">
              {[
                ["CAC Certificate", submission.has_cac_certificate],
                ["TIN Document", submission.has_tin_document],
                ["Director's ID", submission.has_director_id],
                ["Proof of Address", submission.has_proof_of_address],
              ].map(([label, has]) => (
                <div key={label as string} className="flex items-center gap-2 text-sm">
                  {has ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                  ) : (
                    <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30 shrink-0" />
                  )}
                  <span className={cn("text-sm", has ? "text-foreground" : "text-muted-foreground")}>
                    {label as string}
                  </span>
                </div>
              ))}
            </div>
            {submission.director_name && (
              <p className="text-sm text-muted-foreground">
                Director: <span className="font-medium text-foreground">{submission.director_name}</span>
              </p>
            )}
            {submission.submitted_at && (
              <p className="text-xs text-muted-foreground">
                Submitted: {new Date(submission.submitted_at).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" })}
              </p>
            )}
          </div>
        )}

        {/* Upload form — always show unless verified */}
        {kyc_status !== "verified" && (
          <div className="rounded-2xl border border-border/60 bg-white p-6 space-y-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-brand" />
                <h3 className="text-sm font-semibold text-foreground">
                  {kyc_status === "pending" ? "Update Documents" : "Upload Documents"}
                </h3>
              </div>
              <p className="text-xs text-muted-foreground">
                PDF, JPG, or PNG only. Max 10 MB per file.
              </p>
            </div>

            <div className="space-y-3">
              <DocUploadField
                label="CAC Certificate of Incorporation"
                description="Corporate Affairs Commission certificate showing your business is registered in Nigeria."
                fileRef={cacRef}
                file={cacFile}
                onChange={setCacFile}
              />
              <DocUploadField
                label="Tax Identification Number (TIN) Document"
                description="FIRS-issued TIN certificate or any official document showing your tax ID."
                fileRef={tinRef}
                file={tinFile}
                onChange={setTinFile}
              />
              <DocUploadField
                label="Director's Government-Issued ID"
                description="National ID card, international passport, or driver's licence of a company director."
                fileRef={dirIdRef}
                file={dirIdFile}
                onChange={setDirIdFile}
              />
              <DocUploadField
                label="Proof of Business Address"
                description="Utility bill, bank statement, or government letter addressed to your registered business address."
                fileRef={poaRef}
                file={poaFile}
                onChange={setPoaFile}
              />
            </div>

            {/* Director details */}
            <div className="space-y-3 pt-2 border-t border-border/40">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-brand" />
                <h3 className="text-sm font-semibold text-foreground">Director Details</h3>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Director Full Name</label>
                  <Input
                    value={directorName}
                    onChange={(e) => setDirectorName(e.target.value)}
                    placeholder="e.g. Adaeze Okonkwo"
                    className="h-10 rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">BVN (optional)</label>
                  <Input
                    value={directorBvn}
                    onChange={(e) => setDirectorBvn(e.target.value.replace(/\D/g, "").slice(0, 11))}
                    placeholder="11-digit BVN"
                    className="h-10 rounded-xl"
                    inputMode="numeric"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                className="rounded-full bg-brand px-8 text-white shadow-sm hover:opacity-90"
                onClick={handleSubmit}
                disabled={!hasAnyInput || submitMut.isPending}
              >
                {submitMut.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {kyc_status === "pending" ? "Resubmit Documents" : "Submit for Verification"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
