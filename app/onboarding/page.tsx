"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { StepIndicator } from "@/components/ui/StepIndicator";
import { ChevronLeft, Building2, User } from "lucide-react";
import { AuthAside } from "@/components/auth/AuthAside";
import { Step1BusinessProfile } from "@/components/onboarding/Step1BusinessProfile";
import { Step2UseCaseRisk, type RiskAppetite } from "@/components/onboarding/Step2UseCaseRisk";
import { Step3InviteTeam, type InviteRow } from "@/components/onboarding/Step3InviteTeam";
import type { AccountType, OnboardingPayload } from "@/lib/api-types";
import { useAuth } from "@/context/auth-context";
import { useCompleteOnboarding } from "@/hooks/use-onboarding-mutations";
import { inviteTeamMember } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { Field, DateInput } from "@/components/ui/form-fields";

// Individual: 0=AccountType, 1=Preferences (UseCase+Risk)
// Business:   0=AccountType, 1=BusinessProfile, 2=Preferences (UseCase+Risk), 3=Team

type StepMeta = {
  title: string;
  subtitle: string;
  asideTitle: string;
  asideFeatures: string[];
  asideTestimonial?: { quote: string; author: string };
};

const STEP_META_BUSINESS: StepMeta[] = [
  {
    title: "Who are you setting up for?",
    subtitle: "Pick the option that best describes how you'll use FlowPilot.",
    asideTitle: "Built for how you pay.",
    asideFeatures: [
      "Individual: send money personally — quick identity check, no team needed",
      "Business: pay your team or vendors, with approvals and full compliance",
      "You can always upgrade your account level later from Settings",
    ],
  },
  {
    title: "Tell us a bit about your business.",
    subtitle: "Just a few quick questions to get your account ready.",
    asideTitle: "Let's get your first payout ready.",
    asideFeatures: [
      "Your account will be created in your business name",
      "We'll use this to set up the right payment limits for you",
      "You can update these details any time from Settings",
    ],
    asideTestimonial: {
      quote: "We caught a duplicate payout worth ₦4.2M on day one. Setup took less than 15 minutes.",
      author: "Head of Finance, Kobo360",
    },
  },
  {
    title: "How do you mainly send money?",
    subtitle: "Pick everything that fits — we'll set things up to match.",
    asideTitle: "Every business runs differently.",
    asideFeatures: [
      "Paying salaries? We'll flag duplicate payments automatically",
      "Paying vendors? We'll check amounts match what was agreed",
      "Your safety preference controls how much we review before sending",
    ],
  },
  {
    title: "Invite your team.",
    subtitle: "Add team members now, or skip and do it later from Settings.",
    asideTitle: "Better together.",
    asideFeatures: [
      "Approvers confirm large payments — no single person controls everything",
      "Analysts can view reports without being able to change anything",
      "Add or remove people any time from Settings",
    ],
  },
];

const STEP_META_INDIVIDUAL: StepMeta[] = [
  STEP_META_BUSINESS[0],
  {
    title: "How do you mainly send money?",
    subtitle: "Pick everything that fits — we'll set things up to match.",
    asideTitle: "Simple and secure.",
    asideFeatures: [
      "Verify your identity once with BVN or NIN",
      "Your account will be created in your name",
      "You can increase your limits any time by completing more verification",
    ],
  },
];

function getStepLabels(accountType: AccountType | null): string[] {
  if (accountType === "individual") return ["Account", "Preferences"];
  return ["Account", "Business", "Preferences", "Team"];
}

