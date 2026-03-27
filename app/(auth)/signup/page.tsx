"use client";

import { useState } from "react";
import { toast } from "sonner";
import { BlobAside } from "@/components/auth/BlobAside";
import { AccountStep } from "@/components/auth/AccountStep";
import { useAuth } from "@/context/auth-context";

export default function SignupPage() {
  const { registerUser } = useAuth();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [workEmail, setWorkEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [invalid, setInvalid] = useState(false);
  const [success, setSuccess] = useState(false);

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

  const canContinue = !!(
    firstName.trim() && lastName.trim() && workEmail.trim() &&
    password.trim() && confirmPassword.trim() && password === confirmPassword
  );

  const onSubmit = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    setSubmitted(true);
    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      setInvalid(false);
      requestAnimationFrame(() => setInvalid(true));
      setTimeout(() => setInvalid(false), 700);
      return;
    }
    if (!canContinue) return;
    setLoading(true);
    try {
      const name = `${firstName.trim()} ${lastName.trim()}`;
      await registerUser(name, workEmail.trim().toLowerCase(), password);
      setSuccess(true);
    } catch {
      // error toast is handled in auth context
    } finally {
      setLoading(false);
    }
  };

  // Either password field being shown counts as showPassword for the blobs
  const eitherPasswordShown = showPassword || showConfirm;

  return (
    <main className="h-screen md:grid md:grid-cols-[40%_60%]">
      <BlobAside
        focused={focused}
        passwordFocused={passwordFocused}
        showPassword={eitherPasswordShown}
        invalid={invalid}
        success={success}
      />

      <section
        className="flex items-center overflow-y-auto px-4 py-8 md:px-10"
        onFocus={handleFocus}
        onBlur={handleBlur}
      >
        <div className="mx-auto w-full max-w-md">
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
