"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

function AuthForm({ onEmailSubmit }: { onEmailSubmit: () => void }) {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleGoogle = () => {
    login();
  };

  return (
    <div className="space-y-3">
      <Input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="rounded-xl"
      />
      <Input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="rounded-xl"
      />
      <Button
        className="w-full rounded-xl"
        onClick={onEmailSubmit}
      >
        Continue with Email
      </Button>
      <Button
        variant="outline"
        className="w-full rounded-xl"
        onClick={handleGoogle}
      >
        Continue with Google
      </Button>
    </div>
  );
}

export default function AuthPage() {
  const router = useRouter();

  const handleEmailSubmit = () => {
    router.push("/verify-email");
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md rounded-xl border border-border shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-semibold text-center text-foreground">
            Welcome to FlowPilot
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin">
            <TabsList className="w-full mb-6 rounded-xl">
              <TabsTrigger value="signin" className="flex-1 rounded-lg">
                Sign In
              </TabsTrigger>
              <TabsTrigger value="login" className="flex-1 rounded-lg">
                Log In
              </TabsTrigger>
            </TabsList>
            <TabsContent value="signin">
              <AuthForm onEmailSubmit={handleEmailSubmit} />
            </TabsContent>
            <TabsContent value="login">
              <AuthForm onEmailSubmit={handleEmailSubmit} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </main>
  );
}
