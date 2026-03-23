import Link from "next/link";
import { CheckCircle2, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, TextInput } from "@/components/ui/form-fields";

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
  
  const BackNavigation = (
    <Link
      href="/login"
      className="group inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-brand"
    >
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand/10 text-brand border border-brand/20">
        <ChevronLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1" />
      </div>
    </Link>
  );

  if (sent) {
    return (
      <div className="flex flex-col items-start w-full">
        <div className="flex w-full items-center justify-between pb-6">
          {BackNavigation}
          {/* <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand/10 text-brand">
            <CheckCircle2 className="h-4 w-4" />
          </div> */}
        </div>
        
        <div className="mt-8 w-full text-left">
          <h2 className="text-3xl font-extrabold tracking-tight text-foreground">
            Check your inbox.
          </h2>
          
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground max-w-[90%]">
            We&apos;ve sent a reset link to{" "}
            <span className="font-bold text-foreground">{email}</span>.{" "}
            It expires in 30 minutes.
          </p>

          <div className="mt-8">
            <button
              type="button"
              onClick={onResend}
              className="text-[11px] font-semibold uppercase tracking-widest text-brand transition-all hover:opacity-70 active:scale-95"
            >
              Didn&apos;t get the email? Resend
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-start w-full">
      <div className="flex w-full items-center justify-between border-b border-border/50 pb-6">
        {BackNavigation}
        {/* Placeholder or empty div to maintain spacing if no icon is needed here */}
        <div className="h-10 w-10" /> 
      </div>

      <div className="mt-8 w-full">
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
          Reset password.
        </h1>
        
        <p className="mt-2 text-sm font-medium text-muted-foreground">
          Enter your email and we&apos;ll send you a reset link.
        </p>

        <form onSubmit={onSubmit} className="mt-10 w-full space-y-6">
          <Field label="Work Email">
            <TextInput
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="you@company.com"
              required
            />
          </Field>

          <Button
            type="submit"
            className="h-12 w-full rounded-full bg-primary text-primary-foreground font-bold transition-all hover:opacity-90 active:scale-[0.98] shadow-lg shadow-black/5"
          >
            Send Reset Link
          </Button>
        </form>
      </div>
    </div>
  );
}