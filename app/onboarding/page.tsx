"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Plus, Scale, Shield, Trash2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { getCurrentUser, upsertUser } from "@/lib/auth-storage";
import { useAuth } from "@/context/auth-context";

type RiskAppetite = "conservative" | "moderate" | "aggressive";
type TeamRole = "Approver" | "Analyst";

type InviteRow = {
  id: string;
  email: string;
  role: TeamRole;
};

const monthlyTransactionVolumes = [
  "Below ₦1M",
  "₦1M–₦10M",
  "₦10M–₦50M",
  "₦50M–₦200M",
  "Above ₦200M",
];

const averageMonthlyPayouts = ["Below 50", "50–200", "200–1000", "Above 1000"];

const nigerianBanks = [
  "Access Bank",
  "First Bank",
  "GTBank",
  "UBA",
  "Zenith Bank",
  "Stanbic IBTC",
  "Fidelity Bank",
  "Union Bank",
  "Polaris Bank",
  "Sterling Bank",
  "Wema Bank",
  "Other",
];

const useCaseOptions = [
  "Payroll Disbursement",
  "Vendor Payments",
  "Supplier Payments",
  "Contractor Payments",
  "Refunds and Reversals",
  "Inter-account Transfers",
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

const stepLabels = ["Business Profile", "Financial Setup", "Invite Team"];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function OnboardingPage() {
  const router = useRouter();
  const { isAuthenticated, isReady } = useAuth();
  const [step, setStep] = useState(1);

  const [transactionVolume, setTransactionVolume] = useState("");
  const [monthlyPayouts, setMonthlyPayouts] = useState("");
  const [primaryBank, setPrimaryBank] = useState("");
  const [selectedUseCases, setSelectedUseCases] = useState<string[]>([]);
  const [riskAppetite, setRiskAppetite] = useState<RiskAppetite | "">("");

  const [merchantAccountId, setMerchantAccountId] = useState("");
  const [merchantState, setMerchantState] = useState("");
  const [dailyPayoutLimit, setDailyPayoutLimit] = useState("");
  const [singlePayoutLimit, setSinglePayoutLimit] = useState("");
  const [riskAlertThreshold, setRiskAlertThreshold] = useState("0.35");
  const [liquidityAlertThreshold, setLiquidityAlertThreshold] = useState("15");

  const [invites, setInvites] = useState<InviteRow[]>([
    { id: crypto.randomUUID(), email: "", role: "Approver" },
  ]);

  const inviteRowsValid = useMemo(
    () => invites.every((row) => !row.email || EMAIL_REGEX.test(row.email)),
    [invites]
  );

  const stepOneValid =
    Boolean(transactionVolume) &&
    Boolean(monthlyPayouts) &&
    Boolean(primaryBank) &&
    selectedUseCases.length > 0 &&
    Boolean(riskAppetite);

  const stepTwoValid =
    Boolean(merchantAccountId.trim()) &&
    Boolean(merchantState) &&
    Boolean(dailyPayoutLimit.trim()) &&
    Boolean(singlePayoutLimit.trim()) &&
    Boolean(riskAlertThreshold.trim()) &&
    Boolean(liquidityAlertThreshold.trim());

  const canContinue = step === 1 ? stepOneValid : step === 2 ? stepTwoValid : inviteRowsValid;

  const toggleUseCase = (value: string) => {
    setSelectedUseCases((prev) =>
      prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]
    );
  };

  const updateInviteRow = (id: string, updates: Partial<InviteRow>) => {
    setInvites((prev) => prev.map((row) => (row.id === id ? { ...row, ...updates } : row)));
  };

  const addInviteRow = () => {
    setInvites((prev) => [...prev, { id: crypto.randomUUID(), email: "", role: "Analyst" }]);
  };

  const removeInviteRow = (id: string) => {
    setInvites((prev) => (prev.length > 1 ? prev.filter((row) => row.id !== id) : prev));
  };

  const handleNext = () => {
    if (canContinue && step < 3) {
      setStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (step === 1) {
      router.push("/verify-email");
      return;
    }
    setStep((prev) => prev - 1);
  };

  const finishSetup = () => {
    localStorage.setItem("flowpilot_onboarded", "true");
    const teamInvites = invites.filter((row) => row.email.trim().length > 0);
    localStorage.setItem("flowpilot_team_invites", JSON.stringify(teamInvites));
    const currentUser = getCurrentUser();
    if (currentUser) {
      upsertUser({ ...currentUser, onboarded: true });
      localStorage.setItem("flowpilot_user_first_name", currentUser.firstName);
    }
    router.push("/dashboard/runs?welcome=1");
  };

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 md:px-8">
      <div className="mx-auto w-full max-w-5xl">
        <div className="mb-8">
          <ol className="flex flex-col gap-3 md:flex-row md:items-center md:justify-center md:gap-6">
            {stepLabels.map((label, index) => {
              const current = index + 1;
              const completed = step > current;
              const active = step === current;
              return (
                <li key={label} className="flex items-center gap-3">
                  <span
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-full border text-sm font-semibold transition-colors",
                      completed && "border-emerald-500 bg-emerald-500 text-white",
                      active && "border-blue-600 bg-blue-600 text-white",
                      !completed && !active && "border-slate-300 bg-white text-slate-500"
                    )}
                  >
                    {completed ? <Check className="h-4 w-4" /> : current}
                  </span>
                  <span
                    className={cn(
                      "text-sm font-medium",
                      active ? "text-slate-900" : "text-slate-500"
                    )}
                  >
                    Step {current} {label}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>

        <Card className="rounded-2xl border-slate-200 shadow-sm">
          <CardHeader className="border-b border-slate-200 pb-5">
            <CardTitle className="text-2xl font-semibold text-slate-900">
              {step === 1 && "Tell us about your business."}
              {step === 2 && "Connect your financial accounts."}
              {step === 3 && "Invite your team."}
            </CardTitle>
            <p className="text-sm text-slate-600">
              {step === 1 &&
                "This helps FlowPilot configure your reconciliation and risk settings."}
              {step === 2 &&
                "Link your primary Interswitch merchant account and set payout guardrails."}
              {step === 3 &&
                "Add team members now or skip and do this later from Settings."}
            </p>
          </CardHeader>

          <CardContent className="space-y-6 py-6">
            {step === 1 && (
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Monthly Transaction Volume">
                    <SelectInput
                      value={transactionVolume}
                      onChange={setTransactionVolume}
                      placeholder="Select volume range"
                      options={monthlyTransactionVolumes}
                    />
                  </Field>
                  <Field label="Average Monthly Payouts">
                    <SelectInput
                      value={monthlyPayouts}
                      onChange={setMonthlyPayouts}
                      placeholder="Select payout range"
                      options={averageMonthlyPayouts}
                    />
                  </Field>
                </div>

                <Field label="Primary Bank">
                  <SelectInput
                    value={primaryBank}
                    onChange={setPrimaryBank}
                    placeholder="Select a primary bank"
                    options={nigerianBanks}
                  />
                </Field>

                <Field label="Primary Use Case">
                  <div className="flex flex-wrap gap-2">
                    {useCaseOptions.map((option) => {
                      const selected = selectedUseCases.includes(option);
                      return (
                        <button
                          key={option}
                          type="button"
                          onClick={() => toggleUseCase(option)}
                          className={cn(
                            "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                            selected
                              ? "border-blue-600 bg-blue-600 text-white"
                              : "border-slate-300 bg-white text-slate-700 hover:border-blue-300 hover:text-blue-700"
                          )}
                        >
                          {option}
                        </button>
                      );
                    })}
                  </div>
                </Field>

                <Field label="Risk Appetite">
                  <div className="grid gap-3 md:grid-cols-3">
                    <RiskCard
                      title="Conservative"
                      description="Strict risk controls. Only very low risk payouts auto-approved."
                      icon={<Shield className="h-5 w-5 text-blue-700" />}
                      selected={riskAppetite === "conservative"}
                      onClick={() => setRiskAppetite("conservative")}
                    />
                    <RiskCard
                      title="Moderate"
                      description="Balanced approach. Review borderline cases."
                      icon={<Scale className="h-5 w-5 text-blue-700" />}
                      selected={riskAppetite === "moderate"}
                      onClick={() => setRiskAppetite("moderate")}
                    />
                    <RiskCard
                      title="Aggressive"
                      description="Speed-focused. Flag only high-risk payouts."
                      icon={<Zap className="h-5 w-5 text-blue-700" />}
                      selected={riskAppetite === "aggressive"}
                      onClick={() => setRiskAppetite("aggressive")}
                    />
                  </div>
                </Field>
              </>
            )}

            {step === 2 && (
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Primary Interswitch Merchant Account ID">
                  <Input
                    value={merchantAccountId}
                    onChange={(e) => setMerchantAccountId(e.target.value)}
                    placeholder="Enter merchant account ID"
                    className="h-11 rounded-xl border-slate-300"
                  />
                </Field>

                <Field label="Registered State">
                  <SelectInput
                    value={merchantState}
                    onChange={setMerchantState}
                    placeholder="Select state"
                    options={states}
                  />
                </Field>

                <Field label="Default Daily Payout Limit (₦)">
                  <Input
                    value={dailyPayoutLimit}
                    onChange={(e) => setDailyPayoutLimit(e.target.value)}
                    placeholder="e.g. 5,000,000"
                    className="h-11 rounded-xl border-slate-300"
                  />
                </Field>

                <Field label="Single Payout Cap (₦)">
                  <Input
                    value={singlePayoutLimit}
                    onChange={(e) => setSinglePayoutLimit(e.target.value)}
                    placeholder="e.g. 250,000"
                    className="h-11 rounded-xl border-slate-300"
                  />
                </Field>

                <Field label="Risk Alert Threshold">
                  <Input
                    value={riskAlertThreshold}
                    onChange={(e) => setRiskAlertThreshold(e.target.value)}
                    placeholder="e.g. 0.35"
                    className="h-11 rounded-xl border-slate-300"
                  />
                </Field>

                <Field label="Liquidity Alert Buffer (%)">
                  <Input
                    value={liquidityAlertThreshold}
                    onChange={(e) => setLiquidityAlertThreshold(e.target.value)}
                    placeholder="e.g. 15"
                    className="h-11 rounded-xl border-slate-300"
                  />
                </Field>
              </div>
            )}

            {step === 3 && (
              <>
                <div className="space-y-3">
                  {invites.map((row, index) => {
                    const emailValid = !row.email || EMAIL_REGEX.test(row.email);
                    return (
                      <div
                        key={row.id}
                        className="grid gap-3 rounded-xl border border-slate-200 bg-white p-3 md:grid-cols-[1fr_180px_auto]"
                      >
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-slate-600">
                            Email Address
                          </label>
                          <Input
                            type="email"
                            value={row.email}
                            placeholder="teammate@company.com"
                            onChange={(e) => updateInviteRow(row.id, { email: e.target.value })}
                            className={cn(
                              "h-11 rounded-xl border-slate-300",
                              !emailValid && "border-red-500 focus-visible:ring-red-100"
                            )}
                          />
                          {!emailValid && (
                            <p className="text-xs text-red-600">Enter a valid email address.</p>
                          )}
                        </div>

                        <Field label="Role" className="mb-0">
                          <select
                            value={row.role}
                            onChange={(e) =>
                              updateInviteRow(row.id, { role: e.target.value as TeamRole })
                            }
                            className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                          >
                            <option value="Approver">Approver</option>
                            <option value="Analyst">Analyst</option>
                          </select>
                        </Field>

                        <div className="flex items-end">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => removeInviteRow(row.id)}
                            disabled={invites.length === 1 && index === 0}
                            className="h-11 w-11 rounded-xl border-slate-300 text-slate-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={addInviteRow}
                  className="h-11 rounded-xl border-blue-200 text-blue-700 hover:bg-blue-50"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Another
                </Button>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                  Approvers can create runs and approve payouts. Analysts can view runs,
                  transactions, and reports only.
                </div>
              </>
            )}
          </CardContent>

          <CardFooter className="flex flex-col justify-between gap-4 border-t border-slate-200 pt-5 md:flex-row md:items-center">
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              className="w-full rounded-xl border-slate-300 md:w-auto"
            >
              Back
            </Button>

            {step === 3 && (
              <button
                type="button"
                onClick={finishSetup}
                className="text-sm font-medium text-slate-500 hover:text-slate-700"
              >
                Skip for now
              </button>
            )}

            <Button
              type="button"
              onClick={step === 3 ? finishSetup : handleNext}
              disabled={!canContinue}
              className="h-11 w-full rounded-xl bg-blue-600 text-white hover:bg-blue-700 md:w-auto"
            >
              {step === 3 ? "Finish Setup" : "Continue"}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </main>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label className="text-sm font-medium text-slate-700">{label}</label>
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

function RiskCard({
  title,
  description,
  icon,
  selected,
  onClick,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative rounded-xl border p-4 text-left transition-colors",
        selected
          ? "border-blue-600 bg-blue-50"
          : "border-slate-300 bg-white hover:border-blue-300"
      )}
    >
      {selected && (
        <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white">
          <Check className="h-3.5 w-3.5" />
        </span>
      )}
      <span className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100">
        {icon}
      </span>
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      <p className="mt-1 text-xs leading-relaxed text-slate-600">{description}</p>
    </button>
  );
}
