"use client";

import { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  KeyRound,
  Loader2,
  Plus,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useApiKeys, useCreateApiKey, useRevokeApiKey } from "@/hooks/use-api-key-queries";
import type { ApiKey } from "@/lib/api-developer";

const SCOPES = [
  { value: "runs:read", label: "Read runs" },
  { value: "runs:write", label: "Create & manage runs" },
  { value: "approvals:read", label: "Read approvals" },
  { value: "approvals:write", label: "Submit approvals" },
  { value: "transactions:read", label: "Read transactions" },
  { value: "audit:read", label: "Read audit logs" },
] as const;

const EXPIRY_OPTIONS = [
  { label: "30 days", value: 30 },
  { label: "90 days", value: 90 },
  { label: "365 days", value: 365 },
  { label: "Never", value: 0 },
] as const;

function formatDate(iso: string | null): string {
  if (!iso) return "Never";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function ApiKeysSection() {
  const keysQuery = useApiKeys();
  const createKeyMut = useCreateApiKey();
  const revokeKeyMut = useRevokeApiKey();

  const [addOpen, setAddOpen] = useState(false);
  const [name, setName] = useState("");
  const [selectedScopes, setSelectedScopes] = useState<string[]>([]);
  const [expiryDays, setExpiryDays] = useState<number>(90);

  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [keyCopied, setKeyCopied] = useState(false);

  const keys: ApiKey[] = keysQuery.data?.keys ?? [];

  const toggleScope = (scope: string) => {
    setSelectedScopes((prev) =>
      prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope]
    );
  };

  const handleCreate = () => {
    if (!name || selectedScopes.length === 0) return;
    createKeyMut.mutate(
      {
        name,
        scopes: selectedScopes,
        ...(expiryDays > 0 ? { expires_in_days: expiryDays } : {}),
      },
      {
        onSuccess: (data) => {
          setRevealedKey(data.raw_key);
          setName("");
          setSelectedScopes([]);
          setExpiryDays(90);
          setAddOpen(false);
        },
      }
    );
  };

  const handleCopyKey = () => {
    if (!revealedKey) return;
    navigator.clipboard.writeText(revealedKey);
    setKeyCopied(true);
    setTimeout(() => setKeyCopied(false), 2000);
  };

  return (
    <div className="space-y-5">
      {/* ── Revealed key panel ──────────────────────────────────────────── */}
      {revealedKey && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-5 space-y-3 shadow-sm dark:border-amber-700 dark:bg-amber-950/20">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-amber-900 dark:text-amber-200">
                This key is shown only once.
              </p>
              <p className="mt-0.5 text-sm text-amber-700 dark:text-amber-300">
                Copy and store it securely. You won&apos;t be able to see it again.
              </p>
            </div>
          </div>
          <code className="block break-all rounded-xl border border-amber-200 bg-white px-4 py-3 font-mono text-sm text-foreground dark:border-amber-800 dark:bg-amber-950/40">
            {revealedKey}
          </code>
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="rounded-full shadow-sm"
              onClick={handleCopyKey}
            >
              {keyCopied ? (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4 text-teal-600" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy Key
                </>
              )}
            </Button>
            <Button
              variant="ghost"
              className="rounded-full"
              onClick={() => {
                setRevealedKey(null);
                setKeyCopied(false);
              }}
            >
              Dismiss
            </Button>
          </div>
        </div>
      )}

      {/* ── Existing keys list ──────────────────────────────────────────── */}
      {keysQuery.isLoading ? (
        <div className="py-8 text-center">
          <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : keys.length === 0 && !addOpen ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-border/60 bg-muted/20 py-12 text-center shadow-sm">
          <KeyRound className="h-8 w-8 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            No API keys. Create one to integrate FlowPilot with your systems.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {keys.map((key) => (
            <div
              key={key.id}
              className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-card p-4 shadow-sm transition-all hover:border-brand/30 sm:flex-row sm:items-start sm:justify-between"
            >
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-foreground">{key.name}</p>
                  <code className="rounded-lg border border-border/60 bg-muted px-2.5 py-0.5 font-mono text-xs text-muted-foreground">
                    {key.prefix}
                  </code>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {key.scopes.map((scope) => (
                    <span
                      key={scope}
                      className="inline-flex items-center rounded-full border border-violet-200 bg-violet-50 px-2.5 py-0.5 font-mono text-xs text-violet-700 dark:border-violet-800 dark:bg-violet-950/30 dark:text-violet-300"
                    >
                      {scope}
                    </span>
                  ))}
                </div>
                <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                  <span>
                    Created{" "}
                    <span className="font-medium text-foreground">
                      {formatDate(key.created_at)}
                    </span>
                  </span>
                  <span>
                    Last used{" "}
                    <span className="font-medium text-foreground">
                      {formatDate(key.last_used_at)}
                    </span>
                  </span>
                  <span>
                    Expires{" "}
                    <span className="font-medium text-foreground">
                      {formatDate(key.expires_at)}
                    </span>
                  </span>
                </div>
              </div>
              <div className="shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-full text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => revokeKeyMut.mutate(key.id)}
                  disabled={revokeKeyMut.isPending}
                >
                  <Trash2 className="mr-1.5 h-4 w-4" />
                  Revoke
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Create key inline form ──────────────────────────────────────── */}
      {addOpen && (
        <div className="rounded-2xl border border-border/60 bg-card p-5 space-y-4 shadow-sm">
          <h3 className="text-sm font-bold text-foreground">New API Key</h3>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Key Name</label>
            <Input
              placeholder='e.g. "Production Integration"'
              className="h-10 rounded-xl"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Permissions (Scopes)</label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {SCOPES.map(({ value, label }) => (
                <label
                  key={value}
                  className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-border/60 px-3 py-2.5 text-sm transition-colors hover:bg-muted/40 has-[:checked]:border-brand/40 has-[:checked]:bg-brand/5"
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-brand"
                    checked={selectedScopes.includes(value)}
                    onChange={() => toggleScope(value)}
                  />
                  <span className="font-mono text-xs text-foreground">{value}</span>
                  <span className="ml-auto text-xs text-muted-foreground">{label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Expiry</label>
            <select
              value={expiryDays}
              onChange={(e) => setExpiryDays(Number(e.target.value))}
              className="h-10 w-full rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-brand sm:max-w-xs"
            >
              {EXPIRY_OPTIONS.map(({ label, value }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 pt-1">
            <Button
              className="rounded-full bg-brand px-6 text-white shadow-sm hover:opacity-90"
              onClick={handleCreate}
              disabled={createKeyMut.isPending || !name || selectedScopes.length === 0}
            >
              {createKeyMut.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Generate Key
            </Button>
            <Button
              variant="ghost"
              className="rounded-full"
              onClick={() => {
                setAddOpen(false);
                setName("");
                setSelectedScopes([]);
                setExpiryDays(90);
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* ── Create button ───────────────────────────────────────────────── */}
      {!addOpen && (
        <Button
          variant="outline"
          className="rounded-full shadow-sm"
          onClick={() => setAddOpen(true)}
        >
          <Plus className="mr-2 h-4 w-4" />
          Create API Key
        </Button>
      )}
    </div>
  );
}
