"use client";

import { ExternalLink, KeyRound, Webhook, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

import { useApiKeys } from "@/hooks/use-api-key-queries";
import { useWebhooks } from "@/hooks/use-webhook-queries";
import { cn } from "@/lib/utils";

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(iso: string | null | undefined): string {
  if (!iso) return "Never";
  return formatDistanceToNow(new Date(iso), { addSuffix: true });
}

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <span className="text-brand">{icon}</span>
      <h3 className="text-sm font-black uppercase tracking-widest text-foreground">
        {title}
      </h3>
    </div>
  );
}

// ── API Key Activity ──────────────────────────────────────────────────────────

function ApiKeyActivity() {
  const { data, isLoading } = useApiKeys();
  const keys = data?.keys ?? [];

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <SectionTitle icon={<KeyRound className="h-4 w-4" />} title="API Key Activity" />

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-4 flex-1 rounded bg-muted animate-pulse" />
              <div className="h-4 w-24 rounded bg-muted animate-pulse" />
              <div className="h-4 w-20 rounded bg-muted animate-pulse" />
            </div>
          ))}
        </div>
      ) : keys.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">
          No API keys yet. Create one from the API Keys tab.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60">
                <th className="pb-2.5 text-left text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                  Key
                </th>
                <th className="pb-2.5 text-left text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                  Scopes
                </th>
                <th className="pb-2.5 text-left text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                  Last Used
                </th>
                <th className="pb-2.5 text-left text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {keys.map((key) => {
                const neverUsed = !key.last_used_at;
                return (
                  <tr key={key.id} className="group">
                    <td className="py-3 pr-4">
                      <p className="font-semibold text-foreground truncate max-w-[140px]">
                        {key.name}
                      </p>
                      <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                        {key.prefix}…
                      </p>
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex flex-wrap gap-1">
                        {key.scopes.slice(0, 2).map((s) => (
                          <span
                            key={s}
                            className="inline-flex rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground"
                          >
                            {s}
                          </span>
                        ))}
                        {key.scopes.length > 2 && (
                          <span className="inline-flex rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                            +{key.scopes.length - 2}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3 shrink-0" />
                        <span>{timeAgo(key.last_used_at)}</span>
                      </div>
                    </td>
                    <td className="py-3">
                      {neverUsed ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                          Unused
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-[10px] font-semibold text-green-700">
                          <CheckCircle2 className="h-2.5 w-2.5" />
                          Active
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Webhook Health ─────────────────────────────────────────────────────────────

function WebhookHealth() {
  const { data, isLoading } = useWebhooks();
  const webhooks = data?.webhooks ?? [];

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <SectionTitle icon={<Webhook className="h-4 w-4" />} title="Webhook Health" />

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="h-4 flex-1 rounded bg-muted animate-pulse" />
              <div className="h-4 w-24 rounded bg-muted animate-pulse" />
              <div className="h-4 w-16 rounded bg-muted animate-pulse" />
            </div>
          ))}
        </div>
      ) : webhooks.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center">
          No webhooks yet. Create one from the Webhooks tab.
        </p>
      ) : (
        <div className="space-y-3">
          {webhooks.map((wh) => {
            const hasFailures = wh.failure_count > 0;
            const isDisabled = !wh.is_active;
            return (
              <div
                key={wh.id}
                className={cn(
                  "flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border px-4 py-3",
                  hasFailures
                    ? "border-red-200 bg-red-50/50"
                    : isDisabled
                    ? "border-border bg-muted/30"
                    : "border-green-200 bg-green-50/30"
                )}
              >
                {/* URL + Events */}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-mono text-xs font-semibold text-foreground">
                    {wh.url}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {wh.events.slice(0, 3).map((e) => (
                      <span
                        key={e}
                        className="inline-flex rounded-full bg-background border border-border px-2 py-0.5 text-[10px] font-semibold text-muted-foreground"
                      >
                        {e}
                      </span>
                    ))}
                    {wh.events.length > 3 && (
                      <span className="inline-flex rounded-full bg-background border border-border px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                        +{wh.events.length - 3}
                      </span>
                    )}
                  </div>
                </div>

                {/* Status + last triggered */}
                <div className="flex shrink-0 flex-col items-end gap-1 sm:items-end">
                  {isDisabled ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                      Disabled
                    </span>
                  ) : hasFailures ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-red-700">
                      <AlertTriangle className="h-2.5 w-2.5" />
                      {wh.failure_count} failure{wh.failure_count !== 1 ? "s" : ""}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-[10px] font-semibold text-green-700">
                      <CheckCircle2 className="h-2.5 w-2.5" />
                      Healthy
                    </span>
                  )}
                  <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Clock className="h-2.5 w-2.5" />
                    {timeAgo(wh.last_triggered_at)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Quick Reference ────────────────────────────────────────────────────────────

function QuickReference() {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <h3 className="text-sm font-black uppercase tracking-widest text-foreground mb-4">
        Quick Reference
      </h3>
      <div className="space-y-3 text-sm">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-black text-muted-foreground">
            1
          </span>
          <p className="text-muted-foreground">
            Include your API key via{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-foreground">
              X-API-Key: fp_…
            </code>{" "}
            header on all public API requests.
          </p>
        </div>
        <div className="flex items-start gap-3">
          <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-black text-muted-foreground">
            2
          </span>
          <p className="text-muted-foreground">
            Validate webhook payloads using the{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-foreground">
              X-FlowPilot-Signature
            </code>{" "}
            header and your signing secret.
          </p>
        </div>
        <div className="flex items-start gap-3">
          <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-black text-muted-foreground">
            3
          </span>
          <p className="text-muted-foreground">
            All public API endpoints are under{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-foreground">
              /api/v1/public/v1/
            </code>
            .
          </p>
        </div>
      </div>
      <div className="mt-5">
        <Link
          href="/docs"
          className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand/5 px-4 py-2 text-sm font-semibold text-brand transition-colors hover:bg-brand/10"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Open Full API Docs
        </Link>
      </div>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export function ApiUsageSection() {
  return (
    <div className="space-y-5">
      <ApiKeyActivity />
      <WebhookHealth />
      <QuickReference />
    </div>
  );
}
