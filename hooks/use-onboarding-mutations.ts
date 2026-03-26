"use client";

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { completeOnboarding } from "@/lib/api-client";
import { ApiError, type OnboardingPayload } from "@/lib/api-types";

export function useCompleteOnboarding(
  onSuccess: () => void,
  onAlreadyOnboarded: () => void,
) {
  return useMutation({
    mutationFn: (payload: OnboardingPayload) => completeOnboarding(payload),
    onSuccess,
    onError: (err) => {
      if (err instanceof ApiError && err.status === 409) {
        onAlreadyOnboarded();
        return;
      }
      const message = err instanceof ApiError ? err.message : "Something went wrong. Please try again.";
      toast.error(message);
    },
  });
}
