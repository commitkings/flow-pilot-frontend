import { Field, SelectInput, TextInput } from "@/components/ui/form-fields";

// Re-exported for consumers that still import RiskAppetite from this file
export type { RiskAppetite } from "./Step2UseCaseRisk";

const monthlyTransactionVolumes = [
  "Below ₦1M", "₦1M–₦10M", "₦10M–₦50M", "₦50M–₦200M", "Above ₦200M",
];

const averageMonthlyPayouts = ["Below 50", "50–200", "200–1000", "Above 1000"];

const nigerianBanks = [
  "Access Bank", "First Bank", "GTBank", "UBA", "Zenith Bank",
  "Stanbic IBTC", "Fidelity Bank", "Union Bank", "Polaris Bank",
  "Sterling Bank", "Wema Bank", "Other",
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
}

export function Step1BusinessProfile({
  businessName, setBusinessName,
  transactionVolume, setTransactionVolume,
  monthlyPayouts, setMonthlyPayouts,
  primaryBank, setPrimaryBank,
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
    </div>
  );
}
