import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Checkbox, Field, PasswordInput, TextInput } from "@/components/ui/form-fields";
import { GoogleIcon } from "@/public/svg/GoogleIcon";

interface LoginFormProps {
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  rememberMe: boolean;
  setRememberMe: (v: boolean) => void;
  showPassword: boolean;
  onTogglePassword: () => void;
  loading: boolean;
  credentialsError: boolean;
  submitted: boolean;
  onSubmit: (e: { preventDefault(): void }) => void;
  onGoogle: () => void;
}

export function LoginForm({
  email, setEmail,
  password, setPassword,
  rememberMe, setRememberMe,
  showPassword, onTogglePassword,
  loading,
  // credentialsError,
  // submitted,
  onSubmit,
  onGoogle,
}: LoginFormProps) {

  return (
    <>
      <h2 className="text-2xl font-semibold text-foreground">Log in to your workspace.</h2>
      <p className="mt-2 text-sm text-muted-foreground">Enter your credentials to access your dashboard.</p>

      <form onSubmit={onSubmit} className="mt-6 space-y-5">
        <Button
          type="button"
          variant="outline"
          onClick={onGoogle}
          className="group h-12 w-full rounded-full border-border-strong bg-background px-8 text-sm font-semibold text-foreground transition-all hover:bg-muted active:scale-[0.98]"
        >
          <div className="flex items-center justify-center gap-3">
            <GoogleIcon className="h-5 w-5 transition-transform group-hover:scale-110" />
            <span>Continue with Google</span>
          </div>
        </Button>

        <div className="relative flex items-center justify-center text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          <span className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-border" />
          <span className="relative bg-background px-4">or continue with email</span>
        </div>

        <div className="space-y-4">
          <Field label="Work Email">
            <TextInput
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="you@company.com"
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
        </div>

        <div className="flex items-center justify-between">
          <Checkbox
            checked={rememberMe}
            onChange={setRememberMe}
            label="Remember me"
          />
          <Link href="/forgot-password" className="text-sm font-semibold text-brand transition-colors hover:opacity-80">
            Forgot password?
          </Link>
        </div>

        <Button
          type="submit"
          loading={loading}
          className="h-12 w-full rounded-full bg-primary text-primary-foreground font-bold transition-all hover:opacity-90 active:scale-[0.98] shadow-lg shadow-black/5"
        >
          Log In
        </Button>

        <p className="text-center text-sm font-medium text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-bold text-brand transition-colors hover:opacity-80">
            Sign up free
          </Link>
        </p>

        <p className="text-center text-xs text-muted-foreground/60">
          Protected by 256-bit encryption · SOC 2 compliant.
        </p>
      </form>
    </>
  );
}
