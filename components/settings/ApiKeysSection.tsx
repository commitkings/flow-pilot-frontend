"use client";

import { useState } from "react";
import {
  Check,
  Copy,
  Eye,
  KeyRound,
  Loader2,
  Mail,
  Plus,
  ShieldAlert,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useApiKeys, useCreateApiKey, useRevokeApiKey, useRequestApiKeyReveal, useVerifyApiKeyRevealOtp } from "@/hooks/use-api-key-queries";
import type { ApiKey } from "@/lib/api-developer";

const SCOPES = [
  { value: "runs:read", label: "Read payouts" },
  { value: "runs:write", label: "Create & manage payouts" },
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

  // First-time reveal after creation
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [keyCopied, setKeyCopied] = useState(false);

  // Re-reveal flow (OTP) for existing keys
  const [revealTarget, setRevealTarget] = useState<string | null>(null); // key id
  const [otpValue, setOtpValue] = useState("");
  const [revealedExistingKey, setRevealedExistingKey] = useState<{ id: string; raw: string } | null>(null);

  const requestRevealMut = useRequestApiKeyReveal(() => {/* OTP modal already shown */});
  const verifyOtpMut = useVerifyApiKeyRevealOtp((rawKey) => {
    setRevealedExistingKey({ id: revealTarget!, raw: rawKey });
    setRevealTarget(null);
    setOtpValue("");
  });

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

  const handleRevealClick = (keyId: string) => {
    setRevealTarget(keyId);
    setOtpValue("");
    requestRevealMut.mutate(keyId);
  };

  const handleCopyKey = () => {
    if (!revealedKey) return;
    navigator.clipboard.writeText(revealedKey);
    setKeyCopied(true);
    setTimeout(() => setKeyCopied(false), 2000);
  };

  return (
    <div className="space-y-5">

      {/* ── Re-reveal OTP panel (for existing keys) ─────────────────────── */}
      {revealTarget && (
        <div className="rounded-2xl border border-border/60 bg-card p-5 space-y-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand/10">
              <Mail className="h-4 w-4 text-brand" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-foreground">Check your email</p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                We sent a 6-digit code to your email. Enter it to reveal the key.
              </p>
            </div>
          </div>
          <div className="flex gap-2 items-center">
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={otpValue}
              onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="000000"
              className="h-10 w-36 rounded-full border border-border/60 bg-background px-4 font-mono text-sm text-center tracking-widest text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-brand focus:ring-1 focus:ring-brand/10"
            />
            <Button
              className="rounded-full bg-brand px-5 text-white shadow-sm hover:opacity-90"
              disabled={otpValue.length !== 6 || verifyOtpMut.isPending}
              onClick={() => verifyOtpMut.mutate({ keyId: revealTarget, otp: otpValue })}
            >
              {verifyOtpMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Reveal Key"}
            </Button>
            <button
              type="button"
              onClick={() => { setRevealTarget(null); setOtpValue(""); }}
              className="inline-flex items-center rounded-full border border-border/60 bg-transparent px-4 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:border-border hover:bg-muted/40 hover:text-foreground"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── Re-revealed existing key panel ──────────────────────────────── */}
      {revealedExistingKey && (
        <div className="rounded-2xl border border-border/60 bg-card p-5 space-y-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand/10">
              <ShieldAlert className="h-4 w-4 text-brand" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-foreground">Key revealed.</p>
              <p className="mt-0.5 text-sm text-muted-foreground">Copy and store it securely. Dismiss when done.</p>
            </div>
          </div>
          <div className="relative rounded-xl border border-border/60 bg-muted/30 px-4 py-3">
            <code className="block break-all font-mono text-sm text-foreground pr-10">{revealedExistingKey.raw}</code>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { navigator.clipboard.writeText(revealedExistingKey.raw); }}
              className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-transparent px-4 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:border-border hover:bg-muted/40 hover:text-foreground"
            >
              <Copy className="h-3.5 w-3.5" /> Copy Key
            </button>
            <button
              type="button"
              onClick={() => setRevealedExistingKey(null)}
              className="inline-flex items-center rounded-full border border-border/60 bg-transparent px-4 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:border-border hover:bg-muted/40 hover:text-foreground"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* ── Revealed key panel (first time, after creation) ─────────────── */}
      {/* ── Revealed key panel ──────────────────────────────────────────── */}
      {revealedKey && (
        <div className="rounded-2xl border border-border/60 bg-card p-5 space-y-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand/10">
              <ShieldAlert className="h-4 w-4 text-brand" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-foreground">Your new API key</p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Copy and store it securely. You can reveal it again anytime using the Reveal button — it will require email OTP verification.
              </p>
            </div>
          </div>
          <div className="relative rounded-xl border border-border/60 bg-muted/30 px-4 py-3">
            <code className="block break-all font-mono text-sm text-foreground pr-10">
              {revealedKey}
            </code>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCopyKey}
              className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-transparent px-4 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:border-border hover:bg-muted/40 hover:text-foreground"
            >
              {keyCopied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                  <span className="text-emerald-600">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  Copy Key
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => { setRevealedKey(null); setKeyCopied(false); }}
              className="inline-flex items-center rounded-full border border-border/60 bg-transparent px-4 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:border-border hover:bg-muted/40 hover:text-foreground"
            >
              Dismiss
            </button>
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
                      className="inline-flex items-center rounded-full border border-border/60 bg-muted/50 px-2.5 py-0.5 font-mono text-xs text-muted-foreground"
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
              <div className="flex shrink-0 gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-full text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                  onClick={() => handleRevealClick(key.id)}
                  disabled={requestRevealMut.isPending && revealTarget === key.id}
                  title="Reveal key (sends OTP to your email)"
                >
                  {requestRevealMut.isPending && revealTarget === key.id ? (
                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                  ) : (
                    <Eye className="mr-1.5 h-4 w-4" />
                  )}
                  Reveal
                </Button>
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
            <input
              placeholder='e.g. "Production Integration"'
              className="h-10 w-full rounded-full border border-border/60 bg-background px-4 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-brand focus:ring-1 focus:ring-brand/10"
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
              className="h-10 w-full rounded-full border border-border/60 bg-background px-4 text-sm text-foreground outline-none transition-all focus:border-brand focus:ring-1 focus:ring-brand/10 sm:max-w-xs"
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
            <button
              type="button"
              onClick={() => { setAddOpen(false); setName(""); setSelectedScopes([]); setExpiryDays(90); }}
              className="inline-flex items-center rounded-full border border-border/60 bg-transparent px-4 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:border-border hover:bg-muted/40 hover:text-foreground"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── Create button ───────────────────────────────────────────────── */}
      {!addOpen && (
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-transparent px-4 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:border-border hover:bg-muted/40 hover:text-foreground"
        >
          <Plus className="h-4 w-4" />
          Create API Key
        </button>
      )}
    </div>
  );
}
