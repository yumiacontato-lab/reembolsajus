import { useEffect } from "react";
import { useAuth, useUser } from "@clerk/clerk-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

export function useUserSync() {
  const { isSignedIn } = useAuth();
  const { user } = useUser();

  const syncMutation = useMutation({
    mutationFn: async (data: { email: string; name: string | null }) => {
      const res = await apiRequest("POST", "/api/user/sync", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/me"] });
    },
  });

  useEffect(() => {
    if (isSignedIn && user && !syncMutation.isPending && !syncMutation.isSuccess) {
      const email = user.emailAddresses[0]?.emailAddress;
      const name = user.fullName || user.firstName || null;

      if (email) {
        syncMutation.mutate({ email, name });
      }
    }
  }, [isSignedIn, user, syncMutation]);

  return {
    isSyncing: syncMutation.isPending,
    isSynced: syncMutation.isSuccess,
    syncError: syncMutation.error,
  };
}

export function useCurrentUser() {
  const { isSignedIn } = useAuth();

  return useQuery({
    queryKey: ["/api/user/me"],
    enabled: isSignedIn,
  });
}

export function useUploadEligibility() {
  const { isSignedIn } = useAuth();

  return useQuery<{
    canUpload: boolean;
    reason: string;
    remainingUploads: number;
    freeUploadsUsed: number;
    freeUploadsLimit: number;
    hasActiveSubscription: boolean;
    uploadsThisMonth: number;
    monthlyLimit: number;
  }>({
    queryKey: ["/api/user/upload-eligibility"],
    enabled: isSignedIn,
  });
}
