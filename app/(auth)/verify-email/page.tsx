"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { AuthAside } from "@/components/auth/AuthAside";
import { VerifyForm } from "@/components/auth/VerifyForm";
import { useAuth } from "@/context/auth-context";
import { verifyEmail, resendVerification } from "@/lib/api-client";

const CODE_LENGTH = 6;
const RESEND_COOLDOWN = 8 * 60 + 47; // 8 min 47 s — matches design

export default function VerifyEmailPage() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(RESEND_COOLDOWN);
  const [resendLocked, setResendLocked] = useState(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Countdown for the resend button
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(timerRef.current!);
          setResendLocked(false);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, []);

  // If user is already verified, skip this page
  useEffect(() => {
    if (user?.email_verified) {
      router.replace(user.has_completed_onboarding ? "/dashboard" : "/onboarding");
    }
  }, [user, router]);

  const formattedTime = `${String(Math.floor(secondsLeft / 60)).padStart(2, "0")}:${String(secondsLeft % 60).padStart(2, "0")}`;

  const onVerify = async () => {
    if (code.length !== CODE_LENGTH) return;
    setLoading(true);
    try {
      await verifyEmail(code);
      toast.success("Email verified!");
      const me = await refreshUser();
      router.replace(me?.has_completed_onboarding ? "/dashboard" : "/onboarding");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Invalid or expired code.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const onResend = async () => {
    if (resendLocked) return;
    try {
      await resendVerification();
      toast.success("A new code has been sent to your email.");
      setCode("");
      setSecondsLeft(RESEND_COOLDOWN);
      setResendLocked(true);

      // Restart countdown
      clearInterval(timerRef.current!);
      timerRef.current = setInterval(() => {
        setSecondsLeft((s) => {
          if (s <= 1) {
            clearInterval(timerRef.current!);
            setResendLocked(false);
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    } catch {
      toast.error("Could not resend code. Please try again.");
    }
  };

  return (
    <main className="h-screen md:grid md:grid-cols-[420px_1fr]">
      <AuthAside
        title="One step away from your workspace."
        subtitle="Verify your email to activate your FlowPilot account."
      />
      <section className="flex items-center justify-center overflow-y-auto px-4 py-8 md:px-10">
        <VerifyForm
          email={user?.email ?? "your email"}
          formattedTime={formattedTime}
          resendLocked={resendLocked || loading}
          allFilled={code.length === CODE_LENGTH && !loading}
          code={code}
          onCodeChange={setCode}
          onVerify={onVerify}
          onResend={onResend}
        />
      </section>
    </main>
  );
}
