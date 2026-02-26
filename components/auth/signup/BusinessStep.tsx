import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, SelectInput } from "@/components/auth/ui/form-fields";

const businessTypes = [
  "Retail", "Manufacturing", "Services", "Logistics",
  "Healthcare", "Agriculture", "Technology", "Other",
];

const states = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa",
  "Benue", "Borno", "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti",
  "Enugu", "FCT - Abuja", "Gombe", "Imo", "Jigawa", "Kaduna", "Kano",
  "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa", "Niger",
  "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto",
  "Taraba", "Yobe", "Zamfara",
];

interface BusinessStepProps {
  businessName: string;
  setBusinessName: (v: string) => void;
  businessType: string;
  setBusinessType: (v: string) => void;
  registrationNumber: string;
  setRegistrationNumber: (v: string) => void;
  taxId: string;
  setTaxId: (v: string) => void;
  businessAddress: string;
  setBusinessAddress: (v: string) => void;
  city: string;
  setCity: (v: string) => void;
  state: string;
  setState: (v: string) => void;
  postalCode: string;
  setPostalCode: (v: string) => void;
  businessPhone: string;
  setBusinessPhone: (v: string) => void;
  websiteUrl: string;
  setWebsiteUrl: (v: string) => void;
  acceptedTerms: boolean;
  setAcceptedTerms: (v: boolean) => void;
  canSubmit: boolean;
  step2Submitted: boolean;
  onSubmit: (e: { preventDefault(): void }) => void;
  onBack: () => void;
}

export function BusinessStep({
  businessName, setBusinessName,
  businessType, setBusinessType,
  registrationNumber, setRegistrationNumber,
  taxId, setTaxId,
  businessAddress, setBusinessAddress,
  city, setCity,
  state, setState,
  postalCode, setPostalCode,
  businessPhone, setBusinessPhone,
  websiteUrl, setWebsiteUrl,
  acceptedTerms, setAcceptedTerms,
  canSubmit,
  step2Submitted,
  onSubmit,
  onBack,
}: BusinessStepProps) {
  return (
    <>
      <button
        type="button"
        onClick={onBack}
        className="mb-4 flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <h2 className="text-2xl font-semibold text-slate-900">Business Information.</h2>
      <p className="mt-2 text-sm text-slate-600">Tell us about your business to complete your account setup.</p>

      <form onSubmit={onSubmit} className="mt-6 space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Business Name">
            <Input value={businessName} onChange={(e) => setBusinessName(e.target.value)} className="h-11 rounded-xl" />
          </Field>
          <Field label="Business Type">
            <SelectInput value={businessType} onChange={setBusinessType} placeholder="Select type" options={businessTypes} />
          </Field>

          <Field label="Business Registration Number">
            <Input value={registrationNumber} onChange={(e) => setRegistrationNumber(e.target.value)} className="h-11 rounded-xl" />
          </Field>
          <Field label="Tax Identification Number">
            <Input value={taxId} onChange={(e) => setTaxId(e.target.value)} className="h-11 rounded-xl" />
          </Field>

          <Field label="Business Address" className="md:col-span-2">
            <textarea
              value={businessAddress}
              onChange={(e) => setBusinessAddress(e.target.value)}
              className="min-h-20 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />
          </Field>

          <Field label="City">
            <Input value={city} onChange={(e) => setCity(e.target.value)} className="h-11 rounded-xl" />
          </Field>
          <Field label="State">
            <SelectInput value={state} onChange={setState} placeholder="Select state" options={states} />
          </Field>

          <Field label="Country">
            <Input value="Nigeria" disabled className="h-11 rounded-xl bg-slate-100" />
          </Field>
          <Field label="Postal Code">
            <Input value={postalCode} onChange={(e) => setPostalCode(e.target.value)} className="h-11 rounded-xl" />
          </Field>

          <Field label="Business Phone">
            <div className="flex h-11 overflow-hidden rounded-xl border border-slate-300 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100">
              <span className="inline-flex items-center border-r border-slate-300 px-3 text-sm text-slate-600">🇳🇬 +234</span>
              <input
                value={businessPhone}
                onChange={(e) => setBusinessPhone(e.target.value)}
                className="w-full px-3 text-sm outline-none"
              />
            </div>
          </Field>
          <Field label="Website URL (Optional)">
            <Input value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} className="h-11 rounded-xl" />
          </Field>
        </div>

        <label className="flex items-start gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={acceptedTerms}
            onChange={(e) => setAcceptedTerms(e.target.checked)}
            className="mt-1"
          />
          <span>
            I agree to the <a href="#" className="underline">Terms of Service</a> and{" "}
            <a href="#" className="underline">Privacy Policy</a>
          </span>
        </label>

        {step2Submitted && !canSubmit && (
          <p className="text-sm text-red-600">Please fill in all required fields and accept the terms.</p>
        )}

        <Button type="submit" disabled={!canSubmit} className="h-11 w-full rounded-xl bg-blue-600 text-white hover:bg-blue-700">
          Create Business Account
        </Button>
      </form>
    </>
  );
}
