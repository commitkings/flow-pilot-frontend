"use client";

import { useState } from "react";
import { ShieldCheck, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OtpInput } from "@/components/ui/form-fields";
import { Input } from "@/components/ui/input";
import { verifyMfa, backupCodeLogin } from "@/lib/api-client";

interface MfaVerifyStepProps {
  mfaToken: string;
  onSuccess: (token: string) => void;
  onBack: () => void;
}

export function MfaVerifyStep({ mfaToken, onSuccess, onBack }: MfaVerifyStepProps) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [useBackup, setUseBackup] = useState(false);
  const [backupCode, setBackupCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async () => {
    setError(null);
    setLoading(true);
    try {
      const { token } = await verifyMfa(mfaToken, code);
      onSuccess(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleBackupLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      const { token } = await backupCodeLogin(mfaToken, backupCode.trim());
      onSuccess(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid backup code.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand/10 text-brand">
        <ShieldCheck className="h-8 w-8" />
      </div>

      <h2 className="mt-5 text-center text-xl font-semibold text-foreground">
        Two-factor authentication
      </h2>
      <p className="mt-2 text-center text-sm leading-relaxed text-muted-foreground">
        {useBackup
          ? "Enter one of your backup codes to sign in."
          : "Open your authenticator app and enter the 6-digit code."}
      </p>

      <div className="mt-8 space-y-4">
        {useBackup ? (
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Backup Code</label>
            <Input
              value={backupCode}
              onChange={(e) => setBackupCode(e.target.value)}
              placeholder="XXXXXXXXXXXX"
              className="h-12 rounded-xl font-mono text-center tracking-widest text-base"
              autoComplete="off"
              autoFocus
            />
          </div>
        ) : (
          <OtpInput length={6} value={code} onChange={setCode} />
        )}

        {error && (
          <p className="text-center text-sm font-medium text-destructive">{error}</p>
        )}

        <Button
          type="button"
          onClick={useBackup ? handleBackupLogin : handleVerify}
          disabled={loading || (useBackup ? backupCode.trim().length === 0 : code.length < 6)}
          className="mt-2 h-12 w-full rounded-full bg-primary text-primary-foreground font-bold transition-all hover:opacity-90 active:scale-[0.98] shadow-lg shadow-black/5"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Verify & Sign In"
          )}
        </Button>
      </div>

      <div className="mt-6 flex flex-col items-center gap-3">
        <button
          type="button"
          onClick={() => { setUseBackup((p) => !p); setCode(""); setBackupCode(""); setError(null); }}
          className="text-sm font-semibold text-brand transition-colors hover:opacity-80"
        >
          {useBackup ? "Use authenticator app instead" : "Use a backup code instead"}
        </button>

        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to login
        </button>
      </div>
    </div>
  );
}
