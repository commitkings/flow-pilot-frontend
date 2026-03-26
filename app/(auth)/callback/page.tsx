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

    loginWithToken(token)
      .then(() => {
        router.replace("/dashboard/runs");
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
