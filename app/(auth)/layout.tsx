"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading || !isAuthenticated) return;
    if (user?.has_completed_onboarding) {
      router.replace("/dashboard");
    } else {
      router.replace("/onboarding");
    }
  }, [isAuthenticated, isLoading, user, router]);

  if (isLoading || isAuthenticated) return null;

  return <>{children}</>;
}