function createClientId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `id_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

// ── DOB input component ───────────────────────────────────────────────────────

const DOB_MAX = new Date(Date.now() - 18 * 365.25 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

function DobField({
  value,
  onChange,
  error,
}: {
  value: string;
  onChange: (v: string) => void;
  error?: string;
}) {
  return (
    <Field label="Date of Birth *">
      <DateInput
        value={value}
        onChange={onChange}
        placeholder="Select date of birth"
        max={DOB_MAX}
        className="bg-transparent"
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
      <p className="text-xs text-muted-foreground">You must be at least 18 years old to register.</p>
    </Field>
  );
}

// ── Account type selector ─────────────────────────────────────────────────────

function AccountTypeStep({
  value,
  onChange,
  dob,
  onDobChange,
  dobError,
}: {
  value: AccountType | null;
  onChange: (v: AccountType) => void;
  dob: string;
  onDobChange: (v: string) => void;
  dobError?: string;
}) {
  const options: { type: AccountType; icon: React.FC<{ className?: string }>; label: string; description: string }[] = [
    {
      type: "individual",
      icon: User,
      label: "Individual",
      description: "Personal payouts — verify with BVN or NIN. Starts at ₦300k/month.",
    },
    {
      type: "business",
      icon: Building2,
      label: "Business",
      description: "Team payouts, full KYC & approvals. Starts at ₦1.5m/month.",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2">
        {options.map(({ type, icon: Icon, label, description }) => (
          <button
            key={type}
            type="button"
            onClick={() => onChange(type)}
            className={cn(
              "flex flex-col gap-3 rounded-2xl border-2 p-5 text-left transition-all",
              value === type
                ? "border-brand bg-brand/5 shadow-sm"
                : "border-border hover:border-brand/40 hover:bg-muted/40"
            )}
          >
            <div className={cn(
              "flex h-10 w-10 items-center justify-center rounded-xl",
              value === type ? "bg-brand text-white" : "bg-muted text-muted-foreground"
            )}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">{label}</p>
              <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">{description}</p>
            </div>
          </button>
        ))}
      </div>

      {value && (
        <DobField value={dob} onChange={onDobChange} error={dobError} />
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter();
  const { user, isLoading, refreshUser } = useAuth();
  const [step, setStep] = useState(0);

  // Step 0
  const [accountType, setAccountType] = useState<AccountType | null>(null);
  const [dob, setDob] = useState("");
  const [dobError, setDobError] = useState("");

  // Step 1 — business only
  const [businessName, setBusinessName] = useState("");
  const [transactionVolume, setTransactionVolume] = useState("");
  const [monthlyPayouts, setMonthlyPayouts] = useState("");

  // Step 1 (individual) / Step 2 (business)
  const [selectedUseCases, setSelectedUseCases] = useState<string[]>([]);
  const [riskAppetite, setRiskAppetite] = useState<RiskAppetite | "">("");

  // Step 3 — business only
  const [invites, setInvites] = useState<InviteRow[]>([
    { id: createClientId(), email: "", role: "Approver" },
  ]);

  const invitesRef = useRef(invites);
  useEffect(() => { invitesRef.current = invites; }, [invites]);

  const isIndividual = accountType === "individual";
  const totalSteps = isIndividual ? 2 : 4;
  const stepLabels = getStepLabels(accountType);
  const stepMeta = isIndividual ? STEP_META_INDIVIDUAL : STEP_META_BUSINESS;
  const lastStep = totalSteps - 1;

  const onboardingMutation = useCompleteOnboarding(
    async () => {
      if (!isIndividual) {
        const validInvites = invitesRef.current.filter((r) => r.email.trim());
        await Promise.allSettled(
          validInvites.map((r) =>
            inviteTeamMember({ email: r.email.trim(), role: r.role.toLowerCase() })
              .then(() => updateInviteRow(r.id, { sent: true, error: undefined }))
              .catch((err: Error) =>
                updateInviteRow(r.id, { error: err.message ?? "Failed to send invite" }),
              ),
          ),
        );
      }
      await refreshUser();
      router.push("/dashboard/runs?welcome=1");
    },
    async () => {
      await refreshUser();
      router.push("/dashboard/runs");
    },
  );

  // ── Validation ────────────────────────────────────────────────
  const validateDob = (): boolean => {
    if (!dob) { setDobError("Date of birth is required."); return false; }
    const birth = new Date(dob);
    const now = new Date();
    const age = now.getFullYear() - birth.getFullYear() - (
      (now.getMonth() < birth.getMonth() || (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())) ? 1 : 0
    );
    if (age < 18) { setDobError("You must be at least 18 years old to register."); return false; }
    setDobError("");
    return true;
  };

  const step0Valid = !!(accountType && dob && !dobError);
  const step1BusinessValid = !!(businessName.trim() && transactionVolume && monthlyPayouts);
  const stepPreferencesValid = !!(selectedUseCases.length > 0 && riskAppetite);
  const inviteRowsValid = useMemo(() => invites.every((row) => !row.email || row.email), [invites]);

  const canContinue =
    step === 0 ? step0Valid :
    isIndividual ? stepPreferencesValid :
    step === 1 ? step1BusinessValid :
    step === 2 ? stepPreferencesValid :
    inviteRowsValid;

  const toggleUseCase = (value: string) =>
    setSelectedUseCases((prev) => prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]);

  const updateInviteRow = (id: string, updates: Partial<InviteRow>) =>
    setInvites((prev) => prev.map((row) => row.id === id ? { ...row, ...updates } : row));

  const addInviteRow = () =>
    setInvites((prev) => [...prev, { id: createClientId(), email: "", role: "Analyst" }]);

  const removeInviteRow = (id: string) =>
    setInvites((prev) => prev.length > 1 ? prev.filter((row) => row.id !== id) : prev);

  const handleBack = () => {
    if (step === 0) { router.push("/verify-email"); return; }
    setStep((p) => p - 1);
  };

  const handleContinue = () => {
    if (step === 0 && !validateDob()) return;
    if (step < lastStep) { setStep((p) => p + 1); return; }
    finishSetup();
  };

  const finishSetup = () => {
    const payload: OnboardingPayload = {
      account_type: accountType ?? "business",
      date_of_birth: dob || undefined,
      business_name: isIndividual
        ? (user?.display_name || [user?.first_name, user?.last_name].filter(Boolean).join(" ") || "Individual Account")
        : businessName.trim(),
      business_type: undefined,
      monthly_txn_volume_range: transactionVolume || undefined,
      avg_monthly_payouts_range: monthlyPayouts || undefined,
      primary_use_cases: selectedUseCases.length ? selectedUseCases : undefined,
      risk_appetite: riskAppetite || undefined,
    };
    onboardingMutation.mutate(payload);
  };

  const { title, subtitle, asideTitle, asideFeatures, asideTestimonial } =
    stepMeta[step] ?? stepMeta[stepMeta.length - 1];

  useEffect(() => {
    if (isLoading) return;
    if (user?.has_completed_onboarding) {
      router.replace("/dashboard/runs");
    }
  }, [isLoading, user, router]);

  return (
    <main className="min-h-screen md:grid md:grid-cols-[380px_1fr] md:h-screen md:overflow-hidden">
      <AuthAside
        title={asideTitle}
        features={asideFeatures}
        testimonial={asideTestimonial}
      />

      <section className="flex flex-col overflow-y-auto px-5 py-8 sm:py-12 md:px-10">
        <div className="mx-auto w-full max-w-2xl flex-1 pb-8">
          {/* Mobile back button */}
          <button
            type="button"
            onClick={handleBack}
            className="mb-4 flex items-center gap-1 text-[12px] font-medium text-muted-foreground hover:text-foreground md:hidden"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Back
          </button>

          <StepIndicator steps={stepLabels} current={step + 1} onStepClick={(s) => s - 1 < step && setStep(s - 1)} />

          <div className="mt-2">
            <h2 className="text-lg font-semibold text-foreground sm:text-2xl">{title}</h2>
            <p className="mt-1 text-[12px] text-muted-foreground sm:text-sm">{subtitle}</p>
          </div>

          <div className="mt-8">
            {step === 0 && (
              <AccountTypeStep
                value={accountType}
                onChange={(v) => { setAccountType(v); setDobError(""); }}
                dob={dob}
                onDobChange={(v) => { setDob(v); setDobError(""); }}
                dobError={dobError}
              />
            )}
            {step === 1 && !isIndividual && (
              <Step1BusinessProfile
                businessName={businessName} setBusinessName={setBusinessName}
                transactionVolume={transactionVolume} setTransactionVolume={setTransactionVolume}
                monthlyPayouts={monthlyPayouts} setMonthlyPayouts={setMonthlyPayouts}
              />
            )}
            {((step === 1 && isIndividual) || (step === 2 && !isIndividual)) && (
              <Step2UseCaseRisk
                selectedUseCases={selectedUseCases} toggleUseCase={toggleUseCase}
                riskAppetite={riskAppetite} setRiskAppetite={setRiskAppetite}
              />
            )}
            {step === 3 && !isIndividual && (
              <Step3InviteTeam
                invites={invites}
                updateInviteRow={updateInviteRow}
                addInviteRow={addInviteRow}
                removeInviteRow={removeInviteRow}
              />
            )}
          </div>

          <div className="mt-10 flex flex-col-reverse items-center justify-between gap-3 sm:gap-4 md:flex-row">
            <Button type="button" variant="outline" onClick={handleBack} className="hidden w-full rounded-full md:flex md:w-auto">
              Back
            </Button>

            {step === lastStep && !isIndividual && (
              <button
                type="button"
                onClick={finishSetup}
                disabled={onboardingMutation.isPending}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
              >
                Skip for now
              </button>
            )}

            <Button
              type="button"
              onClick={handleContinue}
              disabled={!canContinue || onboardingMutation.isPending}
              className="h-12 w-full rounded-full bg-primary text-primary-foreground font-bold transition-all hover:opacity-90 active:scale-[0.98] shadow-lg shadow-black/5 md:w-auto md:px-8"
            >
              {step === lastStep ? (onboardingMutation.isPending ? "Submitting..." : "Finish Setup") : "Continue"}
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
