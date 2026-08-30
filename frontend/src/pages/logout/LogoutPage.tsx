import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, ArrowLeft, LogOut, WalletCards } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { useCashSession } from "@/modules/cash";
import { AUTH_STORAGE_KEY, useAuthStore } from "@/modules/auth/store/AuthStore";
import { resetSessionScopedState } from "@/modules/auth/utils/resetSessionScopedState";

export function LogoutPage() {
  const navigate = useNavigate();
  const hasRun = useRef(false);
  const [forceLogout, setForceLogout] = useState(false);
  const cash = useCashSession();
  const isCheckingCash = cash.currentStatus === "idle" || cash.currentStatus === "loading";
  const requiresCashClosure = cash.currentStatus === "success" && cash.current.isOpen;
  const couldNotVerifyCash = cash.currentStatus === "error";

  useEffect(() => {
    if (hasRun.current || isCheckingCash || requiresCashClosure || (couldNotVerifyCash && !forceLogout)) {
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
  }, [couldNotVerifyCash, forceLogout, isCheckingCash, navigate, requiresCashClosure]);

  if (requiresCashClosure) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-10">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <span className="mb-2 flex size-11 items-center justify-center rounded-xl bg-warning/15 text-warning-foreground">
              <WalletCards aria-hidden="true" />
            </span>
            <CardTitle>Tu caja sigue abierta</CardTitle>
            <CardDescription>
              Cierra y cuadra tu caja antes de terminar la sesión.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button onClick={() => navigate("/cash", { replace: true })}>
              <WalletCards aria-hidden="true" />
              Ir a cerrar caja
            </Button>
            <Button variant="outline" onClick={() => navigate(-1)}>
              <ArrowLeft aria-hidden="true" />
              Volver
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  if (couldNotVerifyCash && !forceLogout) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4 py-10">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle>No se pudo verificar tu caja</CardTitle>
            <CardDescription>La conexión no permitió confirmar si el turno está cerrado.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Alert variant="destructive">
              <AlertTriangle aria-hidden="true" />
              <AlertTitle>Revisa antes de salir</AlertTitle>
              <AlertDescription>Si estabas vendiendo, vuelve a Caja y confirma su estado antes de cerrar sesión.</AlertDescription>
            </Alert>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => navigate("/cash", { replace: true })}>Revisar caja</Button>
              <Button variant="destructive" onClick={() => setForceLogout(true)}>
                <LogOut aria-hidden="true" />
                Cerrar sesión de todos modos
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background">
      <span className="flex size-14 items-center justify-center rounded-2xl border bg-card shadow-sm"><Spinner className="size-6 text-primary" /></span>
      <div className="text-center"><p className="text-sm font-semibold text-foreground">Cerrando sesión…</p></div>
    </main>
  );
}
