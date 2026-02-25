"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!email.trim()) return;
    setSent(true);
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-8">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
        {!sent ? (
          <>
            <Link href="/login" className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900">
              <ArrowLeft className="h-4 w-4" />
              Back to login
            </Link>
            <h1 className="mt-5 text-2xl font-semibold text-slate-900">Reset your password.</h1>
            <p className="mt-2 text-sm text-slate-600">Enter your email and we&apos;ll send you a reset link.</p>

            <form onSubmit={onSubmit} className="mt-6 space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Email Address</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 rounded-xl"
                />
              </div>
              <Button type="submit" className="h-11 w-full rounded-xl bg-blue-600 text-white hover:bg-blue-700">
                Send Reset Link
              </Button>
            </form>
          </>
        ) : (
          <div className="py-6 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
            <h2 className="mt-4 text-2xl font-semibold text-slate-900">Check your inbox</h2>
            <p className="mt-2 text-sm text-slate-600">
              We&apos;ve sent a reset link to <span className="font-semibold text-slate-900">{email}</span>. It expires in 30 minutes.
            </p>
            <button type="button" className="mt-4 text-sm font-medium text-blue-600">
              Resend email
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
