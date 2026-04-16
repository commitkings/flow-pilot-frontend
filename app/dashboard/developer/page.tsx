"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Webhook, BarChart2, FlaskConical, ShieldAlert } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { ApiKeysSection } from "@/components/settings/ApiKeysSection";
import { WebhooksSection } from "@/components/settings/WebhooksSection";
import { ApiUsageSection } from "@/components/settings/ApiUsageSection";
import { ApiPlaygroundSection } from "@/components/settings/ApiPlaygroundSection";
import { useOrgProfile } from "@/hooks/use-settings-queries";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Tab = "api-keys" | "webhooks" | "usage" | "playground";

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "api-keys", label: "API Keys", icon: <KeyRound className="h-4 w-4" /> },
  { id: "webhooks", label: "Webhooks", icon: <Webhook className="h-4 w-4" /> },
  { id: "usage", label: "Usage & Health", icon: <BarChart2 className="h-4 w-4" /> },
  { id: "playground", label: "Playground", icon: <FlaskConical className="h-4 w-4" /> },
];

export default function DeveloperPage() {
  const [activeTab, setActiveTab] = useState<Tab>("api-keys");
  const router = useRouter();
  const { data: org, isLoading: orgLoading } = useOrgProfile();

  // ── KYC gate ──────────────────────────────────────────────────────────────
  if (!orgLoading && org && org.kyc_status !== "verified") {
    const isPending = org.kyc_status === "pending";
    return (
      <div className="mx-auto max-w-6xl pb-16 space-y-6">
        <PageHeader
          title="Developer"
          description="Manage API keys and webhooks to integrate FlowPilot with your systems."
        />
        <div className="flex flex-col items-center gap-5 rounded-2xl border border-border/60 bg-card p-10 text-center shadow-sm">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
            <ShieldAlert className="h-7 w-7 text-muted-foreground" />
          </div>
          <div>
            <h2 className="text-base font-black text-foreground">
              {isPending ? "Verification In Progress" : "Identity Verification Required"}
            </h2>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground leading-relaxed">
              {isPending
                ? "Your identity verification is under review. API keys and webhooks will be available once your organisation is verified."
                : "Complete KYC/KYB verification before generating API keys or configuring webhooks. This protects you and ensures compliance with financial regulations."}
            </p>
          </div>
          {!isPending && (
            <Button
              className="rounded-full bg-brand px-6 text-white hover:opacity-90"
              onClick={() => router.push("/dashboard/settings?tab=workspace")}
            >
              Complete Verification
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl pb-16 space-y-6">
      <PageHeader
        title="Developer"
        description="Manage API keys and webhooks to integrate FlowPilot with your systems."
      />

      {/* ── Tab bar ── */}
      <div className="flex overflow-x-auto border-b border-border gap-1 pb-px scrollbar-none">
        {TABS.map((tab) => (
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
      <div className="pt-2">
        {activeTab === "api-keys" && (
          <div className="space-y-2">
            <div className="mb-5">
              <h2 className="text-base font-bold text-foreground">API Keys</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Generate keys to let your applications interact with FlowPilot programmatically.
                Each key is scoped to specific permissions and shown only once on creation.
              </p>
            </div>
            <ApiKeysSection />
          </div>
        )}

        {activeTab === "webhooks" && (
          <div className="space-y-2">
            <div className="mb-5">
              <h2 className="text-base font-bold text-foreground">Webhooks</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Subscribe to real-time events from FlowPilot. We&apos;ll send an HTTP POST
                to your endpoint whenever a run completes, a payout succeeds or fails, or an
                approval action occurs. Each webhook includes a signing secret for verification.
              </p>
            </div>
            <WebhooksSection />
          </div>
        )}

        {activeTab === "usage" && (
          <div className="space-y-2">
            <div className="mb-5">
              <h2 className="text-base font-bold text-foreground">Usage &amp; Health</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Monitor API key activity, check webhook delivery health, and access quick
                integration reference material.
              </p>
            </div>
            <ApiUsageSection />
          </div>
        )}

        {activeTab === "playground" && (
          <div className="space-y-2">
            <div className="mb-5">
              <h2 className="text-base font-bold text-foreground">API Playground</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Browse and test every <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">/public/v1</code> endpoint
                directly from the dashboard. Paste an API key, pick an endpoint, fill in parameters, and send.
              </p>
            </div>
            <ApiPlaygroundSection />
          </div>
        )}
      </div>
    </div>
  );
}
