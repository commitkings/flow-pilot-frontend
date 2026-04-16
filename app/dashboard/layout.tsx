"use client";

import { Sidebar } from "@/components/dashboard/sidebar";
import { Navbar } from "@/components/dashboard/navbar";
import { TourGuide } from "@/components/dashboard/TourGuide";
import { DashboardShellProvider } from "@/components/dashboard-shell-context";
import { LoadingLogo } from "@/components/brand/LoadingLogo";
import { cn } from "@/lib/utils";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import { fetchHealth, updateMe } from "@/lib/api-client";
import { getUserRole } from "@/lib/api-types";
import { useKycStatus } from "@/hooks/use-kyc-queries";
import { useIdleTimeout } from "@/hooks/use-idle-timeout";
import Link from "next/link";
import { Clock, ShieldAlert, ShieldCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading, refreshUser, logout } = useAuth();
  const router = useRouter();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [payoutMode, setPayoutMode] = useState<string | null>(null);
  const [showTour, setShowTour] = useState(false);
  const [show2FAPrompt, setShow2FAPrompt] = useState(false);
  const [graceTimeLeft, setGraceTimeLeft] = useState<string | null>(null);
  const [idleWarning, setIdleWarning] = useState(false);

  const { data: kycData } = useKycStatus();
  const kycStatus = kycData?.kyc_status ?? null;

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }
    if (user && !user.email_verified) {
      router.replace("/verify-email");
      return;
    }
    if (user && !user.has_completed_onboarding) {
      router.replace("/onboarding");
      return;
    }
    // 2FA enforcement gate: only hard-redirect if the grace period has already expired.
    // Members still within their grace window are allowed in — they see a countdown banner instead.
    if (user && !user.totp_enabled && user.totp_grace_until) {
      const graceDue = new Date(user.totp_grace_until).getTime();
      if (Date.now() >= graceDue) {
        router.replace("/setup-2fa");
        return;
      }
    }
    // Auto-show tour for users who haven't taken it yet, or if retake was requested
    if (user) {
      const retake = typeof window !== "undefined" && sessionStorage.getItem("fp-retake-tour") === "1";
      if (!user.has_taken_tour || retake) {
        if (retake) sessionStorage.removeItem("fp-retake-tour");
        // Small delay so the sidebar fully renders before we measure element positions
        setTimeout(() => setShowTour(true), 600);
      }
    }
  }, [isLoading, isAuthenticated, user, router]);

  // Live countdown for 2FA grace period banner
  const formatGraceLeft = useCallback((graceUntil: string): string | null => {
    const msLeft = new Date(graceUntil).getTime() - Date.now();
    if (msLeft <= 0) return null;
    const h = Math.floor(msLeft / 3_600_000);
    const m = Math.floor((msLeft % 3_600_000) / 60_000);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  }, []);

  useEffect(() => {
    if (!user || user.totp_enabled || !user.totp_grace_until) {
      setGraceTimeLeft(null);
      return;
    }
    const update = () => setGraceTimeLeft(formatGraceLeft(user.totp_grace_until!));
    update();
    const id = setInterval(update, 60_000);
    return () => clearInterval(id);
  }, [user, formatGraceLeft]);

  // Fetch payout mode for simulated banner
  useEffect(() => {
    let cancelled = false;
    fetchHealth()
      .then((h) => { if (!cancelled) setPayoutMode(h.payout_mode); })
      .catch(() => { /* silently ignore */ });
    return () => { cancelled = true; };
  }, []);

  const handleTourComplete = async () => {
    setShowTour(false);
    const wasFirstTour = !user?.has_taken_tour;
    try {
      await updateMe({ has_taken_tour: true } as never);
      await refreshUser();
    } catch {
      // best-effort — tour still closes
    }
    if (wasFirstTour && user && !user.totp_enabled) {
      setShow2FAPrompt(true);
    }
  };

  const handleTourSkip = async () => {
    setShowTour(false);
    try {
      await updateMe({ has_taken_tour: true } as never);
      await refreshUser();
    } catch {
      // best-effort
    }
    // No 2FA prompt on skip/cancel
  };

  useIdleTimeout({
    timeoutMs: 30 * 60 * 1000,
    warnBeforeMs: 5 * 60 * 1000,
    enabled: isAuthenticated,
    onWarn: () => setIdleWarning(true),
    onIdle: () => {
      setIdleWarning(false);
      logout();
    },
  });

  if (isLoading) {
    return <LoadingLogo />;
  }

  // Block render if not authed, not verified, or not onboarded.
  // For 2FA grace period: only block if grace has actually expired (active grace = show banner, not block).
  const graceExpired =
    user && !user.totp_enabled && !!user.totp_grace_until &&
    Date.now() >= new Date(user.totp_grace_until).getTime();

  if (!isAuthenticated || (user && (!user.email_verified || !user.has_completed_onboarding || graceExpired))) {
    return null;
  }

  return (
    <>
    {showTour && (
      <TourGuide
        userRole={getUserRole(user)}
        onComplete={handleTourComplete}
        onSkip={handleTourSkip}
        openMobileMenu={() => { if (!mobileMenuOpen) setMobileMenuOpen(true); }}
        closeMobileMenu={() => { if (mobileMenuOpen) setMobileMenuOpen(false); }}
      />
    )}

    {/* 2FA encouragement popup — shown after tour completion for users without 2FA */}
    {show2FAPrompt && (
      <div className="fixed inset-0 z-[300] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
        <div className="relative w-full max-w-sm rounded-2xl bg-card border border-border shadow-2xl p-6">
          <button
            onClick={() => setShow2FAPrompt(false)}
            className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand/10 mb-4">
            <ShieldCheck className="h-6 w-6 text-brand" />
          </div>
          <h3 className="text-lg font-bold text-foreground leading-snug">Secure your account</h3>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            Enable two-factor authentication to protect your account and your team's payouts.
          </p>
          <div className="mt-5 flex gap-3">
            <Button
              className="flex-1 rounded-full bg-brand text-white hover:opacity-90"
              onClick={() => {
                setShow2FAPrompt(false);
                router.push("/dashboard/settings?tab=security");
              }}
            >
              Set up 2FA
            </Button>
            <Button
              variant="ghost"
              className="flex-1 rounded-full text-muted-foreground"
              onClick={() => setShow2FAPrompt(false)}
            >
              Maybe later
            </Button>
          </div>
        </div>
      </div>
    )}
    <DashboardShellProvider
      value={{
        collapsed,
        toggleSidebar: () => setCollapsed((prev) => !prev),
        openNewRun: () => router.push("/dashboard/runs/new"),
        mobileMenuOpen,
        toggleMobileMenu: () => setMobileMenuOpen((prev) => !prev),
        inviteOpen,
        setInviteOpen,
        startTour: () => setShowTour(true),
      }}
    >
      <div className="min-h-screen bg-background text-foreground">
        <Sidebar />
        <div className={cn(
          "flex flex-col min-h-screen transition-all duration-300 ease-in-out",
          "ml-0 bg-white",
          collapsed ? "md:ml-20" : "md:ml-64"
        )}>
          {payoutMode === "simulated" && (
            <div className="flex items-center justify-center gap-2 bg-black/90 px-4 py-2 text-xs font-medium text-white/70">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#e86727] animate-pulse" />
              Demo Mode — Payouts are simulated. No real funds will move.
            </div>
          )}
          {kycStatus && kycStatus !== "verified" && (
            <div className={`flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium ${kycStatus === "pending" ? "bg-amber-500/10 text-amber-800" : "bg-[#e86727]/10 text-[#e86727]"}`}>
              <span className={`inline-block h-1.5 w-1.5 rounded-full animate-pulse ${kycStatus === "pending" ? "bg-amber-500" : "bg-[#e86727]"}`} />
              {kycStatus === "pending"
                ? "Your documents are under review — you'll be notified within 10 minutes."
                : "Complete your business verification (KYC) to unlock payouts."}
              <Link href="/dashboard/kyc" className="underline font-semibold ml-1">
                {kycStatus === "pending" ? "View status" : "Verify now"}
              </Link>
            </div>
          )}
          {graceTimeLeft && (
            <div className="flex items-center justify-center gap-2 bg-red-600/10 px-4 py-2 text-xs font-medium text-red-700 dark:text-red-400">
              <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
              Your organisation requires two-factor authentication.
              <span className="font-bold">{graceTimeLeft} remaining</span> to set it up before your access is restricted.
              <Link
                href="/dashboard/settings?tab=security"
                className="ml-1 underline font-semibold hover:opacity-80"
              >
                Set up 2FA now
              </Link>
            </div>
          )}
          {idleWarning && (
            <div className="flex items-center justify-center gap-2 bg-amber-500/10 px-4 py-2 text-xs font-medium text-amber-800">
              <Clock className="h-3.5 w-3.5 shrink-0" />
              You&apos;ve been inactive for 25 minutes. You&apos;ll be logged out in 5 minutes unless you continue.
              <button
                type="button"
                onClick={() => setIdleWarning(false)}
                className="ml-2 underline font-semibold hover:opacity-80"
              >
                Stay logged in
              </button>
            </div>
          )}
          <Navbar />
          <main className="flex-1 p-3 md:p-8 lg:p-10 pb-20 md:pb-8">
            <div className="mx-auto max-w-7xl">
              {children}
            </div>
          </main>
        </div>
      </div>
    </DashboardShellProvider>
    </>
  );
}
