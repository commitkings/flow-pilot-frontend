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

  useEffect(() => {
    if (isLoading || !isAuthenticated) return;

    // Authenticated and on the verify-email page — let the page handle itself
    if (isVerifyPage) return;

    // Email not yet verified — send to verification screen
    if (user && !user.email_verified) {
      router.replace("/verify-email");
      return;
    }

    router.replace(user?.has_completed_onboarding ? "/dashboard" : "/onboarding");
  }, [isAuthenticated, isLoading, user, router, isVerifyPage]);

  // Block authenticated users from auth pages, but allow them on verify-email
  if (isAuthenticated && !isVerifyPage) return <LoadingLogo />;

  return <>{children}</>;
}
