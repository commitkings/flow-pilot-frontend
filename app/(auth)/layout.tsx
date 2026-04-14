"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { LoadingLogo } from "@/components/brand/LoadingLogo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // The verify-email page lives inside this layout group but must be accessible
  // to authenticated users whose email hasn't been verified yet.
  const isVerifyPage = pathname === "/verify-email";
  // Unverified users must be able to reach /login so they can re-authenticate
  // and receive a fresh verification code without waiting out the resend cooldown.
  const isLoginPage = pathname === "/login";

  useEffect(() => {
    if (isLoading || !isAuthenticated) return;

    // Authenticated and on the verify-email page — let the page handle itself
    if (isVerifyPage) return;

    if (user && !user.email_verified) {
      // Allow unverified users to sit on /login so they can log in again
      // (which triggers a fresh verification email on the backend).
      if (isLoginPage) return;
      router.replace("/verify-email");
      return;
    }

    router.replace(user?.has_completed_onboarding ? "/dashboard" : "/onboarding");
  }, [isAuthenticated, isLoading, user, router, isVerifyPage, isLoginPage]);

  // Block authenticated users from auth pages while redirecting, except:
  // - verify-email (always accessible to unverified users)
  // - login (accessible to unverified users so they can get a fresh code)
  const isAllowed = isVerifyPage || (isLoginPage && !!user && !user.email_verified);
  if (isAuthenticated && !isAllowed) return <LoadingLogo />;

  return <>{children}</>;
}
