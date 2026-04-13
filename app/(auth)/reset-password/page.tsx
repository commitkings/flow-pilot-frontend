"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { CheckCircle2, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, PasswordInput } from "@/components/ui/form-fields";
import { AuthAside } from "@/components/auth/AuthAside";
import { resetPassword } from "@/lib/api-client";

function ResetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) {
      toast.error("Invalid or missing reset token.");
    }
  }, [token]);

  const mismatch = confirmPassword.length > 0 && password !== confirmPassword;
  const canSubmit = !!(token && password.length >= 8 && password === confirmPassword);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    try {
      await resetPassword(token, password);
      setDone(true);
      setTimeout(() => router.push("/login"), 2500);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Invalid or expired reset link.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="flex flex-col items-start w-full">
        <div className="flex items-center gap-3 rounded-2xl border border-green-200 bg-green-50 px-5 py-4">
          <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />
          <p className="text-sm font-medium text-green-800">
            Password reset! Redirecting you to login&hellip;
          </p>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="flex flex-col items-start w-full">
        <p className="text-sm text-destructive">
          This reset link is invalid. Please request a new one.
        </p>
        <Link
          href="/forgot-password"
          className="mt-4 text-sm font-semibold text-brand hover:opacity-80"
        >
          Request a new link
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-start w-full">
      <div className="flex w-full items-center justify-between border-b border-border/50 pb-6">
        <Link
          href="/login"
          className="group inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-brand"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand/10 text-brand border border-brand/20">
            <ChevronLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1" />
          </div>
        </Link>
        <div className="h-10 w-10" />
      </div>

      <div className="mt-8 w-full">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
          Choose a new password.
        </h1>
        <p className="mt-2 text-sm font-medium text-muted-foreground">
          At least 8 characters. You&apos;ll be logged in after resetting.
        </p>

        <form onSubmit={onSubmit} className="mt-10 w-full space-y-6">
          <Field label="New Password">
            <PasswordInput
              value={password}
              onChange={setPassword}
              show={showPassword}
              onToggle={() => setShowPassword((p) => !p)}
              placeholder="••••••••"
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
            Reset Password
          </Button>
        </form>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="h-screen md:grid md:grid-cols-[420px_1fr]">
      <AuthAside
        title="Secure your account."
        subtitle="Choose a strong password to keep your organisation safe."
      />
      <section className="flex items-center justify-center overflow-y-auto px-4 py-8 md:px-10">
        <div className="w-full max-w-md">
          <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-muted/30" />}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </section>
    </main>
  );
}
