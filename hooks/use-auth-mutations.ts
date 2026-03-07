"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/context/auth-context";
import { ApiError } from "@/lib/api-types";

export function useLogin() {
  const { loginWithCredentials } = useAuth();
  const router = useRouter();

  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      loginWithCredentials(email, password),
    onSuccess: () => {
      router.push("/dashboard");
    },
    onError: (err) => {
      const message = err instanceof ApiError ? err.message : "Invalid email or password";
      toast.error(message);
    },
  });
}

export function useRegister() {
  const { registerUser } = useAuth();

  return useMutation({
    mutationFn: ({ name, email, password }: { name: string; email: string; password: string }) =>
      registerUser(name, email, password),
    onError: (err) => {
      const message = err instanceof ApiError ? err.message : "Registration failed. Please try again.";
      toast.error(message);
    },
  });
}
