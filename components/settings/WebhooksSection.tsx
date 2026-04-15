"use client";

import { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Copy,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  Webhook,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useWebhooks,
  useCreateWebhook,
  useDeleteWebhook,
  useToggleWebhook,
  useWebhookDeliveries,
  useUpdateWebhook,
} from "@/hooks/use-webhook-queries";
import type { Webhook as WebhookType } from "@/lib/api-developer";

const WEBHOOK_EVENTS = [
  { value: "run.completed", label: "Run Completed" },
  { value: "run.failed", label: "Run Failed" },
  { value: "payout.succeeded", label: "Payout Succeeded" },
  { value: "payout.failed", label: "Payout Failed" },
  { value: "approval.requested", label: "Approval Requested" },
  { value: "approval.completed", label: "Approval Completed" },
  { value: "candidate.flagged", label: "Candidate Flagged" },
] as const;

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

// ── Inline detail panel shown when a webhook card is expanded ─────────────────

function WebhookDetailPanel({ hook }: { hook: WebhookType }) {
  const deliveriesQuery = useWebhookDeliveries(hook.id);
  const updateWebhookMut = useUpdateWebhook();

  const [editMode, setEditMode] = useState(false);
  const [editUrl, setEditUrl] = useState(hook.url);
  const [editEvents, setEditEvents] = useState<string[]>(hook.events);

  const toggleEditEvent = (event: string) => {
    setEditEvents((prev) =>
      prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event]
    );
  };

  const handleSave = () => {
    updateWebhookMut.mutate(
      { id: hook.id, url: editUrl, events: editEvents },
      {
        onSuccess: () => setEditMode(false),
      }
    );
  };

  const deliveries = deliveriesQuery.data?.deliveries ?? [];

  return (
    <div className="mt-3 border-t border-border/40 pt-4 space-y-5">
      {/* ── Edit section ──────────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Configuration
          </p>
          {!editMode && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 rounded-full text-xs gap-1.5"
              onClick={() => {
                setEditUrl(hook.url);
                setEditEvents([...hook.events]);
                setEditMode(true);
              }}
            >
              <Pencil className="h-3 w-3" />
              Edit
            </Button>
          )}
        </div>

        {editMode ? (
          <div className="space-y-4 rounded-xl border border-border/60 bg-muted/20 p-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Endpoint URL</label>
              <Input
                type="url"
                className="h-9 rounded-xl font-mono text-sm"
                value={editUrl}
                onChange={(e) => setEditUrl(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Events</label>
              <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                {WEBHOOK_EVENTS.map(({ value, label }) => (
                  <label
                    key={value}
                    className="flex cursor-pointer items-center gap-2 rounded-xl border border-border/60 px-3 py-2 text-sm transition-colors hover:bg-muted/40 has-[:checked]:border-brand/40 has-[:checked]:bg-brand/5"
                  >
                    <input
                      type="checkbox"
                      className="h-3.5 w-3.5 accent-brand"
                      checked={editEvents.includes(value)}
                      onChange={() => toggleEditEvent(value)}
                    />
                    <span className="font-mono text-xs text-foreground">{value}</span>
                    <span className="ml-auto text-xs text-muted-foreground">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <Button
                className="rounded-full bg-brand px-5 text-xs text-white shadow-sm hover:opacity-90"
                onClick={handleSave}
                disabled={
                  updateWebhookMut.isPending ||
                  !editUrl ||
                  editEvents.length === 0
                }
              >
                {updateWebhookMut.isPending ? (
                  <>
                    <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                    Saving…
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="rounded-full text-xs"
                onClick={() => setEditMode(false)}
                disabled={updateWebhookMut.isPending}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-1.5">
            <p className="font-mono text-xs text-muted-foreground break-all">{hook.url}</p>
            <div className="flex flex-wrap gap-1">
              {hook.events.map((ev) => (
                <span
                  key={ev}
                  className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 font-mono text-[11px] text-blue-700 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-300"
                >
                  {ev}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Delivery history ───────────────────────────────────────────────── */}
      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Recent Deliveries
        </p>

        {deliveriesQuery.isLoading ? (
          <div className="flex items-center gap-2 py-4 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Loading delivery history…
          </div>
        ) : deliveries.length === 0 ? (
          <p className="py-4 text-center text-xs text-muted-foreground">
            No deliveries recorded yet.
          </p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border/60">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-3 py-2 text-left text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                    Status
                  </th>
                  <th className="px-3 py-2 text-left text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                    Event
                  </th>
                  <th className="px-3 py-2 text-left text-[10px] font-black uppercase tracking-wider text-muted-foreground hidden sm:table-cell">
                    Code
                  </th>
                  <th className="px-3 py-2 text-left text-[10px] font-black uppercase tracking-wider text-muted-foreground hidden md:table-cell">
                    Delivered
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {deliveries.map((d) => (
                  <tr key={d.id} className="hover:bg-muted/20">
                    <td className="px-3 py-2">
                      {d.success ? (
                        <CheckCircle2 className="h-4 w-4 text-teal-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-destructive" />
                      )}
                    </td>
                    <td className="px-3 py-2 font-mono text-[11px] text-foreground">
                      {d.event_name}
                    </td>
                    <td className="px-3 py-2 hidden sm:table-cell">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          d.success
                            ? "bg-teal-50 text-teal-700"
                            : "bg-red-50 text-red-700"
                        }`}
                      >
                        {d.status_code ?? "—"}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-[11px] text-muted-foreground hidden md:table-cell">
                      {formatDate(d.delivered_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function WebhooksSection() {
  const webhooksQuery = useWebhooks();
  const createWebhook = useCreateWebhook();
  const deleteWebhookMut = useDeleteWebhook();
  const toggleWebhookMut = useToggleWebhook();

  const [addOpen, setAddOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [newSecret, setNewSecret] = useState<string | null>(null);
  const [secretCopied, setSecretCopied] = useState(false);
  const [verificationFailed, setVerificationFailed] = useState(false);
  const [selectedWebhookId, setSelectedWebhookId] = useState<string | null>(null);

  const webhooks: WebhookType[] = webhooksQuery.data?.webhooks ?? [];

  const toggleEvent = (event: string) => {
    setSelectedEvents((prev) =>
      prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event]
    );
  };

  const handleCreate = () => {
    if (!url || selectedEvents.length === 0) return;
    createWebhook.mutate(
      { url, events: selectedEvents },
      {
        onSuccess: (data) => {
          if (data.secret) {
            setNewSecret(data.secret);
          }
          setVerificationFailed(!data.verified);
          setUrl("");
          setSelectedEvents([]);
          setAddOpen(false);
        },
      }
    );
  };

  const handleCopySecret = () => {
    if (!newSecret) return;
    navigator.clipboard.writeText(newSecret);
    setSecretCopied(true);
    setTimeout(() => setSecretCopied(false), 2000);
  };

  const handleDismissSecret = () => {
    setNewSecret(null);
    setSecretCopied(false);
    setVerificationFailed(false);
  };

  const toggleExpand = (id: string) => {
    setSelectedWebhookId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="space-y-5">
      {/* ── New secret reveal panel ─────────────────────────────────────── */}
      {newSecret && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-5 space-y-3 shadow-sm dark:border-amber-700 dark:bg-amber-950/20">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-amber-900 dark:text-amber-200">
                This secret is shown only once. Save it now.
              </p>
              <p className="mt-0.5 text-sm text-amber-700 dark:text-amber-300">
                Use this secret to verify webhook signatures from FlowPilot.
              </p>
            </div>
          </div>
          <code className="block break-all rounded-xl border border-amber-200 bg-white px-4 py-3 font-mono text-sm text-foreground dark:border-amber-800 dark:bg-amber-950/40">
            {newSecret}
          </code>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="rounded-full shadow-sm"
              onClick={handleCopySecret}
            >
              {secretCopied ? (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4 text-teal-600" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy Secret
                </>
              )}
            </Button>
            <Button
              variant="ghost"
              className="rounded-full"
              onClick={handleDismissSecret}
            >
              Dismiss
            </Button>
          </div>
        </div>
      )}

      {/* ── Verification failure notice ─────────────────────────────────── */}
      {verificationFailed && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
          <div className="text-sm">
            <p className="font-semibold text-red-800">Endpoint not reachable</p>
            <p className="mt-0.5 text-red-700">
              FlowPilot sent a test ping to your URL but did not receive a 2xx response.
              The webhook was saved as <strong>inactive</strong>. Fix your endpoint and
              enable it using the toggle on the webhook card below.
            </p>
          </div>
        </div>
      )}

      {/* ── Existing webhooks list ──────────────────────────────────────── */}
      {webhooksQuery.isLoading ? (
        <div className="py-8 text-center">
          <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : webhooks.length === 0 && !addOpen ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-border/60 bg-muted/20 py-12 text-center shadow-sm">
          <Webhook className="h-8 w-8 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">No webhooks configured.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {webhooks.map((hook) => {
            const isExpanded = selectedWebhookId === hook.id;
            return (
              <div
                key={hook.id}
                className="rounded-2xl border border-border/60 bg-card p-4 shadow-sm transition-all hover:border-brand/30"
              >
                {/* Card header row — clickable to expand */}
                <div
                  className="flex flex-col gap-3 cursor-pointer sm:flex-row sm:items-start sm:justify-between"
                  onClick={() => toggleExpand(hook.id)}
                >
                  <div className="min-w-0 flex-1 space-y-2">
                    <p className="break-all font-mono text-sm font-semibold text-foreground">
                      {hook.url}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {hook.events.map((ev) => (
                        <span
                          key={ev}
                          className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 font-mono text-xs text-blue-700 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-300"
                        >
                          {ev}
                        </span>
                      ))}
                    </div>
                    {hook.failure_count > 0 && (
                      <p className="flex items-center gap-1 text-xs font-medium text-destructive">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        {hook.failure_count} delivery failure{hook.failure_count !== 1 ? "s" : ""} — auto-disabled after 5
                      </p>
                    )}
                    {!hook.is_active && hook.failure_count === 0 && (
                      <p className="flex items-center gap-1 text-xs font-medium text-amber-600">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        Inactive — endpoint did not pass the verification ping. Enable once your URL is ready.
                      </p>
                    )}
                  </div>
                  <div
                    className="flex shrink-0 items-center gap-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      className={`rounded-full text-xs shadow-sm ${
                        hook.is_active
                          ? "border-teal-300 text-teal-700 hover:bg-teal-50 dark:border-teal-700 dark:text-teal-300"
                          : "border-border/60 text-muted-foreground"
                      }`}
                      onClick={() =>
                        toggleWebhookMut.mutate({ id: hook.id, is_active: !hook.is_active })
                      }
                      disabled={toggleWebhookMut.isPending}
                    >
                      {hook.is_active ? "Active" : "Inactive"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-full text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => {
                        deleteWebhookMut.mutate(hook.id);
                        if (selectedWebhookId === hook.id) setSelectedWebhookId(null);
                      }}
                      disabled={deleteWebhookMut.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-full text-muted-foreground hover:text-foreground"
                      onClick={() => toggleExpand(hook.id)}
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Expanded detail panel */}
                {isExpanded && <WebhookDetailPanel hook={hook} />}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Add webhook inline form ─────────────────────────────────────── */}
      {addOpen && (
        <div className="rounded-2xl border border-border/60 bg-card p-5 space-y-4 shadow-sm">
          <h3 className="text-sm font-bold text-foreground">New Webhook</h3>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Endpoint URL</label>
            <Input
              type="url"
              placeholder="https://your-service.com/webhooks/flowpilot"
              className="h-10 rounded-xl font-mono text-sm"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Events to subscribe</label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {WEBHOOK_EVENTS.map(({ value, label }) => (
                <label
                  key={value}
                  className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-border/60 px-3 py-2.5 text-sm transition-colors hover:bg-muted/40 has-[:checked]:border-brand/40 has-[:checked]:bg-brand/5"
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-brand"
                    checked={selectedEvents.includes(value)}
                    onChange={() => toggleEvent(value)}
                  />
                  <span className="font-mono text-xs text-foreground">{value}</span>
                  <span className="ml-auto text-xs text-muted-foreground">{label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <Button
              className="rounded-full bg-brand px-6 text-white shadow-sm hover:opacity-90"
              onClick={handleCreate}
              disabled={
                createWebhook.isPending ||
                !url ||
                selectedEvents.length === 0
              }
            >
              {createWebhook.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying endpoint…
                </>
              ) : (
                "Create Webhook"
              )}
            </Button>
            <Button
              variant="ghost"
              className="rounded-full"
              onClick={() => {
                setAddOpen(false);
                setUrl("");
                setSelectedEvents([]);
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* ── Add button ─────────────────────────────────────────────────── */}
      {!addOpen && (
        <Button
          variant="outline"
          className="rounded-full shadow-sm"
          onClick={() => setAddOpen(true)}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Webhook
        </Button>
      )}
    </div>
  );
}
