"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { StepIndicator } from "@/components/ui/StepIndicator";
import { ChevronLeft } from "lucide-react";
import { AuthAside } from "@/components/auth/AuthAside";
import { Step1BusinessProfile, type RiskAppetite } from "@/components/onboarding/Step1BusinessProfile";
import { Step2FinancialSetup } from "@/components/onboarding/Step2FinancialSetup";
import { Step3InviteTeam, type InviteRow } from "@/components/onboarding/Step3InviteTeam";
import type { OnboardingPayload } from "@/lib/api-types";
import { useAuth } from "@/context/auth-context";
import { useCompleteOnboarding } from "@/hooks/use-onboarding-mutations";

const STEPS = ["Business Profile", "Financial Setup", "Invite Team"];

const STEP_META = [
  { title: "Tell us about your business.", subtitle: "This helps FlowPilot configure your reconciliation and risk settings." },
  { title: "Connect your financial accounts.", subtitle: "Link your primary Interswitch merchant account and set payout guardrails." },
  { title: "Invite your team.", subtitle: "Add team members now or skip and do this later from Settings." },
];


export default function OnboardingPage() {
  const router = useRouter();
  const { user, isLoading, refreshUser } = useAuth();
  const [step, setStep] = useState(1);

  const onboardingMutation = useCompleteOnboarding(
    async () => {
      await refreshUser();
      router.push("/dashboard/runs?welcome=1");
    },
    async () => {
      await refreshUser();
      router.push("/dashboard/runs");
    },
  );

  // Step 1
  const [businessName, setBusinessName] = useState("");
  const [transactionVolume, setTransactionVolume] = useState("");
  const [monthlyPayouts, setMonthlyPayouts] = useState("");
  const [primaryBank, setPrimaryBank] = useState("");
  const [selectedUseCases, setSelectedUseCases] = useState<string[]>([]);
  const [riskAppetite, setRiskAppetite] = useState<RiskAppetite | "">("");

  // Step 2
  const [merchantAccountId, setMerchantAccountId] = useState("");
  const [merchantState, setMerchantState] = useState("");
  const [dailyPayoutLimit, setDailyPayoutLimit] = useState("");
  const [singlePayoutLimit, setSinglePayoutLimit] = useState("");
  const [riskAlertThreshold, setRiskAlertThreshold] = useState("0.35");
  const [liquidityAlertThreshold, setLiquidityAlertThreshold] = useState("15");

  // Step 3
  const [invites, setInvites] = useState<InviteRow[]>([
    { id: crypto.randomUUID(), email: "", role: "Approver" },
  ]);

  const step1Valid = !!(businessName.trim() && transactionVolume && monthlyPayouts && primaryBank && selectedUseCases.length > 0 && riskAppetite);
  const step2Valid = !!(merchantAccountId.trim() && merchantState && dailyPayoutLimit.trim() && singlePayoutLimit.trim() && riskAlertThreshold.trim() && liquidityAlertThreshold.trim());
  const inviteRowsValid = useMemo(() => invites.every((row) => !row.email || row.email), [invites]);

  const canContinue = step === 1 ? step1Valid : step === 2 ? step2Valid : inviteRowsValid;

  const toggleUseCase = (value: string) =>
    setSelectedUseCases((prev) => prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]);

  const updateInviteRow = (id: string, updates: Partial<InviteRow>) =>
    setInvites((prev) => prev.map((row) => row.id === id ? { ...row, ...updates } : row));

  const addInviteRow = () =>
    setInvites((prev) => [...prev, { id: crypto.randomUUID(), email: "", role: "Analyst" }]);

  const removeInviteRow = (id: string) =>
    setInvites((prev) => prev.length > 1 ? prev.filter((row) => row.id !== id) : prev);

  const handleBack = () => {
    if (step === 1) { router.push("/verify-email"); return; }
    setStep((p) => p - 1);
  };

  const finishSetup = () => {
    const payload: OnboardingPayload = {
      business_name: businessName.trim(),
      business_type: undefined,
      monthly_txn_volume_range: transactionVolume || undefined,
      avg_monthly_payouts_range: monthlyPayouts || undefined,
      primary_bank: primaryBank || undefined,
      primary_use_cases: selectedUseCases.length ? selectedUseCases : undefined,
      risk_appetite: riskAppetite || undefined,
    };
    onboardingMutation.mutate(payload);
  };

  const { title, subtitle } = STEP_META[step - 1];

  useEffect(() => {
    if (isLoading) return;
    if (user?.has_completed_onboarding) {
      router.replace("/dashboard/runs");
    }
  }, [isLoading, user, router]);

  return (
    <main className="min-h-screen md:grid md:grid-cols-[380px_1fr]">
      <AuthAside
        title="You're 3 steps away from automated payout control."
        subtitle="Most teams finish setup in under 10 minutes."
        features={[
          "AI reconciles thousands of transactions in seconds — not hours",
          "Risk scores catch suspicious payouts before they leave your account",
          "Set daily limits and approval rules once, then let FlowPilot enforce them",
        ]}
        testimonial={{
          quote: "We caught a duplicate payout worth ₦4.2M on day one. Setup took less than 15 minutes.",
          author: "Head of Finance, Kobo360",
        }}
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

          <StepIndicator steps={STEPS} current={step} onStepClick={(s) => s < step && setStep(s)} />

          <div className="mt-2">
            <h2 className="text-lg font-semibold text-foreground sm:text-2xl">{title}</h2>
            <p className="mt-1 text-[12px] text-muted-foreground sm:text-sm">{subtitle}</p>
          </div>

          <div className="mt-8">
            {step === 1 && (
              <Step1BusinessProfile
                businessName={businessName} setBusinessName={setBusinessName}
                transactionVolume={transactionVolume} setTransactionVolume={setTransactionVolume}
                monthlyPayouts={monthlyPayouts} setMonthlyPayouts={setMonthlyPayouts}
                primaryBank={primaryBank} setPrimaryBank={setPrimaryBank}
                selectedUseCases={selectedUseCases} toggleUseCase={toggleUseCase}
                riskAppetite={riskAppetite} setRiskAppetite={setRiskAppetite}
              />
            )}
            {step === 2 && (
              <Step2FinancialSetup
                merchantAccountId={merchantAccountId} setMerchantAccountId={setMerchantAccountId}
                merchantState={merchantState} setMerchantState={setMerchantState}
                dailyPayoutLimit={dailyPayoutLimit} setDailyPayoutLimit={setDailyPayoutLimit}
                singlePayoutLimit={singlePayoutLimit} setSinglePayoutLimit={setSinglePayoutLimit}
                riskAlertThreshold={riskAlertThreshold} setRiskAlertThreshold={setRiskAlertThreshold}
                liquidityAlertThreshold={liquidityAlertThreshold} setLiquidityAlertThreshold={setLiquidityAlertThreshold}
              />
            )}
            {step === 3 && (
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

            {step === 3 && (
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
              onClick={step === 3 ? finishSetup : () => canContinue && setStep((p) => p + 1)}
              disabled={!canContinue || onboardingMutation.isPending}
              className="h-12 w-full rounded-full bg-primary text-primary-foreground font-bold transition-all hover:opacity-90 active:scale-[0.98] shadow-lg shadow-black/5 md:w-auto md:px-8"
            >
              {step === 3 ? (onboardingMutation.isPending ? "Submitting..." : "Finish Setup") : "Continue"}
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
