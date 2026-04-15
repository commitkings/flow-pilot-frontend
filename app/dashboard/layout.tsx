"use client";

import { Sidebar } from "@/components/dashboard/sidebar";
import { Navbar } from "@/components/dashboard/navbar";
import { TourGuide } from "@/components/dashboard/TourGuide";
import { DashboardShellProvider } from "@/components/dashboard-shell-context";
import { LoadingLogo } from "@/components/brand/LoadingLogo";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { useRouter } from "next/navigation";
import { fetchHealth, updateMe } from "@/lib/api-client";
import { getUserRole } from "@/lib/api-types";
import { useKycStatus } from "@/hooks/use-kyc-queries";
import Link from "next/link";
import { ShieldCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading, refreshUser } = useAuth();
  const router = useRouter();

  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [payoutMode, setPayoutMode] = useState<string | null>(null);
  const [showTour, setShowTour] = useState(false);
  const [show2FAPrompt, setShow2FAPrompt] = useState(false);

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
    // 2FA enforcement gate: if the org requires 2FA and this user hasn't set it up yet,
    // send them to the forced setup page regardless of whether the grace period is still active.
    if (user && !user.totp_enabled && user.totp_grace_until) {
      router.replace("/setup-2fa");
      return;
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

  // Fetch payout mode for simulated banner
  useEffect(() => {
    let cancelled = false;
    fetchHealth()
      .then((h) => { if (!cancelled) setPayoutMode(h.payout_mode); })
      .catch(() => { /* silently ignore */ });
    return () => { cancelled = true; };
  }, []);

  const handleTourDone = async () => {
    setShowTour(false);
    try {
      await updateMe({ has_taken_tour: true } as never);
      await refreshUser();
    } catch {
      // best-effort — tour still closes
    }
    // Prompt 2FA setup for users who haven't enabled it yet
    if (user && !user.totp_enabled) {
      setShow2FAPrompt(true);
    }
  };

  if (isLoading) {
    return <LoadingLogo />;
  }

  if (!isAuthenticated || (user && (!user.email_verified || !user.has_completed_onboarding || (!user.totp_enabled && !!user.totp_grace_until)))) {
    return null;
  }

  return (
    <>
    {showTour && (
      <TourGuide
        userRole={getUserRole(user)}
        onComplete={handleTourDone}
        onSkip={handleTourDone}
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
                : "Complete your business verification (KYC) to unlock payout runs."}
              <Link href="/dashboard/kyc" className="underline font-semibold ml-1">
                {kycStatus === "pending" ? "View status" : "Verify now"}
              </Link>
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
