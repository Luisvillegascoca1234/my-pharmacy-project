import { useEffect, type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Spinner } from "@/components/ui/spinner";
import { selectAuthStatus, selectAuthUser } from "@/modules/auth";
import { useAuthStore } from "@/modules/auth";

type AuthGuardProps = {
  children: ReactNode;
};

export function AuthGuard({ children }: AuthGuardProps) {
  const location = useLocation();
  const status = useAuthStore(selectAuthStatus);
  const user = useAuthStore(selectAuthUser);
  const restoreSession = useAuthStore((state) => state.restoreSession);

  useEffect(() => {
    if (status === "idle") {
      void restoreSession();
    }
  }, [restoreSession, status]);

  if (status === "idle" || status === "loading") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background">
        <Spinner />
      </main>
    );
  }

  if (!user) {
    return <Navigate replace state={{ from: location }} to="/login" />;
  }

  return <>{children}</>;
}
