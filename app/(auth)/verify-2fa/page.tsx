"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BlobAside } from "@/components/auth/BlobAside";
import { MfaVerifyStep } from "@/components/auth/MfaVerifyStep";
import { useAuth } from "@/context/auth-context";
import { Loader2 } from "lucide-react";

function Verify2FAContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { loginWithToken } = useAuth();

  const mfaToken = searchParams.get("mfa_token");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!mfaToken) {
      router.replace("/login");
    }
  }, [mfaToken, router]);

  const handleSuccess = async (token: string) => {
    setSuccess(true);
    await loginWithToken(token);
    setTimeout(() => router.push("/dashboard"), 900);
  };

  if (!mfaToken) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <main className="h-screen md:grid md:grid-cols-[40%_60%]">
      <BlobAside
        focused={false}
        passwordFocused={false}
        showPassword={false}
        invalid={false}
        success={success}
      />

      <section className="flex items-center overflow-y-auto px-4 py-8 md:px-10">
        <MfaVerifyStep
          mfaToken={mfaToken}
          onSuccess={handleSuccess}
          onBack={() => router.push("/login")}
        />
      </section>
    </main>
  );
}

export default function Verify2FAPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <Verify2FAContent />
    </Suspense>
  );
}
