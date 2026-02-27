import { ArrowLeft, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Checkbox,
  Field,
  PhoneInput,
  SelectInput,
  TextareaInput,
  TextInput,
} from "@/components/ui/form-fields";

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
  // onBack,
}: BusinessStepProps) {
  return (
    <>
      {/* <button
        type="button"
        onClick={onBack}
        className="mb-5 bg-brand/10 border border-brand flex items-center p-2 rounded-full text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4 text-brand" />
      </button> */}

      <h2 className="text-2xl font-semibold text-foreground">Business Information.</h2>
      <p className="mt-2 text-sm text-muted-foreground">Tell us about your business to complete your account setup.</p>

      <form onSubmit={onSubmit} className="mt-6 space-y-6">
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Business Name">
            <TextInput value={businessName} onChange={setBusinessName} placeholder="Acme Corp Ltd." />
          </Field>
          <Field label="Business Type">
            <SelectInput value={businessType} onChange={setBusinessType} placeholder="Select type" options={businessTypes} />
          </Field>

          <Field label="Registration Number">
            <TextInput value={registrationNumber} onChange={setRegistrationNumber} placeholder="RC-000000" />
          </Field>
          <Field label="Tax ID (TIN)">
            <TextInput value={taxId} onChange={setTaxId} placeholder="00000000-0001" />
          </Field>

          <Field label="Business Address" className="md:col-span-2">
            <TextareaInput value={businessAddress} onChange={setBusinessAddress} placeholder="Street address, building, floor…" />
          </Field>

          <Field label="City">
            <TextInput value={city} onChange={setCity} placeholder="Lagos" />
          </Field>
          <Field label="State">
            <SelectInput value={state} onChange={setState} placeholder="Select state" options={states} />
          </Field>

          <Field label="Country">
            <TextInput value="Nigeria" onChange={() => {}} disabled />
          </Field>
          <Field label="Postal Code">
            <TextInput value={postalCode} onChange={setPostalCode} placeholder="100001" />
          </Field>

          <Field label="Business Phone">
            <PhoneInput value={businessPhone} onChange={setBusinessPhone} />
          </Field>
          <Field label="Website URL (Optional)">
            <TextInput value={websiteUrl} onChange={setWebsiteUrl} placeholder="https://yourcompany.com" />
          </Field>
        </div>

        <Checkbox
          checked={acceptedTerms}
          onChange={setAcceptedTerms}
          label={
            <span>
              I agree to the{" "}
              <a href="#" className="font-semibold text-brand underline-offset-2 hover:underline">Terms of Service</a>{" "}
              and{" "}
              <a href="#" className="font-semibold text-brand underline-offset-2 hover:underline">Privacy Policy</a>
            </span>
          }
        />

        {step2Submitted && !canSubmit && (
          <p className="text-sm text-destructive">Please fill in all required fields and accept the terms.</p>
        )}

        <Button
          type="submit"
          disabled={!canSubmit}
          className="h-12 w-full rounded-full bg-primary text-primary-foreground font-bold transition-all hover:opacity-90 active:scale-[0.98] shadow-lg shadow-black/5"
        >
          Create Business Account
        </Button>
      </form>
    </>
  );
}
