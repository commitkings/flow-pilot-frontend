"use client";

import { useState } from "react";
import { AuthAside } from "@/components/auth/AuthAside";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const onSubmit = (e: { preventDefault(): void }) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSent(true);
  };

  const onResend = () => setSent(false);

  return (
    <main className="h-screen md:grid md:grid-cols-[420px_1fr]">
      <AuthAside
        title="Reset your password in seconds."
        subtitle="We'll send you a secure link to get back on track."
      />
      <section className="flex items-center justify-center overflow-y-auto px-4 py-8 md:px-10">
        <div className="w-full max-w-md">
          <ForgotPasswordForm
            email={email}
            setEmail={setEmail}
            sent={sent}
            onSubmit={onSubmit}
            onResend={onResend}
          />
        </div>
      </section>
    </main>
  );
}
