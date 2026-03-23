import { Scale, Shield, Zap } from "lucide-react";
import { Field, SelectInput, TextInput } from "@/components/ui/form-fields";
import { CardSelect, PillSelect, type CardSelectOption } from "@/components/ui/select-fields";

export type RiskAppetite = "conservative" | "moderate" | "aggressive";

const monthlyTransactionVolumes = [
  "Below ₦1M", "₦1M–₦10M", "₦10M–₦50M", "₦50M–₦200M", "Above ₦200M",
];

const averageMonthlyPayouts = ["Below 50", "50–200", "200–1000", "Above 1000"];

const nigerianBanks = [
  "Access Bank", "First Bank", "GTBank", "UBA", "Zenith Bank",
  "Stanbic IBTC", "Fidelity Bank", "Union Bank", "Polaris Bank",
  "Sterling Bank", "Wema Bank", "Other",
];

const useCaseOptions = [
  "Payroll Disbursement", "Vendor Payments", "Supplier Payments",
  "Contractor Payments", "Refunds and Reversals", "Inter-account Transfers",
];

const riskOptions: CardSelectOption<RiskAppetite>[] = [
  {
    value: "conservative",
    title: "Conservative",
    description: "Strict risk controls. Only very low risk payouts auto-approved.",
    icon: <Shield className="h-5 w-5 text-brand" />,
  },
  {
    value: "moderate",
    title: "Moderate",
    description: "Balanced approach. Review borderline cases.",
    icon: <Scale className="h-5 w-5 text-brand" />,
  },
  {
    value: "aggressive",
    title: "Aggressive",
    description: "Speed-focused. Flag only high-risk payouts.",
    icon: <Zap className="h-5 w-5 text-brand" />,
  },
];

interface Step1Props {
  businessName: string;
  setBusinessName: (v: string) => void;
  transactionVolume: string;
  setTransactionVolume: (v: string) => void;
  monthlyPayouts: string;
  setMonthlyPayouts: (v: string) => void;
  primaryBank: string;
  setPrimaryBank: (v: string) => void;
  selectedUseCases: string[];
  toggleUseCase: (v: string) => void;
  riskAppetite: RiskAppetite | "";
  setRiskAppetite: (v: RiskAppetite) => void;
}

export function Step1BusinessProfile({
  businessName, setBusinessName,
  transactionVolume, setTransactionVolume,
  monthlyPayouts, setMonthlyPayouts,
  primaryBank, setPrimaryBank,
  selectedUseCases, toggleUseCase,
  riskAppetite, setRiskAppetite,
}: Step1Props) {
  return (
    <div className="space-y-6">
      <Field label="Business Name">
        <TextInput value={businessName} onChange={setBusinessName} placeholder="e.g. Acme Corp" />
      </Field>

      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Monthly Transaction Volume">
          <SelectInput value={transactionVolume} onChange={setTransactionVolume} placeholder="Select volume range" options={monthlyTransactionVolumes} />
        </Field>
        <Field label="Average Monthly Payouts">
          <SelectInput value={monthlyPayouts} onChange={setMonthlyPayouts} placeholder="Select payout range" options={averageMonthlyPayouts} />
        </Field>
      </div>

      <Field label="Primary Bank">
        <SelectInput value={primaryBank} onChange={setPrimaryBank} placeholder="Select a primary bank" options={nigerianBanks} />
      </Field>

      <Field label="Primary Use Case">
        <PillSelect options={useCaseOptions} selected={selectedUseCases} onToggle={toggleUseCase} />
      </Field>

      <Field label="Risk Appetite">
        <CardSelect options={riskOptions} selected={riskAppetite} onChange={setRiskAppetite} />
      </Field>
    </div>
  );
}
