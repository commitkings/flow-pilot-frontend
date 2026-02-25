"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { findUserByEmail, setPendingVerificationEmail, upsertUser } from "@/lib/auth-storage";

const businessTypes = [
  "Retail",
  "Manufacturing",
  "Services",
  "Logistics",
  "Healthcare",
  "Agriculture",
  "Technology",
  "Other",
];

const states = [
  "Abia",
  "Adamawa",
  "Akwa Ibom",
  "Anambra",
  "Bauchi",
  "Bayelsa",
  "Benue",
  "Borno",
  "Cross River",
  "Delta",
  "Ebonyi",
  "Edo",
  "Ekiti",
  "Enugu",
  "FCT - Abuja",
  "Gombe",
  "Imo",
  "Jigawa",
  "Kaduna",
  "Kano",
  "Katsina",
  "Kebbi",
  "Kogi",
  "Kwara",
  "Lagos",
  "Nasarawa",
  "Niger",
  "Ogun",
  "Ondo",
  "Osun",
  "Oyo",
  "Plateau",
  "Rivers",
  "Sokoto",
  "Taraba",
  "Yobe",
  "Zamfara",
];

const passwordStrength = (password: string) => {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  return score;
};

export default function SignupPage() {
  const router = useRouter();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [workEmail, setWorkEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

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

  const [emailExists, setEmailExists] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const strength = useMemo(() => passwordStrength(password), [password]);
  const passwordMismatch = submitted && confirmPassword.length > 0 && password !== confirmPassword;

  const canSubmit =
    firstName.trim() &&
    lastName.trim() &&
    workEmail.trim() &&
    password.trim() &&
    confirmPassword.trim() &&
    businessName.trim() &&
    businessType &&
    registrationNumber.trim() &&
    taxId.trim() &&
    businessAddress.trim() &&
    city.trim() &&
    state &&
    postalCode.trim() &&
    businessPhone.trim() &&
    acceptedTerms &&
    password === confirmPassword;

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    setEmailExists(false);

    if (!canSubmit) return;

    const existing = findUserByEmail(workEmail);
    if (existing) {
      setEmailExists(true);
      return;
    }

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

  const strengthColor =
    strength <= 1
      ? "bg-red-500"
      : strength === 2
        ? "bg-amber-500"
        : strength === 3
          ? "bg-lime-500"
          : "bg-emerald-500";

  return (
    <main className="min-h-screen bg-slate-50 md:grid md:grid-cols-[420px_1fr]">
      <aside className="hidden bg-slate-950 px-10 py-12 text-white md:flex md:flex-col">
        <Link href="/" className="text-xl font-semibold tracking-tight">
          FlowPilot
        </Link>
        <div className="mt-16">
          <h1 className="text-3xl font-semibold leading-tight">
            Built for businesses that move money at scale.
          </h1>
          <ul className="mt-8 space-y-4 text-sm text-slate-200">
            {[
              "AI-powered transaction reconciliation",
              "Risk-scored payout verification",
              "Full audit trail on every run.",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 text-blue-400" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-auto rounded-xl border border-white/10 bg-white/5 p-5 text-sm text-slate-200">
          <p className="leading-relaxed">
            &quot;FlowPilot cut our month-end close from 2 days to 2 hours.&quot;
          </p>
          <p className="mt-3 text-xs uppercase tracking-wide text-slate-400">Fictional CFO, Acme Retail</p>
        </div>
      </aside>

      <section className="px-4 py-8 md:px-10 md:py-12">
        <div className="mx-auto w-full max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <h2 className="text-2xl font-semibold text-slate-900">Create your account.</h2>
          <p className="mt-2 text-sm text-slate-600">Start with a 14-day free trial. No credit card required.</p>

          {emailExists && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              An account with this email already exists. Log in instead.
            </div>
          )}

          <form onSubmit={onSubmit} className="mt-6 space-y-6">
            <Button type="button" variant="outline" className="h-11 w-full rounded-xl border-slate-300">
              Continue with Google
            </Button>

            <div className="relative text-center text-sm text-slate-500">
              <span className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-slate-200" />
              <span className="relative bg-white px-3">or sign up with email</span>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="First Name">
                <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} className="h-11 rounded-xl" />
              </Field>
              <Field label="Last Name">
                <Input value={lastName} onChange={(e) => setLastName(e.target.value)} className="h-11 rounded-xl" />
              </Field>
              <Field label="Work Email" className="md:col-span-2">
                <Input type="email" value={workEmail} onChange={(e) => setWorkEmail(e.target.value)} className="h-11 rounded-xl" />
              </Field>
              <Field label="Password">
                <PasswordInput value={password} onChange={setPassword} show={showPassword} onToggle={() => setShowPassword((prev) => !prev)} />
              </Field>
              <Field label="Confirm Password">
                <PasswordInput value={confirmPassword} onChange={setConfirmPassword} show={showConfirm} onToggle={() => setShowConfirm((prev) => !prev)} />
              </Field>
              <div className="md:col-span-2">
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                  <div className={`h-full ${strengthColor}`} style={{ width: `${(strength / 4) * 100}%` }} />
                </div>
                {passwordMismatch && <p className="mt-2 text-sm text-red-600">Passwords do not match.</p>}
              </div>
            </div>

            <div className="border-t border-slate-200 pt-5">
              <h3 className="text-base font-semibold text-slate-900">Business Information</h3>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Business Name">
                <Input value={businessName} onChange={(e) => setBusinessName(e.target.value)} className="h-11 rounded-xl" />
              </Field>
              <Field label="Business Type">
                <SelectInput value={businessType} onChange={setBusinessType} placeholder="Select type" options={businessTypes} />
              </Field>

              <Field label="Business Registration Number">
                <Input value={registrationNumber} onChange={(e) => setRegistrationNumber(e.target.value)} className="h-11 rounded-xl" />
              </Field>
              <Field label="Tax Identification Number">
                <Input value={taxId} onChange={(e) => setTaxId(e.target.value)} className="h-11 rounded-xl" />
              </Field>

              <Field label="Business Address" className="md:col-span-2">
                <textarea
                  value={businessAddress}
                  onChange={(e) => setBusinessAddress(e.target.value)}
                  className="min-h-20 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
              </Field>

              <Field label="City">
                <Input value={city} onChange={(e) => setCity(e.target.value)} className="h-11 rounded-xl" />
              </Field>
              <Field label="State">
                <SelectInput value={state} onChange={setState} placeholder="Select state" options={states} />
              </Field>

              <Field label="Country">
                <Input value="Nigeria" disabled className="h-11 rounded-xl bg-slate-100" />
              </Field>
              <Field label="Postal Code">
                <Input value={postalCode} onChange={(e) => setPostalCode(e.target.value)} className="h-11 rounded-xl" />
              </Field>

              <Field label="Business Phone">
                <div className="flex h-11 overflow-hidden rounded-xl border border-slate-300 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100">
                  <span className="inline-flex items-center border-r border-slate-300 px-3 text-sm text-slate-600">🇳🇬 +234</span>
                  <input
                    value={businessPhone}
                    onChange={(e) => setBusinessPhone(e.target.value)}
                    className="w-full px-3 text-sm outline-none"
                  />
                </div>
              </Field>
              <Field label="Website URL (Optional)">
                <Input value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} className="h-11 rounded-xl" />
              </Field>
            </div>

            <label className="flex items-start gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="mt-1"
              />
              <span>
                I agree to the <a href="#" className="underline">Terms of Service</a> and <a href="#" className="underline">Privacy Policy</a>
              </span>
            </label>

            <Button type="submit" disabled={!canSubmit} className="h-11 w-full rounded-xl bg-blue-600 text-white hover:bg-blue-700">
              Create Business Account
            </Button>

            <p className="text-center text-sm text-slate-600">
              Already have an account?{" "}
              <Link href="/login" className="font-medium text-blue-600">
                Log In
              </Link>
            </p>
          </form>
        </div>
      </section>
    </main>
  );
}

function Field({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label className="mb-1.5 block text-sm font-medium text-slate-700">{label}</label>
      {children}
    </div>
  );
}

function SelectInput({
  value,
  onChange,
  placeholder,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  options: string[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
    >
      <option value="" disabled>
        {placeholder}
      </option>
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}

function PasswordInput({
  value,
  onChange,
  show,
  onToggle,
}: {
  value: string;
  onChange: (value: string) => void;
  show: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="relative">
      <Input
        type={show ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 rounded-xl pr-10"
      />
      <button
        type="button"
        onClick={onToggle}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}
