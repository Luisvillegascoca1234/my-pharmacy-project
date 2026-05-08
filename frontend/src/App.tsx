import { useEffect } from "react";
import { BrowserRouter } from "react-router-dom";
import { AppShell } from "./layouts/app-shell";
import { TooltipProvider } from "./components/ui/tooltip";
import { LoginPage, useAuthStore } from "./modules/auth";
import { Spinner } from "./components/ui/spinner";
import { AppRoutes } from "./routes/app-routes";

export function App() {
  const user = useAuthStore((state) => state.user);
  const status = useAuthStore((state) => state.status);
  const logout = useAuthStore((state) => state.logout);
  const restoreSession = useAuthStore((state) => state.restoreSession);

  useEffect(() => {
    void restoreSession();
  }, [restoreSession]);

  return (
    <TooltipProvider>
      <BrowserRouter>
        {status === "loading" || status === "idle" ? (
          <main className="flex min-h-screen items-center justify-center bg-background">
            <Spinner />
          </main>
        ) : user ? (
          <AppShell user={user} onLogout={() => void logout()}>
            <AppRoutes user={user} />
          </AppShell>
        ) : (
          <LoginPage />
        )}
      </BrowserRouter>
    </TooltipProvider>
  );
}
