import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getKycStatus,
  submitKyc,
  submitIndividualKycLevel1,
  submitIndividualKycLevel2,
  submitIndividualKycLevel3,
  uploadOrgLogo,
} from "@/lib/api-client";
import { toast } from "sonner";

export function useKycStatus() {
  return useQuery({
    queryKey: ["kyc-status"],
    queryFn: getKycStatus,
    staleTime: 10_000,
    // Poll every 15s while pending so the banner auto-dismisses
    // when the 60s background verification completes
    refetchInterval: (query) => {
      const status = query.state.data?.kyc_status;
      return status === "pending" ? 15_000 : false;
    },
  });
}

export function useSubmitKyc() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: submitKyc,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["kyc-status"] });
      qc.invalidateQueries({ queryKey: ["org-profile"] });  // matches use-settings-queries.ts
      toast.success("KYC documents submitted successfully.");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail ?? "Failed to submit KYC documents.");
    },
  });
}

export function useSubmitIndividualKycLevel1() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: submitIndividualKycLevel1,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["kyc-status"] });
      toast.success("Identity submitted. Verification in progress.");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail ?? "Failed to submit identity.");
    },
  });
}

export function useSubmitIndividualKycLevel2() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: submitIndividualKycLevel2,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["kyc-status"] });
      toast.success("Address submitted. Verification in progress.");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail ?? "Failed to submit address.");
    },
  });
}

export function useSubmitIndividualKycLevel3() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: submitIndividualKycLevel3,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["kyc-status"] });
      toast.success("Government ID submitted. Verification in progress.");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail ?? "Failed to submit government ID.");
    },
  });
}

export function useUploadOrgLogo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: uploadOrgLogo,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["org-profile"] });
      toast.success("Company logo updated.");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail ?? "Failed to upload logo.");
    },
  });
}
