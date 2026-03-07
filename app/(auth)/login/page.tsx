"use client";

import { useState } from "react";
import { AuthAside } from "@/components/auth/AuthAside";
import { LoginForm } from "@/components/auth/LoginForm";
import { useLogin } from "@/hooks/use-auth-mutations";
import { useAuth } from "@/context/auth-context";

export default function LoginPage() {
  const { loginWithGoogle } = useAuth();
  const loginMutation = useLogin();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const onSubmit = (e: { preventDefault(): void }) => {
    e.preventDefault();
    setSubmitted(true);
    if (!email.trim() || !password.trim()) return;
    loginMutation.mutate({ email: email.trim(), password });
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
            loading={loginMutation.isPending}
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
