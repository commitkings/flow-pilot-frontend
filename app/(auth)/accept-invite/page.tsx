"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, PasswordInput, TextInput } from "@/components/ui/form-fields";
import { AuthAside } from "@/components/auth/AuthAside";
import { getInviteDetails, registerViaInvite } from "@/lib/api-client";
import { setToken } from "@/lib/token-storage";
import type { InviteDetails } from "@/lib/api-types";

function RoleBadge({ role }: { role: string }) {
  return (
    <span className="inline-flex items-center rounded-full bg-brand/10 px-3 py-0.5 text-xs font-semibold uppercase tracking-wider text-brand">
      {role}
    </span>
  );
}

function AcceptInviteForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";

  const [invite, setInvite] = useState<InviteDetails | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) {
      setFetchError("Invalid or missing invitation link.");
      return;
    }
    getInviteDetails(token)
      .then(setInvite)
      .catch(() => setFetchError("Invitation not found or has expired."));
  }, [token]);

  const mismatch = confirmPassword.length > 0 && password !== confirmPassword;
  const canSubmit = !!(
    firstName.trim() &&
    lastName.trim() &&
    password.length >= 8 &&
    password === confirmPassword
  );

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    try {
      const data = await registerViaInvite({
        token,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        password,
      });
      if (data.requires_2fa_setup && data.token) {
        // Store the token so the auth context picks it up on the next page load,
        // then send the user straight to the 2FA setup flow.
        setToken(data.token);
        router.push("/dashboard/settings?tab=security&setup2fa=1");
        return;
      }
      // Don't auto-login — require the user to log in manually so they
      // go through the normal auth flow into the correct business dashboard.
      setDone(true);
      setTimeout(() => router.push("/login"), 2000);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Something went wrong. Please try again.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  // ── Loading state ──────────────────────────────────────────────────────────
  if (!invite && !fetchError) {
    return (
      <div className="space-y-4">
        <div className="h-6 w-48 animate-pulse rounded-full bg-muted/50" />
        <div className="h-4 w-64 animate-pulse rounded-full bg-muted/40" />
        <div className="mt-8 space-y-4">
          <div className="h-12 animate-pulse rounded-full bg-muted/30" />
          <div className="h-12 animate-pulse rounded-full bg-muted/30" />
        </div>
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────────
  if (fetchError || !invite) {
    return (
      <div className="flex flex-col items-start gap-4">
        <p className="text-sm text-destructive">{fetchError}</p>
        <Link
          href="/login"
          className="text-sm font-semibold text-brand hover:opacity-80"
        >
          Go to login
        </Link>
      </div>
    );
  }

  // ── Already accepted ───────────────────────────────────────────────────────
  if (invite.status === "accepted") {
    return (
      <div className="flex flex-col items-start gap-4">
        <div className="flex items-center gap-3 rounded-2xl border border-green-200 bg-green-50 px-5 py-4">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />
          <p className="text-sm font-medium text-green-800">
            This invitation has already been accepted.
          </p>
        </div>
        <Link
          href="/login"
          className="text-sm font-semibold text-brand hover:opacity-80"
        >
          Log in to {invite.business_name ?? "your organisation"}
        </Link>
      </div>
    );
  }

  // ── Expired ────────────────────────────────────────────────────────────────
  if (invite.status === "expired") {
    return (
      <div className="flex flex-col items-start gap-4">
        <p className="text-2xl font-extrabold tracking-tight text-foreground">
          Invitation expired.
        </p>
        <p className="text-sm text-muted-foreground">
          This invite link is no longer valid. Ask{" "}
          {invite.inviter_name ? (
            <strong>{invite.inviter_name}</strong>
          ) : (
            "your team admin"
          )}{" "}
          to send a new one.
        </p>
        <Link
          href="/login"
          className="text-sm font-semibold text-brand hover:opacity-80"
        >
          Go to login
        </Link>
      </div>
    );
  }

  // ── Success state (after registration) ────────────────────────────────────
  if (done) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3 rounded-2xl border border-green-200 bg-green-50 px-5 py-4">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />
          <p className="text-sm font-medium text-green-800">
            Account created! Taking you to the login page&hellip;
          </p>
        </div>
        <p className="text-xs text-muted-foreground text-center">
          Log in with your email and the password you just set.
        </p>
      </div>
    );
  }

  // ── Registration form ──────────────────────────────────────────────────────
  return (
    <div className="flex flex-col items-start w-full">
      {/* Invite context */}
      <div className="mb-8 w-full rounded-2xl border border-border bg-muted/30 px-5 py-4">
        <p className="text-xs font-black uppercase tracking-wider text-muted-foreground/80 mb-1">
          You&apos;re joining
        </p>
        <p className="text-base font-bold text-foreground">
          {invite.business_name}
        </p>
        <div className="mt-2 flex items-center gap-2">
          <RoleBadge role={invite.role} />
          {invite.inviter_name && (
            <span className="text-xs text-muted-foreground">
              invited by <strong>{invite.inviter_name}</strong>
            </span>
          )}
        </div>
        <p className="mt-1.5 text-xs text-muted-foreground">
          Joining as{" "}
          <span className="font-semibold text-foreground">{invite.invited_email}</span>
        </p>
      </div>

      <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
        Create your account.
      </h1>
      <p className="mt-2 text-sm font-medium text-muted-foreground">
        Set up your name and password to get started.
      </p>

      <form onSubmit={onSubmit} className="mt-8 w-full space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="First Name">
            <TextInput
              value={firstName}
              onChange={setFirstName}
              placeholder="First name"
              required
            />
          </Field>
          <Field label="Last Name">
            <TextInput
              value={lastName}
              onChange={setLastName}
              placeholder="Last name"
              required
            />
          </Field>
        </div>

        <Field label="Password">
          <PasswordInput
            value={password}
            onChange={setPassword}
            show={showPassword}
            onToggle={() => setShowPassword((p) => !p)}
            placeholder="Min. 8 characters"
            required
          />
        </Field>

        <Field label="Confirm Password">
          <PasswordInput
            value={confirmPassword}
            onChange={setConfirmPassword}
            show={showConfirm}
            onToggle={() => setShowConfirm((p) => !p)}
            placeholder="••••••••"
            error={mismatch}
            required
          />
          {mismatch && (
            <p className="mt-1 text-xs text-destructive">
              Passwords don&apos;t match
            </p>
          )}
        </Field>

        <Button
          type="submit"
          disabled={!canSubmit || loading}
          loading={loading}
          className="h-12 w-full rounded-full bg-primary text-primary-foreground font-bold transition-all hover:opacity-90 active:scale-[0.98] shadow-lg shadow-black/5"
        >
          Join {invite.business_name ?? "Organisation"}
        </Button>

        <p className="text-center text-sm font-medium text-muted-foreground">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-bold text-brand transition-colors hover:opacity-80"
          >
            Log In
          </Link>
        </p>
      </form>
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <main className="h-screen md:grid md:grid-cols-[420px_1fr]">
      <AuthAside
        title="You've been invited."
        subtitle="Set up your account and start collaborating on payouts."
        features={[
          "View and approve payout runs for your organisation",
          "AI-powered risk scoring flags suspicious transactions",
          "Collaborate with your team in real time",
        ]}
      />
      <section className="flex items-center justify-center overflow-y-auto px-4 py-8 md:px-10">
        <div className="w-full max-w-md">
          <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-muted/30" />}>
            <AcceptInviteForm />
          </Suspense>
        </div>
      </section>
    </main>
  );
}
