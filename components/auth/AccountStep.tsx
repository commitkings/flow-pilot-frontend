import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Field,
  PasswordInput,
  TextInput,
} from "@/components/ui/form-fields";
import { GoogleIcon } from "@/public/svg/GoogleIcon";

interface AccountStepProps {
  firstName: string;
  setFirstName: (v: string) => void;
  lastName: string;
  setLastName: (v: string) => void;
  workEmail: string;
  setWorkEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  confirmPassword: string;
  setConfirmPassword: (v: string) => void;
  showPassword: boolean;
  onTogglePassword: () => void;
  showConfirm: boolean;
  onToggleConfirm: () => void;
  passwordMismatch: boolean;
  onSubmit: (e: { preventDefault(): void }) => void;
  loading?: boolean;
}

export function AccountStep({
  firstName,
  setFirstName,
  lastName,
  setLastName,
  workEmail,
  setWorkEmail,
  password,
  setPassword,
  confirmPassword,
  setConfirmPassword,
  showPassword,
  onTogglePassword,
  showConfirm,
  onToggleConfirm,
  onSubmit,
  loading = false,
}: AccountStepProps) {
  return (
    <>
      <h2 className="text-2xl font-semibold text-slate-900">
        Create your account.
      </h2>
      <p className="mt-2 text-sm text-slate-600">
        Start with a 14-day free trial. No credit card required.
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-6">
        <Button
          type="button"
          variant="outline"
          className="group relative h-12 w-full rounded-full border-border-strong bg-background px-8 text-sm font-semibold text-foreground transition-all hover:bg-muted active:scale-[0.98]"
        >
          <div className="flex items-center justify-center gap-3">
            <GoogleIcon className="h-5 w-5 transition-transform group-hover:scale-110" />
            <span>Continue with Google</span>
          </div>
        </Button>

        <div className="relative flex items-center justify-center text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          <span className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-border" />

          <span className="relative bg-background px-4">
            or sign up with email
          </span>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label="First Name">
            <TextInput
              value={firstName}
              onChange={setFirstName}
              placeholder="Enter Your FirstName"
              required
            />
          </Field>

          <Field label="Last Name">
            <TextInput
              value={lastName}
              onChange={setLastName}
              placeholder="Enter Your LastName"
              required
            />
          </Field>

          <Field label="Work Email" className="md:col-span-2">
            <TextInput
              type="email"
              value={workEmail}
              onChange={setWorkEmail}
              placeholder="Enter Your Email"
              required
            />
          </Field>
          <Field label="Password">
            <PasswordInput
              value={password}
              onChange={setPassword}
              show={showPassword}
              onToggle={onTogglePassword}
              required
            />
          </Field>
          <Field label="Confirm Password">
            <PasswordInput
              value={confirmPassword}
              onChange={setConfirmPassword}
              show={showConfirm}
              onToggle={onToggleConfirm}
              required
            />
          </Field>
        </div>

        <Button
          type="submit"
          loading={loading}
          className="h-12 w-full rounded-full bg-primary text-primary-foreground font-bold transition-all hover:opacity-90 active:scale-[0.98] shadow-lg shadow-black/5"
        >
          Continue
        </Button>

        <p className="text-center text-sm font-medium text-muted-foreground">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-bold text-brand transition-colors hover:opacity-80"
          >
            Log In
          </Link>
        </p>
      </form>
    </>
  );
}
