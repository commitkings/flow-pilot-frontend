import { Field, SelectInput, TextInput, AmountInput, NumericInput } from "@/components/ui/form-fields";

const states = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa",
  "Benue", "Borno", "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti",
  "Enugu", "FCT - Abuja", "Gombe", "Imo", "Jigawa", "Kaduna", "Kano",
  "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger",
  "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto",
  "Taraba", "Yobe", "Zamfara",
];

interface Step2Props {
  merchantAccountId: string;
  setMerchantAccountId: (v: string) => void;
  merchantState: string;
  setMerchantState: (v: string) => void;
  dailyPayoutLimit: string;
  setDailyPayoutLimit: (v: string) => void;
  singlePayoutLimit: string;
  setSinglePayoutLimit: (v: string) => void;
  riskAlertThreshold: string;
  setRiskAlertThreshold: (v: string) => void;
  liquidityAlertThreshold: string;
  setLiquidityAlertThreshold: (v: string) => void;
}

export function Step2FinancialSetup({
  merchantAccountId, setMerchantAccountId,
  merchantState, setMerchantState,
  dailyPayoutLimit, setDailyPayoutLimit,
  singlePayoutLimit, setSinglePayoutLimit,
  riskAlertThreshold, setRiskAlertThreshold,
  liquidityAlertThreshold, setLiquidityAlertThreshold,
}: Step2Props) {
  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
      <Field label="Interswitch Merchant Account ID" className="md:col-span-2">
        <TextInput value={merchantAccountId} onChange={setMerchantAccountId} placeholder="Enter merchant account ID" />
      </Field>

      <Field label="Registered State">
        <SelectInput value={merchantState} onChange={setMerchantState} placeholder="Select state" options={states} />
      </Field>

      <Field label="Default Daily Payout Limit (₦)">
        <AmountInput value={dailyPayoutLimit} onChange={setDailyPayoutLimit} placeholder="e.g. 5,000,000" />
      </Field>

      <Field label="Single Payout Cap (₦)">
        <AmountInput value={singlePayoutLimit} onChange={setSinglePayoutLimit} placeholder="e.g. 250,000" />
      </Field>

      <Field label="Risk Alert Threshold">
        <NumericInput value={riskAlertThreshold} onChange={setRiskAlertThreshold} placeholder="e.g. 0.35" decimal />
      </Field>

      <Field label="Liquidity Alert Buffer (%)">
        <NumericInput value={liquidityAlertThreshold} onChange={setLiquidityAlertThreshold} placeholder="e.g. 15" />
      </Field>
    </div>
  );
}
