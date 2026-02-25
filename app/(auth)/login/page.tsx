"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { findUserByEmail, setCurrentUserEmail } from "@/lib/auth-storage";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [credentialsError, setCredentialsError] = useState(false);

  const emailEmpty = submitted && email.trim().length === 0;
  const passwordEmpty = submitted && password.trim().length === 0;

  const doLoginRedirect = (onboarded: boolean) => {
    localStorage.setItem("flowpilot_onboarded", onboarded ? "true" : "false");
    router.push(onboarded ? "/dashboard/runs" : "/onboarding");
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    setCredentialsError(false);

    if (email.trim().length === 0 || password.trim().length === 0) {
      return;
    }

    const user = findUserByEmail(email);
    if (!user || user.password !== password || !user.verified) {
      setCredentialsError(true);
      return;
    }

    setLoading(true);
    setCurrentUserEmail(user.email);

    if (rememberMe) {
      localStorage.setItem("flowpilot_remember_email", user.email);
    } else {
      localStorage.removeItem("flowpilot_remember_email");
    }
  };

  const onGoogle = () => {
    const emailFromRemember = localStorage.getItem("flowpilot_remember_email") ?? "demo@flowpilot.io";
    const user = findUserByEmail(emailFromRemember);
    if (user) {
      setCurrentUserEmail(user.email);
      doLoginRedirect(user.onboarded);
      return;
    }

    setCurrentUserEmail("demo@flowpilot.io");
    router.push("/onboarding");
  };

  return (
    <main className="min-h-screen bg-slate-50 md:grid md:grid-cols-[420px_1fr]">
      <aside className="hidden bg-slate-950 px-10 py-12 text-white md:flex md:flex-col">
        <Link href="/" className="text-xl font-semibold tracking-tight">
          FlowPilot
        </Link>
        <h1 className="mt-16 text-3xl font-semibold leading-tight">Welcome back to FlowPilot.</h1>
        <p className="mt-3 text-sm text-slate-300">Your agents are ready to work.</p>
      </aside>

      <section className="flex items-center px-4 py-8 md:px-10">
        <div className="mx-auto w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <h2 className="text-2xl font-semibold text-slate-900">Log in to your workspace.</h2>
          <p className="mt-2 text-sm text-slate-600">Enter your credentials to access your dashboard.</p>

          {credentialsError && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              Wrong credentials. Check your email/password or verify your email first.
            </div>
          )}

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <Button type="button" variant="outline" onClick={onGoogle} className="h-11 w-full rounded-xl border-slate-300">
              Continue with Google
            </Button>

            <div className="relative text-center text-sm text-slate-500">
              <span className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-slate-200" />
              <span className="relative bg-white px-3">or continue with email</span>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Work Email</label>
              <Input
                type="email"
                value={email}
                placeholder="you@company.com"
                onChange={(e) => setEmail(e.target.value)}
                className="h-11 rounded-xl"
              />
              {emailEmpty && <p className="mt-1 text-xs text-red-600">Email is required.</p>}
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Password</label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 rounded-xl pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {passwordEmpty && <p className="mt-1 text-xs text-red-600">Password is required.</p>}
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-slate-600">
                <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
                Remember me
              </label>
              <Link href="/forgot-password" className="font-medium text-blue-600">
                Forgot password?
              </Link>
            </div>

            <Button type="submit" disabled={loading} className="h-11 w-full rounded-xl bg-blue-600 text-white hover:bg-blue-700">
              {loading ? "Logging in..." : "Log In"}
            </Button>

            <p className="text-center text-sm text-slate-600">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="font-medium text-blue-600">
                Sign up free
              </Link>
            </p>

            <p className="pt-3 text-center text-xs text-slate-500">
              Protected by 256-bit encryption · SOC 2 compliant.
            </p>
          </form>
        </div>
      </section>
    </main>
  );
}
