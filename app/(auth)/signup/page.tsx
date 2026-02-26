"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthAside } from "@/components/auth/AuthAside";
import { AccountStep } from "@/components/auth/signup/AccountStep";
import { BusinessStep } from "@/components/auth/signup/BusinessStep";
import { setPendingVerificationEmail, upsertUser } from "@/lib/auth-storage";
import { StepIndicator } from "@/components/ui/StepIndicator";

const SIGNUP_STEPS = ["Your Account", "Business Info"];

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);

  // Step 1
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [workEmail, setWorkEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [step1Submitted, setStep1Submitted] = useState(false);

  // Step 2
  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [taxId, setTaxId] = useState("");
  const [businessAddress, setBusinessAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [businessPhone, setBusinessPhone] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [step2Submitted, setStep2Submitted] = useState(false);


  const canContinue = !!(
    firstName.trim() && lastName.trim() && workEmail.trim() &&
    password.trim() && confirmPassword.trim() && password === confirmPassword
  );

  const canSubmit = !!(
    businessName.trim() && businessType && registrationNumber.trim() &&
    taxId.trim() && businessAddress.trim() && city.trim() && state &&
    postalCode.trim() && businessPhone.trim() && acceptedTerms
  );

  const onContinue = (e: { preventDefault(): void }) => {
    e.preventDefault();
    setStep1Submitted(true);
    if (!canContinue) return;
    setStep(2);
  };

  const onSubmit = (e: { preventDefault(): void }) => {
    e.preventDefault();
    setStep2Submitted(true);
    if (!canSubmit) return;

    upsertUser({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: workEmail.trim().toLowerCase(),
      password,
      businessName: businessName.trim(),
      verified: false,
      onboarded: false,
    });

    setPendingVerificationEmail(workEmail.trim().toLowerCase());
    router.push(`/verify-email?email=${encodeURIComponent(workEmail.trim().toLowerCase())}`);
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
        <div className="mx-auto w-full max-w-3xl rounded-2xl md:p-8">

          <StepIndicator steps={SIGNUP_STEPS} current={step} />

          {step === 1 ? (
            <AccountStep
              firstName={firstName} setFirstName={setFirstName}
              lastName={lastName} setLastName={setLastName}
              workEmail={workEmail} setWorkEmail={setWorkEmail}
              password={password} setPassword={setPassword}
              confirmPassword={confirmPassword} setConfirmPassword={setConfirmPassword}
              showPassword={showPassword} onTogglePassword={() => setShowPassword((p) => !p)}
              showConfirm={showConfirm} onToggleConfirm={() => setShowConfirm((p) => !p)}
              passwordMismatch={step1Submitted && confirmPassword.length > 0 && password !== confirmPassword}
              onSubmit={onContinue}
            />
          ) : (
            <BusinessStep
              businessName={businessName} setBusinessName={setBusinessName}
              businessType={businessType} setBusinessType={setBusinessType}
              registrationNumber={registrationNumber} setRegistrationNumber={setRegistrationNumber}
              taxId={taxId} setTaxId={setTaxId}
              businessAddress={businessAddress} setBusinessAddress={setBusinessAddress}
              city={city} setCity={setCity}
              state={state} setState={setState}
              postalCode={postalCode} setPostalCode={setPostalCode}
              businessPhone={businessPhone} setBusinessPhone={setBusinessPhone}
              websiteUrl={websiteUrl} setWebsiteUrl={setWebsiteUrl}
              acceptedTerms={acceptedTerms} setAcceptedTerms={setAcceptedTerms}
              canSubmit={canSubmit}
              step2Submitted={step2Submitted}
              onSubmit={onSubmit}
              onBack={() => setStep(1)}
            />
          )}
        </div>
      </section>
    </main>
  );
}
