"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { Suspense } from "react";
import { LoadingLogo } from "@/components/brand/LoadingLogo";
import { toast } from "sonner";

const OAUTH_ERROR_MESSAGES: Record<string, string> = {
  google_unavailable:
    "Unable to reach Google. Please try again or sign in with email and password.",
  account_disabled:
    "Your account has been disabled. Please contact support.",
};

function CallbackHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { loginWithToken } = useAuth();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    // Handle error redirects sent back by the OAuth callback endpoint
    const error = searchParams.get("error");
    if (error) {
      const message =
        OAUTH_ERROR_MESSAGES[error] ?? "Google sign-in failed. Please try again.";
      toast.error(message);
      router.replace("/login");
      return;
    }

    const token = searchParams.get("token");
    if (!token) {
      router.replace("/login");
      return;
    }

    const requires2fa = searchParams.get("requires_2fa_setup") === "true";

    loginWithToken(token)
      .then(() => {
        if (requires2fa) {
          router.replace("/dashboard/settings?tab=security&setup2fa=1");
        } else {
          router.replace("/dashboard/runs");
        }
      })
      .catch(() => {
        router.replace("/login");
      });
  }, [searchParams, loginWithToken, router]);

  return <LoadingLogo />;
}

export default function CallbackPage() {
  return (
    <Suspense fallback={<LoadingLogo />}>
      <CallbackHandler />
    </Suspense>
  );
}
