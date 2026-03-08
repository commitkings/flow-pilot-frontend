"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthAside } from "@/components/auth/AuthAside";
import { LoginForm } from "@/components/auth/LoginForm";
import { useAuth } from "@/context/auth-context";

export default function LoginPage() {
  const { loginWithCredentials, loginWithGoogle } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    setSubmitted(true);
    if (!email.trim() || !password.trim()) return;
    setLoading(true);
    try {
      await loginWithCredentials(email.trim(), password);
      router.push("/dashboard");
    } catch {
      // error toast is handled in auth context
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="h-screen md:grid md:grid-cols-[420px_1fr]">
      <AuthAside
        title="Welcome back to FlowPilot."
        subtitle="Your agents are ready to work."
      />

      <section className="flex items-center overflow-y-auto px-4 py-8 md:px-10">
        <div className="mx-auto w-full max-w-md">
          <LoginForm
            email={email} setEmail={setEmail}
            password={password} setPassword={setPassword}
            rememberMe={rememberMe} setRememberMe={setRememberMe}
            showPassword={showPassword} onTogglePassword={() => setShowPassword((p) => !p)}
            loading={loading}
            credentialsError={false}
            submitted={submitted}
            onSubmit={onSubmit}
            onGoogle={loginWithGoogle}
          />
        </div>
      </section>
    </main>
  );
}
