"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function VerifyEmailPage() {
  const [code, setCode] = useState("");
  const { login } = useAuth();
  const router = useRouter();

  const handleVerify = () => {
    login();
    router.push("/dashboard");
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm rounded-xl border border-border shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-semibold text-foreground">
            Verify your email
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Enter the 6-digit code sent to your email.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            type="text"
            placeholder="000000"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            className="rounded-xl text-center text-xl tracking-widest"
          />
          <Button
            className="w-full rounded-xl"
            onClick={handleVerify}
            disabled={code.length !== 6}
          >
            Verify
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
