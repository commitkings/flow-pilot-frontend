"use client";

import { useState } from "react";
import { toast } from "sonner";
import { AuthAside } from "@/components/auth/AuthAside";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { forgotPassword } from "@/lib/api-client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      await forgotPassword(email.trim().toLowerCase());
      setSent(true);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const onResend = async () => {
    setSent(false);
    setLoading(true);
    try {
      await forgotPassword(email.trim().toLowerCase());
      setSent(true);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

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
            loading={loading}
            onSubmit={onSubmit}
            onResend={onResend}
          />
        </div>
      </section>
    </main>
  );
}
