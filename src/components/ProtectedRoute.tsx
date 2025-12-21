import { useAuth } from "@clerk/clerk-react";
import { Navigate } from "react-router-dom";
import { useUserSync } from "@/hooks/useUserSync";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isLoaded, isSignedIn } = useAuth();
  const { isSyncing } = useUserSync();

  if (!isLoaded || isSyncing) {
    return (
      <div className="min-h-screen flex items-center justify-center" data-testid="loading-screen">
        <div className="h-8 w-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!isSignedIn) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
