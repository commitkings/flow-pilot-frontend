import { Field, SelectInput } from "@/components/ui/form-fields";
import { PillSelect } from "@/components/ui/select-fields";

export type RiskAppetite = "conservative" | "moderate" | "aggressive";

const useCaseOptions = [
  "Staff Salaries", "Vendor Payments", "Supplier Payments",
  "Contractor / Freelancer Payments", "Refunds", "Moving Money Between Accounts",
];

const riskOptions = ["Careful – strict checks on everything", "Balanced – review edge cases", "Fast – only flag obvious issues"];

const riskLabelToValue: Record<string, RiskAppetite> = {
  "Careful – strict checks on everything": "conservative",
  "Balanced – review edge cases": "moderate",
  "Fast – only flag obvious issues": "aggressive",
};

const riskValueToLabel: Record<RiskAppetite, string> = {
  conservative: "Careful – strict checks on everything",
  moderate: "Balanced – review edge cases",
  aggressive: "Fast – only flag obvious issues",
};

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
      <Field label="What do you mainly send money for?">
        <PillSelect options={useCaseOptions} selected={selectedUseCases} onToggle={toggleUseCase} />
      </Field>

      <Field label="How careful should we be with payments?">
        <SelectInput
          value={riskAppetite ? riskValueToLabel[riskAppetite] : ""}
          onChange={(v) => setRiskAppetite(riskLabelToValue[v])}
          placeholder="Choose your preference"
          options={riskOptions}
        />
      </Field>
    </div>
  );
}
