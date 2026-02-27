"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { StepIndicator } from "@/components/ui/StepIndicator";
import { AuthAside } from "@/components/auth/AuthAside";
import { Step1BusinessProfile, type RiskAppetite } from "@/components/onboarding/Step1BusinessProfile";
import { Step2FinancialSetup } from "@/components/onboarding/Step2FinancialSetup";
import { Step3InviteTeam, type InviteRow } from "@/components/onboarding/Step3InviteTeam";

const STEPS = ["Business Profile", "Financial Setup", "Invite Team"];

const STEP_META = [
  { title: "Tell us about your business.", subtitle: "This helps FlowPilot configure your reconciliation and risk settings." },
  { title: "Connect your financial accounts.", subtitle: "Link your primary Interswitch merchant account and set payout guardrails." },
  { title: "Invite your team.", subtitle: "Add team members now or skip and do this later from Settings." },
];


export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);

  // Step 1
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

  const step1Valid = !!(transactionVolume && monthlyPayouts && primaryBank && selectedUseCases.length > 0 && riskAppetite);
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
    router.push("/dashboard/runs?welcome=1");
  };

  const { title, subtitle } = STEP_META[step - 1];

  return (
    <main className="h-screen md:grid md:grid-cols-[420px_1fr]">
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

      <section className="flex flex-col overflow-y-auto px-4 py-8 md:px-10">
        <div className="mx-auto w-full max-w-2xl flex-1">
          <StepIndicator steps={STEPS} current={step} onStepClick={(s) => s < step && setStep(s)} />

          <div className="mt-2">
            <h2 className="text-2xl font-semibold text-foreground">{title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          </div>

          <div className="mt-8">
            {step === 1 && (
              <Step1BusinessProfile
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

          <div className="mt-10 flex flex-col items-center justify-between gap-4 md:flex-row">
            <Button type="button" variant="outline" onClick={handleBack} className="w-full rounded-full md:w-auto">
              Back
            </Button>

            {step === 3 && (
              <button
                type="button"
                onClick={finishSetup}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Skip for now
              </button>
            )}

            <Button
              type="button"
              onClick={step === 3 ? finishSetup : () => canContinue && setStep((p) => p + 1)}
              disabled={!canContinue}
              className="h-12 w-full rounded-full bg-primary text-primary-foreground font-bold transition-all hover:opacity-90 active:scale-[0.98] shadow-lg shadow-black/5 md:w-auto md:px-8"
            >
              {step === 3 ? "Finish Setup" : "Continue"}
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
