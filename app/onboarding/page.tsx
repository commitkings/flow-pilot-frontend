"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StepIndicator } from "@/components/ui/StepIndicator";
import { ChevronLeft, Building2, User } from "lucide-react";
import { AuthAside } from "@/components/auth/AuthAside";
import { Step1BusinessProfile } from "@/components/onboarding/Step1BusinessProfile";
import { Step2UseCaseRisk, type RiskAppetite } from "@/components/onboarding/Step2UseCaseRisk";
import { Step2FinancialSetup } from "@/components/onboarding/Step2FinancialSetup";
import { Step3InviteTeam, type InviteRow } from "@/components/onboarding/Step3InviteTeam";
import type { AccountType, OnboardingPayload } from "@/lib/api-types";
import { useAuth } from "@/context/auth-context";
import { useCompleteOnboarding } from "@/hooks/use-onboarding-mutations";
import { inviteTeamMember } from "@/lib/api-client";
import { cn } from "@/lib/utils";

// Steps: 0=AccountType, 1=Profile, 2=UseCase, 3=Financials, 4=Team (business only)
// For individual: 0=AccountType, 1=Profile, 2=UseCase, 3=Financials (no team step)

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
    subtitle: "This determines your KYC requirements and available features.",
    asideTitle: "Built for how you pay.",
    asideFeatures: [
      "Individual accounts: personal payouts with quick BVN/NIN verification",
      "Business accounts: team collaboration, bulk payouts, and full KYC compliance",
      "You can upgrade your verification level any time from Settings",
    ],
  },
  {
    title: "Tell us about your business.",
    subtitle: "This helps FlowPilot configure your reconciliation and risk settings.",
    asideTitle: "Let's get your first payout run ready.",
    asideFeatures: [
      "AI reconciles thousands of transactions in seconds — not hours",
      "Risk scores catch suspicious payouts before they leave your account",
      "Set daily limits and approval rules once, then let FlowPilot enforce them",
    ],
    asideTestimonial: {
      quote: "We caught a duplicate payout worth ₦4.2M on day one. Setup took less than 15 minutes.",
      author: "Head of Finance, Kobo360",
    },
  },
  {
    title: "How do you use payouts?",
    subtitle: "Select all that apply — FlowPilot optimises risk checks for each use case.",
    asideTitle: "Every business runs differently.",
    asideFeatures: [
      "Payroll runs need strict approval chains to prevent duplicate disbursements",
      "Vendor payments get reconciliation checks against PO and invoice records",
      "Your risk appetite controls how aggressively FlowPilot flags transactions",
    ],
  },
  {
    title: "Set your payout guardrails.",
    subtitle: "Configure your registered state and payout limits to control disbursements.",
    asideTitle: "Your guardrails, your rules.",
    asideFeatures: [
      "Daily caps stop runaway batch errors before they drain your account",
      "Single-payout limits catch outlier transactions for manual review",
      "Liquidity alerts fire before your buffer drops below a safe threshold",
    ],
  },
  {
    title: "Invite your team.",
    subtitle: "Add team members now or skip and do this later from Settings.",
    asideTitle: "Controls are stronger with a team.",
    asideFeatures: [
      "Approvers authorise high-value payouts — no single point of failure",
      "Analysts can monitor runs and reports without modifying anything",
      "Add or remove teammates any time from the Settings page",
    ],
  },
];

const STEP_META_INDIVIDUAL: StepMeta[] = [
  STEP_META_BUSINESS[0],
  {
    title: "Tell us about yourself.",
    subtitle: "This helps FlowPilot configure your account and payout settings.",
    asideTitle: "Personal payouts, made simple.",
    asideFeatures: [
      "Verify with your BVN or NIN to unlock your sending limits",
      "No team management needed — it's just you",
      "Upgrade your KYC level any time to increase your payout limits",
    ],
  },
  STEP_META_BUSINESS[2],
  STEP_META_BUSINESS[3],
];

function getStepLabels(accountType: AccountType | null): string[] {
  if (accountType === "individual") return ["Account", "Profile", "Use Case", "Financials"];
  return ["Account", "Business", "Use Case", "Financials", "Team"];
}

