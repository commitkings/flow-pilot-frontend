"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BlobAside } from "@/components/auth/BlobAside";
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
  const [focused, setFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [invalid, setInvalid] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleFocus = (e: React.FocusEvent<HTMLElement>) => {
    setFocused(true);
    const target = e.target as HTMLInputElement;
    // Only update passwordFocused for actual inputs, not buttons
    if (target.tagName === "INPUT") {
      setPasswordFocused(target.type === "password");
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLElement>) => {
    // Only clear state when focus leaves the section entirely
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setFocused(false);
      setPasswordFocused(false);
    }
  };

  const onSubmit = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    setSubmitted(true);
    if (!email.trim() || !password.trim()) return;
    setLoading(true);
    try {
      await loginWithCredentials(email.trim(), password);
      setSuccess(true);
      setTimeout(() => router.push("/dashboard"), 900);
    } catch {
      setInvalid(false);
      requestAnimationFrame(() => setInvalid(true));
      setTimeout(() => setInvalid(false), 700);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="h-screen md:grid md:grid-cols-[40%_60%]">
      <BlobAside
        focused={focused}
        passwordFocused={passwordFocused}
        showPassword={showPassword}
        invalid={invalid}
        success={success}
      />

      <section
        className="flex items-center overflow-y-auto px-4 py-8 md:px-10"
        onFocus={handleFocus}
        onBlur={handleBlur}
      >
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
