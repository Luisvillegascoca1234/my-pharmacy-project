import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Spinner } from "@/components/ui/spinner";
import { useAuthStore } from "@/modules/auth/store/AuthStore";
import { resetAllStores } from "./resetAllStores";

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
        await useAuthStore.getState().logout();
      } finally {
        resetAllStores();
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
