import type { AuthenticatedUser, LoginRequest } from "@pharmacy-pos/shared";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getCurrentUser, login as requestLogin, logout as requestLogout } from "../api/auth-api";

type AuthStatus = "idle" | "loading" | "authenticated" | "unauthenticated";

type AuthState = {
  token: string | null;
  user: AuthenticatedUser | null;
  status: AuthStatus;
  error: string | null;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      status: "idle",
      error: null,
      async login(credentials) {
        set({ status: "loading", error: null });

        try {
          const session = await requestLogin(credentials);

          set({
            token: session.token,
            user: session.user,
            status: "authenticated",
            error: null
          });
        } catch (error) {
          set({
            token: null,
            user: null,
            status: "unauthenticated",
            error: error instanceof Error ? getAuthErrorMessage(error.message) : "No se pudo iniciar sesión."
          });
        }
      },
      async logout() {
        const { token } = get();

        set({ status: "loading", error: null });

        try {
          if (token) {
            await requestLogout(token);
          }
        } finally {
          set({
            token: null,
            user: null,
            status: "unauthenticated",
            error: null
          });
        }
      },
      async restoreSession() {
        const { token } = get();

        if (!token) {
          set({ user: null, status: "unauthenticated", error: null });
          return;
        }

        set({ status: "loading", error: null });

        try {
          const user = await getCurrentUser(token);

          set({
            user,
            status: "authenticated",
            error: null
          });
        } catch {
          set({
            token: null,
            user: null,
            status: "unauthenticated",
            error: null
          });
        }
      }
    }),
    {
      name: "pharmacy-pos-auth",
      partialize: (state) => ({
        token: state.token
      })
    }
  )
);

function getAuthErrorMessage(message: string) {
  const normalizedMessage = message.trim().toLowerCase();

  if (normalizedMessage.includes("invalid email or password")) {
    return "Correo electrónico o contraseña incorrectos.";
  }

  if (normalizedMessage.includes("inactive")) {
    return "La cuenta de usuario está inactiva.";
  }

  return "No se pudo iniciar sesión.";
}
