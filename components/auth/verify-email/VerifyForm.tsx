import Link from "next/link";
import { MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OtpInput } from "@/components/auth/ui/form-fields";

interface VerifyFormProps {
  email: string;
  formattedTime: string;
  resendLocked: boolean;
  allFilled: boolean;
  onCodeChange: (code: string) => void;
  onVerify: () => void;
  onResend: () => void;
}

export function VerifyForm({
  email,
  formattedTime,
  resendLocked,
  allFilled,
  onCodeChange,
  onVerify,
  onResend,
}: VerifyFormProps) {
  return (
    <div className="mx-auto w-full max-w-md">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-muted text-brand">
        <MailCheck className="h-8 w-8" />
      </div>

      <p className="mt-5 text-center text-xl font-semibold text-foreground">
        Verify your business email.
      </p>
      <p className="mt-2 text-center text-sm leading-relaxed text-muted-foreground">
        We&apos;ve sent a 6-digit code to{" "}
        <span className="font-semibold text-foreground">{email}</span>.
      </p>

      <div className="mt-8">
        <OtpInput length={6} onChange={onCodeChange} />
      </div>

      <p className="mt-3 text-center text-sm text-muted-foreground">
        Code expires in{" "}
        <span className="font-semibold tabular-nums text-foreground">{formattedTime}</span>
      </p>

      <Button
        type="button"
        onClick={onVerify}
        disabled={!allFilled}
        className="mt-6 h-12 w-full rounded-full bg-primary text-primary-foreground font-bold transition-all hover:opacity-90 active:scale-[0.98] shadow-lg shadow-black/5"
      >
        Verify Email
      </Button>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        Didn&apos;t receive the code?{" "}
        <button
          type="button"
          onClick={onResend}
          disabled={resendLocked}
          className="font-semibold text-brand transition-colors hover:opacity-80 disabled:cursor-not-allowed disabled:text-muted-foreground/50"
        >
          Resend code
        </button>
      </p>

      <p className="mt-2 text-center text-sm">
        <Link href="/signup" className="text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground">
          Wrong email address? Go back
        </Link>
      </p>
    </div>
  );
}
