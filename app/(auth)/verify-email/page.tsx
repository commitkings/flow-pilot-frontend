"use client";

import { KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import {
  clearPendingVerificationEmail,
  findUserByEmail,
  getPendingVerificationEmail,
  setCurrentUserEmail,
  upsertUser,
} from "@/lib/auth-storage";

const CODE_LENGTH = 6;
const INITIAL_SECONDS = 8 * 60 + 47;

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { login } = useAuth();
  const [digits, setDigits] = useState(Array<string>(CODE_LENGTH).fill(""));
  const [secondsLeft, setSecondsLeft] = useState(INITIAL_SECONDS);
  const [resendLocked, setResendLocked] = useState(true);

  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const email = useMemo(() => {
    const fromQuery = searchParams.get("email");
    return fromQuery ?? getPendingVerificationEmail() ?? "john@acmecorp.com";
  }, [searchParams]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setResendLocked(false);
          window.clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  const code = digits.join("");
  const formattedTime = `${String(Math.floor(secondsLeft / 60)).padStart(2, "0")}:${String(
    secondsLeft % 60
  ).padStart(2, "0")}`;

  const onDigitChange = (index: number, value: string) => {
    const cleaned = value.replace(/\D/g, "").slice(-1);
    setDigits((prev) => {
      const next = [...prev];
      next[index] = cleaned;
      return next;
    });

    if (cleaned && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const onKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const onResend = () => {
    if (resendLocked) return;
    setDigits(Array<string>(CODE_LENGTH).fill(""));
    setSecondsLeft(INITIAL_SECONDS);
    setResendLocked(true);
    inputRefs.current[0]?.focus();
  };

  const onVerify = () => {
    if (code.length !== CODE_LENGTH) return;

    const user = findUserByEmail(email);
    if (user) {
      upsertUser({ ...user, verified: true });
      setCurrentUserEmail(user.email);
      localStorage.setItem("flowpilot_onboarded", user.onboarded ? "true" : "false");
    }

    clearPendingVerificationEmail();
    login();
    router.push("/onboarding");
  };

  const allDigitsFilled = digits.every((digit) => digit.length === 1);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-8">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-blue-700">
          <MailCheck className="h-8 w-8" />
          <span className="absolute ml-10 mt-10 inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white">
            ✓
          </span>
        </div>

        <p className="mt-4 text-center text-lg font-semibold text-slate-900">Verify your business email.</p>
        <p className="mt-2 text-center text-sm leading-relaxed text-slate-600">
          We&apos;ve sent a 6-digit verification code to <span className="font-semibold text-slate-900">{email}</span>. Enter it below to activate your FlowPilot account.
        </p>

        <div className="mt-6 grid grid-cols-6 gap-2">
          {digits.map((digit, index) => (
            <input
              key={index}
              ref={(element) => {
                inputRefs.current[index] = element;
              }}
              value={digit}
              onChange={(event) => onDigitChange(index, event.target.value)}
              onKeyDown={(event) => onKeyDown(index, event)}
              className={`h-12 rounded-lg border text-center text-lg font-semibold outline-none transition ${
                allDigitsFilled
                  ? "border-emerald-500 focus:border-emerald-500"
                  : "border-slate-300 focus:border-blue-600"
              }`}
              maxLength={1}
              inputMode="numeric"
            />
          ))}
        </div>

        <p className="mt-4 text-center text-sm text-slate-500">Code expires in {formattedTime}</p>

        <Button
          type="button"
          onClick={onVerify}
          disabled={code.length !== CODE_LENGTH}
          className="mt-5 h-11 w-full rounded-xl bg-blue-600 text-white hover:bg-blue-700"
        >
          Verify Email
        </Button>

        <p className="mt-4 text-center text-sm text-slate-500">
          Didn&apos;t receive the code?{" "}
          <button
            type="button"
            onClick={onResend}
            disabled={resendLocked}
            className="font-medium text-blue-600 disabled:cursor-not-allowed disabled:text-slate-400"
          >
            Resend code
          </button>
        </p>

        <p className="mt-2 text-center text-sm">
          <Link href="/signup" className="text-slate-500 underline">
            Wrong email address? Go back
          </Link>
        </p>
      </div>
    </main>
  );
}
