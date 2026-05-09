import { useEffect, useLayoutEffect, type ReactNode } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { useShallow } from "zustand/react/shallow";
import { AuthGuard, AuthTokenSync } from "@/components/auth";
import { applyThemeByName, selectIsThemeInitialized, selectThemeActions, selectThemeMode, useThemeStore } from "@/clients/theme";
import { AppShell } from "./layouts/app-shell";
import { TooltipProvider } from "./components/ui/tooltip";
import { LoginPage } from "./pages/login";
import { selectAuthUser, useAuthStore } from "./modules/auth";
import { AppRoutes } from "./routes/app-routes";
import { LogoutPage } from "./pages/logout";

export function App() {
  return (
    <ThemeGate>
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
    </ThemeGate>
  );
}

function ThemeGate({ children }: { children: ReactNode }) {
  const isInitialized = useThemeStore(selectIsThemeInitialized);
  const mode = useThemeStore(selectThemeMode);
  const { initializeTheme } = useThemeStore(useShallow(selectThemeActions));

  useLayoutEffect(() => {
    initializeTheme();
  }, [initializeTheme]);

  useEffect(() => {
    if (mode !== "system") {
      return;
    }

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      const { themeName, mode: currentMode } = useThemeStore.getState();
      applyThemeByName(themeName, currentMode);
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [mode]);

  if (!isInitialized) {
    return null;
  }

  return children;
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
