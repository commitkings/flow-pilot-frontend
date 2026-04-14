"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Clock,
  Copy,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { OtpInput } from "@/components/ui/form-fields";
import { Logo } from "@/components/brand/Logo";
import { useAuth } from "@/context/auth-context";
import { use2FASetup, use2FAEnable } from "@/hooks/use-2fa-queries";

function formatTimeLeft(isoDeadline: string): string {
  const ms = new Date(isoDeadline).getTime() - Date.now();
  if (ms <= 0) return "expired";
  const totalMinutes = Math.floor(ms / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

type Step = "intro" | "scanning" | "backup-shown";

export default function Setup2FAPage() {
  const { user, isLoading, isAuthenticated, refreshUser } = useAuth();
  const router = useRouter();

  const twoFASetup = use2FASetup();
  const twoFAEnable = use2FAEnable();

  const [step, setStep] = useState<Step>("intro");
  const [setupData, setSetupData] = useState<{ secret: string; qr_code: string } | null>(null);
  const [code, setCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string | null>(null);

  // Auth guard — redirect unauthenticated users and those who already have 2FA
  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }
    if (user?.totp_enabled) {
      router.replace("/dashboard");
    }
  }, [isLoading, isAuthenticated, user, router]);

  // Keep the countdown live
  useEffect(() => {
    if (!user?.totp_grace_until) return;
    const update = () => setTimeLeft(formatTimeLeft(user.totp_grace_until!));
    update();
    const id = setInterval(update, 30_000);
    return () => clearInterval(id);
  }, [user?.totp_grace_until]);

  const graceExpired =
    user?.totp_grace_until ? new Date(user.totp_grace_until).getTime() <= Date.now() : false;

  const handleStartSetup = async () => {
    const data = await twoFASetup.mutateAsync();
    setSetupData(data);
    setCode("");
    setStep("scanning");
  };

  const handleEnable = async () => {
    const result = await twoFAEnable.mutateAsync(code);
    setBackupCodes(result.backup_codes);
    setStep("backup-shown");
    setCode("");
  };

  const handleDone = async () => {
    await refreshUser();
    router.replace("/dashboard");
  };

  const copyBackupCodes = () => {
    navigator.clipboard.writeText(backupCodes.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border/50 px-6 py-4">
        <Logo variant="full" size="md" color="darkblue" />
        <span className="text-sm text-muted-foreground">
          Signed in as <span className="font-medium text-foreground">{user.email}</span>
        </span>
      </header>

      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center px-4 py-12">
        {/* ── Intro step ── */}
        {step === "intro" && (
          <div className="w-full space-y-6 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand/10 text-brand">
              <ShieldCheck className="h-8 w-8" />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Two-factor authentication required
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Your organisation requires all members to protect their account with an
                authenticator app. Set it up now to access your dashboard.
              </p>
            </div>

            {/* Grace period badge */}
            {user.totp_grace_until && !graceExpired && timeLeft && (
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300">
                <Clock className="h-4 w-4 shrink-0" />
                Grace period ends in {timeLeft}
              </div>
            )}
            {graceExpired && (
              <div className="inline-flex items-center gap-2 rounded-full border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm font-medium text-destructive">
                <Clock className="h-4 w-4 shrink-0" />
                Grace period has expired — set up 2FA to regain access
              </div>
            )}

            <div className="space-y-3 rounded-2xl border border-border/60 bg-muted/30 p-5 text-left text-sm text-muted-foreground">
              <p className="font-semibold text-foreground">What you&apos;ll need:</p>
              <ul className="list-disc space-y-1.5 pl-5">
                <li>An authenticator app — Google Authenticator, Authy, or 1Password all work</li>
                <li>About 2 minutes to scan a QR code and save your backup codes</li>
              </ul>
            </div>

            <Button
              className="h-12 w-full rounded-full bg-brand text-white font-bold shadow-sm transition-all hover:opacity-90"
              onClick={handleStartSetup}
              disabled={twoFASetup.isPending}
            >
              {twoFASetup.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Get Started"
              )}
            </Button>
          </div>
        )}

        {/* ── Scanning step ── */}
        {step === "scanning" && setupData && (
          <div className="w-full space-y-6">
            <div className="text-center">
              <h1 className="text-xl font-bold text-foreground">Set up your authenticator</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Follow the two steps below to link your app.
              </p>
            </div>

            <div className="space-y-5 rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Step 1 — Scan this QR code
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Open your authenticator app, tap &quot;Add account&quot;, and scan the code below.
                </p>
              </div>

              <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
                <img
                  src={`data:image/png;base64,${setupData.qr_code}`}
                  alt="2FA QR Code"
                  className="h-44 w-44 rounded-xl border border-border/60 shadow-sm"
                />
                <div className="min-w-0 flex-1 space-y-2">
                  <p className="text-xs text-muted-foreground">
                    Can&apos;t scan? Enter this key manually instead:
                  </p>
                  <code className="block break-all rounded-lg border border-border/60 bg-muted px-3 py-2 font-mono text-xs text-foreground">
                    {setupData.secret}
                  </code>
                </div>
              </div>

              <div className="border-t border-border/50 pt-4">
                <p className="text-sm font-semibold text-foreground">
                  Step 2 — Enter the 6-digit code shown in your app
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  The code refreshes every 30 seconds.
                </p>
                <div className="mt-3">
                  <OtpInput length={6} value={code} onChange={setCode} />
                </div>
              </div>
            </div>

            <Button
              className="h-12 w-full rounded-full bg-brand text-white font-bold shadow-sm hover:opacity-90"
              onClick={handleEnable}
              disabled={twoFAEnable.isPending || code.length < 6}
            >
              {twoFAEnable.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Confirm & Activate 2FA"
              )}
            </Button>
          </div>
        )}

        {/* ── Backup codes step ── */}
        {step === "backup-shown" && (
          <div className="w-full space-y-6">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand/10 text-brand">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <h1 className="text-xl font-bold text-foreground">2FA is active!</h1>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Save these backup codes somewhere safe. Each code can only be used once —
                you&apos;ll need them if you ever lose access to your authenticator app.
              </p>
            </div>

            <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm space-y-4">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {backupCodes.map((c) => (
                  <code
                    key={c}
                    className="rounded-lg border border-border/60 bg-muted px-3 py-2 text-center font-mono text-xs font-semibold tracking-wider text-foreground"
                  >
                    {c}
                  </code>
                ))}
              </div>
              <Button
                variant="outline"
                className="w-full rounded-full shadow-sm"
                onClick={copyBackupCodes}
              >
                {copied ? (
                  <><CheckCircle2 className="mr-2 h-4 w-4 text-brand" />Copied!</>
                ) : (
                  <><Copy className="mr-2 h-4 w-4" />Copy All Codes</>
                )}
              </Button>
            </div>

            <Button
              className="h-12 w-full rounded-full bg-brand text-white font-bold shadow-sm hover:opacity-90"
              onClick={handleDone}
            >
              I&apos;ve saved my codes — Go to Dashboard
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
