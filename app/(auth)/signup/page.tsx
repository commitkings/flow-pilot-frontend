"use client";

import { useState } from "react";
import { AuthAside } from "@/components/auth/AuthAside";
import { AccountStep } from "@/components/auth/AccountStep";
import { useRegister } from "@/hooks/use-auth-mutations";

export default function SignupPage() {
  const registerMutation = useRegister();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [workEmail, setWorkEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const canContinue = !!(
    firstName.trim() && lastName.trim() && workEmail.trim() &&
    password.trim() && confirmPassword.trim() && password === confirmPassword
  );

  const onSubmit = (e: { preventDefault(): void }) => {
    e.preventDefault();
    setSubmitted(true);
    if (!canContinue) return;
    const name = `${firstName.trim()} ${lastName.trim()}`;
    registerMutation.mutate({ name, email: workEmail.trim().toLowerCase(), password });
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
            loading={registerMutation.isPending}
          />
        </div>
      </section>
    </main>
  );
}
