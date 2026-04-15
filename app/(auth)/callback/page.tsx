"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { Suspense } from "react";
import { LoadingLogo } from "@/components/brand/LoadingLogo";

function CallbackHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { loginWithToken } = useAuth();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

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
