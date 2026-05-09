import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AuthGuard, AuthTokenSync } from "@/components/auth";
import { AppShell } from "./layouts/app-shell";
import { TooltipProvider } from "./components/ui/tooltip";
import { LoginPage } from "./pages/login";
import { selectAuthUser, useAuthStore } from "./modules/auth";
import { AppRoutes } from "./routes/app-routes";
import { LogoutPage } from "./pages/logout";

export function App() {
  return (
    <TooltipProvider>
      <BrowserRouter>
        <AuthTokenSync />
        <Routes>
          <Route element={<LoginPage />} path="/login" />
          <Route element={<LogoutPage />} path="/logout" />
          <Route
            element={
              <AuthGuard>
                <AuthenticatedApp />
              </AuthGuard>
            }
            path="/*"
          />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  );
}

function AuthenticatedApp() {
  const user = useAuthStore(selectAuthUser);

  if (!user) {
    return null;
  }

  return (
    <AppShell user={user}>
      <AppRoutes user={user} />
    </AppShell>
  );
}