function createClientId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `id_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

// ── DOB input component ───────────────────────────────────────────────────────

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
    <div className="space-y-1.5">
      <label className="text-sm font-semibold text-foreground">
        Date of Birth <span className="text-destructive">*</span>
      </label>
      <Input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        max={new Date(Date.now() - 18 * 365.25 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]}
        className="h-11 rounded-xl"
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
      <p className="text-xs text-muted-foreground">You must be at least 18 years old to register.</p>
    </div>
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

  // Step 1
  const [businessName, setBusinessName] = useState("");
  const [transactionVolume, setTransactionVolume] = useState("");
  const [monthlyPayouts, setMonthlyPayouts] = useState("");
  const [primaryBank, setPrimaryBank] = useState("");

  // Step 2
  const [selectedUseCases, setSelectedUseCases] = useState<string[]>([]);
  const [riskAppetite, setRiskAppetite] = useState<RiskAppetite | "">("");

  // Step 3
  const [merchantState, setMerchantState] = useState("");
  const [dailyPayoutLimit, setDailyPayoutLimit] = useState("");
  const [singlePayoutLimit, setSinglePayoutLimit] = useState("");
  const [riskAlertThreshold, setRiskAlertThreshold] = useState("0.35");
  const [liquidityAlertThreshold, setLiquidityAlertThreshold] = useState("15");

  // Step 4 — business only
  const [invites, setInvites] = useState<InviteRow[]>([
    { id: createClientId(), email: "", role: "Approver" },
  ]);

  const invitesRef = useRef(invites);
  useEffect(() => { invitesRef.current = invites; }, [invites]);

  const isIndividual = accountType === "individual";
  const totalSteps = isIndividual ? 4 : 5;
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
  const step1Valid = !!(businessName.trim() && transactionVolume && monthlyPayouts && primaryBank);
  const step2Valid = !!(selectedUseCases.length > 0 && riskAppetite);
  const step3Valid = !!(merchantState && dailyPayoutLimit.trim() && singlePayoutLimit.trim() && riskAlertThreshold.trim() && liquidityAlertThreshold.trim());
  const inviteRowsValid = useMemo(() => invites.every((row) => !row.email || row.email), [invites]);

  const canContinue =
    step === 0 ? step0Valid :
    step === 1 ? step1Valid :
    step === 2 ? step2Valid :
    step === 3 ? step3Valid :
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
      business_name: businessName.trim(),
      business_type: undefined,
      monthly_txn_volume_range: transactionVolume || undefined,
      avg_monthly_payouts_range: monthlyPayouts || undefined,
      primary_bank: primaryBank || undefined,
      primary_use_cases: selectedUseCases.length ? selectedUseCases : undefined,
      risk_appetite: riskAppetite || undefined,
      merchant_state: merchantState || undefined,
      daily_payout_limit: dailyPayoutLimit ? parseFloat(dailyPayoutLimit.replace(/,/g, "")) : undefined,
      single_payout_cap: singlePayoutLimit ? parseFloat(singlePayoutLimit.replace(/,/g, "")) : undefined,
      risk_alert_threshold: riskAlertThreshold ? parseFloat(riskAlertThreshold) : undefined,
      liquidity_alert_buffer: liquidityAlertThreshold ? parseFloat(liquidityAlertThreshold) : undefined,
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
            {step === 1 && (
              <Step1BusinessProfile
                businessName={businessName} setBusinessName={setBusinessName}
                transactionVolume={transactionVolume} setTransactionVolume={setTransactionVolume}
                monthlyPayouts={monthlyPayouts} setMonthlyPayouts={setMonthlyPayouts}
                primaryBank={primaryBank} setPrimaryBank={setPrimaryBank}
              />
            )}
            {step === 2 && (
              <Step2UseCaseRisk
                selectedUseCases={selectedUseCases} toggleUseCase={toggleUseCase}
                riskAppetite={riskAppetite} setRiskAppetite={setRiskAppetite}
              />
            )}
            {step === 3 && (
              <Step2FinancialSetup
                merchantState={merchantState} setMerchantState={setMerchantState}
                dailyPayoutLimit={dailyPayoutLimit} setDailyPayoutLimit={setDailyPayoutLimit}
                singlePayoutLimit={singlePayoutLimit} setSinglePayoutLimit={setSinglePayoutLimit}
                riskAlertThreshold={riskAlertThreshold} setRiskAlertThreshold={setRiskAlertThreshold}
                liquidityAlertThreshold={liquidityAlertThreshold} setLiquidityAlertThreshold={setLiquidityAlertThreshold}
              />
            )}
            {step === 4 && !isIndividual && (
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
