import { useEffect } from "react";
import { AppShell } from "./layouts/app-shell";
import { TooltipProvider } from "./components/ui/tooltip";
import { LoginPage, useAuthStore } from "./modules/auth";
import { HomePage } from "./pages/home-page";
import { Spinner } from "./components/ui/spinner";

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
      {status === "loading" || status === "idle" ? (
        <main className="flex min-h-screen items-center justify-center bg-background">
          <Spinner />
        </main>
      ) : user ? (
        <AppShell user={user} onLogout={() => void logout()}>
          <HomePage />
        </AppShell>
      ) : (
        <LoginPage />
      )}
    </TooltipProvider>
  );
}
