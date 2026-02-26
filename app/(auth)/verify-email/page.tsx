"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { AuthAside } from "@/components/auth/AuthAside";
import { VerifyForm } from "@/components/auth/verify-email/VerifyForm";

const CODE_LENGTH = 6;
const INITIAL_SECONDS = 8 * 60 + 47;

export default function VerifyEmailPage() {
  const router = useRouter();

  const [code, setCode] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(INITIAL_SECONDS);
  const [resendLocked, setResendLocked] = useState(true);

  const formattedTime = `${String(Math.floor(secondsLeft / 60)).padStart(2, "0")}:${String(secondsLeft % 60).padStart(2, "0")}`;

  const onVerify = () => {

    router.push("/onboarding");
  };

  const onResend = () => {
    if (resendLocked) return;
    setCode("");
    setSecondsLeft(INITIAL_SECONDS);
    setResendLocked(true);
  };

  return (
    <main className="h-screen md:grid md:grid-cols-[420px_1fr]">
      <AuthAside
        title="One step away from your workspace."
        subtitle="Verify your email to activate your FlowPilot account."
      />
      <section className="flex items-center justify-center overflow-y-auto px-4 py-8 md:px-10">
        <VerifyForm
          email={'awwal@gmail.com'}
          formattedTime={formattedTime}
          resendLocked={resendLocked}
          allFilled={code.length === CODE_LENGTH}
          onCodeChange={setCode}
          onVerify={onVerify}
          onResend={onResend}
        />
      </section>
    </main>
  );
}
