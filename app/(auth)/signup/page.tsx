"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthAside } from "@/components/auth/AuthAside";
import { AccountStep } from "@/components/auth/AccountStep";
import { useAuth } from "@/context/auth-context";

export default function SignupPage() {
  const { registerUser } = useAuth();
  const router = useRouter();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [workEmail, setWorkEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const canContinue = !!(
    firstName.trim() && lastName.trim() && workEmail.trim() &&
    password.trim() && confirmPassword.trim() && password === confirmPassword
  );

  const onSubmit = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    setSubmitted(true);
    if (!canContinue) return;
    setLoading(true);
    try {
      const name = `${firstName.trim()} ${lastName.trim()}`;
      await registerUser(name, workEmail.trim().toLowerCase(), password);
      router.push("/onboarding");
    } catch {
      // error toast is handled in auth context
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen md:grid md:grid-cols-[420px_1fr] h-screen">
      <AuthAside
        title="Built for businesses that move money at scale."
        features={[
          "AI-powered transaction reconciliation",
          "Risk-scored payout verification",
          "Full audit trail on every run.",
        ]}
        testimonial={{
          quote: "FlowPilot cut our month-end close from 2 days to 2 hours.",
          author: "Fictional CFO, Acme Retail",
        }}
      />

      <section className="px-4 py-8 md:px-10 md:py-12 overflow-y-auto">
        <div className="mx-auto w-full max-w-md rounded-2xl md:p-8">
          <AccountStep
            firstName={firstName} setFirstName={setFirstName}
            lastName={lastName} setLastName={setLastName}
            workEmail={workEmail} setWorkEmail={setWorkEmail}
            password={password} setPassword={setPassword}
            confirmPassword={confirmPassword} setConfirmPassword={setConfirmPassword}
            showPassword={showPassword} onTogglePassword={() => setShowPassword((p) => !p)}
            showConfirm={showConfirm} onToggleConfirm={() => setShowConfirm((p) => !p)}
            passwordMismatch={submitted && confirmPassword.length > 0 && password !== confirmPassword}
            onSubmit={onSubmit}
            loading={loading}
          />
        </div>
      </section>
    </main>
  );
}
