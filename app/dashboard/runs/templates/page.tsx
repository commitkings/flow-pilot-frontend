"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bookmark, Plus, Trash2, Zap } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { useRunTemplates } from "@/hooks/use-run-templates";
import { useKycStatus } from "@/hooks/use-kyc-queries";

export default function TemplatesPage() {
  const router = useRouter();
  const { templates, saveTemplate, deleteTemplate } = useRunTemplates();
  const { data: kycData } = useKycStatus();
  const kycStatus = kycData?.kyc_status;
  const accountType = kycData?.limit_info?.account_type ?? "business";
  const isIndividual = accountType === "individual";

  if (kycData && kycStatus !== "verified") {
    return (
      <div className="mx-auto max-w-lg py-24 text-center space-y-5">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 mx-auto">
          <svg className="h-8 w-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-foreground">Verification Required</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {kycStatus === "pending"
            ? (isIndividual
                ? "Your identity is under review. You'll be able to use templates once verification is complete."
                : "Your business documents are under review. You'll be able to use templates once verification is complete.")
            : (isIndividual
                ? "Verify your identity (BVN or NIN) to save and use payout templates."
                : "Complete business verification (KYC) before using templates.")}
        </p>
        <Link
          href="/dashboard/kyc"
          className="inline-flex items-center gap-2 rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:opacity-90"
        >
          {kycStatus === "pending"
            ? "Check Verification Status"
            : isIndividual ? "Verify Identity" : "Complete KYC Verification"}
        </Link>
      </div>
    );
  }

  const [name, setName] = useState("");
  const [objective, setObjective] = useState("");

  const handleSave = () => {
    const trimmedName = name.trim();
    if (!trimmedName) return;
    saveTemplate(trimmedName, objective.trim());
    setName("");
    setObjective("");
    toast.success("Template saved.");
  };

  const handleDelete = (id: string, templateName: string) => {
    deleteTemplate(id);
    toast.success(`"${templateName}" deleted.`);
  };

  const handleUse = (obj: string) => {
    router.push(`/dashboard/runs/new?objective=${encodeURIComponent(obj)}`);
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Templates"
        description="Reusable payout objectives. Pick one to pre-fill a new payout."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* ── Template list ──────────────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-3">
          {templates.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-border bg-muted/10 py-20 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                <Bookmark className="h-7 w-7" />
              </div>
              <div>
                <p className="text-base font-black text-foreground">No templates yet</p>
                <p className="mt-1 text-sm text-muted-foreground max-w-xs">
                  Save a payout objective as a template to reuse it in one click.
                </p>
              </div>
            </div>
          ) : (
            templates.map((template) => (
              <div
                key={template.id}
                className="flex items-start gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm transition-all hover:border-brand/30 hover:shadow"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
                  <Bookmark className="h-4 w-4" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-foreground">
                    {template.name}
                  </p>
                  {template.objective ? (
                    <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                      {template.objective}
                    </p>
                  ) : (
                    <p className="mt-0.5 text-xs italic text-muted-foreground/50">
                      No objective saved
                    </p>
                  )}
                  <p className="mt-2 text-[10px] text-muted-foreground/50">
                    Saved{" "}
                    {new Date(template.savedAt).toLocaleDateString("en-NG", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <Button
                    size="sm"
                    className="h-8 gap-1.5 rounded-full bg-brand px-4 text-xs font-bold text-white hover:opacity-90"
                    onClick={() => handleUse(template.objective)}
                  >
                    <Zap className="h-3 w-3" />
                    Use
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => handleDelete(template.id, template.name)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* ── Create new template ────────────────────────────────────── */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm h-fit">
          <div className="flex items-center gap-2 mb-5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand/10 text-brand">
              <Plus className="h-4 w-4" />
            </div>
            <p className="text-sm font-black text-foreground">New Template</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Monthly Payroll"
                className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none transition-all focus:border-brand focus:ring-1 focus:ring-brand/10 placeholder:text-muted-foreground"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Objective <span className="normal-case font-normal text-muted-foreground/60">(optional)</span>
              </label>
              <textarea
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
                placeholder="Pay all approved vendors from this month's invoices..."
                rows={3}
                className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none transition-all focus:border-brand focus:ring-1 focus:ring-brand/10 placeholder:text-muted-foreground"
              />
            </div>

            <Button
              className="w-full rounded-full bg-brand text-white hover:opacity-90 font-bold"
              disabled={!name.trim()}
              onClick={handleSave}
            >
              Save Template
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
