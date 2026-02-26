import Link from "next/link";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, TextInput } from "@/components/auth/ui/form-fields";

interface ForgotPasswordFormProps {
  email: string;
  setEmail: (v: string) => void;
  sent: boolean;
  onSubmit: (e: { preventDefault(): void }) => void;
  onResend: () => void;
}

export function ForgotPasswordForm({
  email,
  setEmail,
  sent,
  onSubmit,
  onResend,
}: ForgotPasswordFormProps) {
  if (sent) {
    return (
      <div className="py-6 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-muted text-brand">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h2 className="mt-5 text-xl font-semibold text-foreground">Check your inbox.</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          We&apos;ve sent a reset link to{" "}
          <span className="font-semibold text-foreground">{email}</span>.{" "}
          It expires in 30 minutes.
        </p>
        <button
          type="button"
          onClick={onResend}
          className="mt-5 text-sm font-semibold text-brand transition-colors hover:opacity-80"
        >
          Resend email
        </button>
        <div className="mt-4">
          <Link
            href="/login"
            className="text-sm text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground"
          >
            Back to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <Link
        href="/login"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to login
      </Link>

      <h1 className="mt-5 text-2xl font-semibold text-foreground">Reset your password.</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Enter your email and we&apos;ll send you a reset link.
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-5">
        <Field label="Email Address">
          <TextInput
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="you@company.com"
          />
        </Field>

        <Button
          type="submit"
          className="h-12 w-full rounded-full bg-primary text-primary-foreground font-bold transition-all hover:opacity-90 active:scale-[0.98] shadow-lg shadow-black/5"
        >
          Send Reset Link
        </Button>
      </form>
    </>
  );
}
