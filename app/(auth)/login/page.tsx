"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BlobAside } from "@/components/auth/BlobAside";
import { LoginForm } from "@/components/auth/LoginForm";
import { MfaVerifyStep } from "@/components/auth/MfaVerifyStep";
import { useAuth } from "@/context/auth-context";

export default function LoginPage() {
  const { loginWithCredentials, loginWithGoogle, loginWithToken } = useAuth();
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

  // 2FA state
  const [mfaToken, setMfaToken] = useState<string | null>(null);

  const handleFocus = (e: React.FocusEvent<HTMLElement>) => {
    setFocused(true);
    const target = e.target as HTMLInputElement;
    if (target.tagName === "INPUT") {
      setPasswordFocused(target.type === "password");
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLElement>) => {
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
      const result = await loginWithCredentials(email.trim(), password);
      if (result && "mfa_required" in result && result.mfa_required) {
        // Show the TOTP code step instead of redirecting
        setMfaToken(result.mfa_token);
        return;
      }
      if (result && "requires_2fa_setup" in result && result.requires_2fa_setup) {
        // Org requires 2FA — redirect straight to the security settings setup flow
        router.push("/dashboard/settings?tab=security&setup2fa=1");
        return;
      }
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

  const handleMfaSuccess = async (token: string) => {
    setSuccess(true);
    await loginWithToken(token);
    setTimeout(() => router.push("/dashboard"), 900);
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
          {mfaToken ? (
            <MfaVerifyStep
              mfaToken={mfaToken}
              onSuccess={handleMfaSuccess}
              onBack={() => setMfaToken(null)}
            />
          ) : (
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
          )}
        </div>
      </section>
    </main>
  );
}
