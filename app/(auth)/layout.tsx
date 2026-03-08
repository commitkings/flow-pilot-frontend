"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading || !isAuthenticated) return;
    router.replace(user?.has_completed_onboarding ? "/dashboard" : "/onboarding");
  }, [isAuthenticated, isLoading, user, router]);

  if (isAuthenticated) return null;

  return <>{children}</>;
}
