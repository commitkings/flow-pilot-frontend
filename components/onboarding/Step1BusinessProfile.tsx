import { Field, SelectInput, TextInput } from "@/components/ui/form-fields";

// Re-exported for consumers that still import RiskAppetite from this file
export type { RiskAppetite } from "./Step2UseCaseRisk";

const monthlyTransactionVolumes = [
  "Below ₦1M", "₦1M–₦10M", "₦10M–₦50M", "₦50M–₦200M", "Above ₦200M",
];

const averageMonthlyPayouts = ["Below 50", "50–200", "200–1000", "Above 1000"];

interface Step1Props {
  businessName: string;
  setBusinessName: (v: string) => void;
  transactionVolume: string;
  setTransactionVolume: (v: string) => void;
  monthlyPayouts: string;
  setMonthlyPayouts: (v: string) => void;
}

export function Step1BusinessProfile({
  businessName, setBusinessName,
  transactionVolume, setTransactionVolume,
  monthlyPayouts, setMonthlyPayouts,
}: Step1Props) {
  return (
    <div className="space-y-6">
      <Field label="Business Name">
        <TextInput value={businessName} onChange={setBusinessName} placeholder="e.g. Acme Corp" />
      </Field>

      <div className="grid gap-5 md:grid-cols-2">
        <Field label="How much money do you move monthly?">
          <SelectInput value={transactionVolume} onChange={setTransactionVolume} placeholder="Select a range" options={monthlyTransactionVolumes} />
        </Field>
        <Field label="How many payments do you send per month?">
          <SelectInput value={monthlyPayouts} onChange={setMonthlyPayouts} placeholder="Select a range" options={averageMonthlyPayouts} />
        </Field>
      </div>
    </div>
  );
}
