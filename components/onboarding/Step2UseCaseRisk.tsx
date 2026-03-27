import { Scale, Shield, Zap } from "lucide-react";
import { Field } from "@/components/ui/form-fields";
import { CardSelect, PillSelect, type CardSelectOption } from "@/components/ui/select-fields";

export type RiskAppetite = "conservative" | "moderate" | "aggressive";

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

interface Step2Props {
  selectedUseCases: string[];
  toggleUseCase: (v: string) => void;
  riskAppetite: RiskAppetite | "";
  setRiskAppetite: (v: RiskAppetite) => void;
}

export function Step2UseCaseRisk({
  selectedUseCases, toggleUseCase,
  riskAppetite, setRiskAppetite,
}: Step2Props) {
  return (
    <div className="space-y-6">
      <Field label="Primary Use Case">
        <PillSelect options={useCaseOptions} selected={selectedUseCases} onToggle={toggleUseCase} />
      </Field>

      <Field label="Risk Appetite">
        <CardSelect options={riskOptions} selected={riskAppetite} onChange={setRiskAppetite} />
      </Field>
    </div>
  );
}
