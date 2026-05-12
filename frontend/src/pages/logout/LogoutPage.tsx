import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Spinner } from "@/components/ui/spinner";
import { AUTH_STORAGE_KEY, useAuthStore } from "@/modules/auth/store/AuthStore";
import { resetSessionScopedState } from "@/modules/auth/utils/resetSessionScopedState";

export function LogoutPage() {
  const navigate = useNavigate();
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) {
      return;
    }

    hasRun.current = true;

    void (async () => {
      try {
        resetSessionScopedState();
        await useAuthStore.getState().logout();
      } finally {
        localStorage.removeItem(AUTH_STORAGE_KEY);
        navigate("/login", { replace: true });
      }
    })();
  }, [navigate]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 bg-background">
      <Spinner className="size-8" />
      <p className="text-sm text-muted-foreground">Cerrando sesión...</p>
    </main>
  );
}
