import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { authFacade } from "../facades/authFacade";
import type { AuthActions } from "./AuthActions";
import { initialAuthState, type AuthState } from "./AuthState";

export type AuthStore = AuthState & AuthActions;

export const AUTH_STORAGE_KEY = "pharmacy-pos-auth";

export const useAuthStore = create<AuthStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialAuthState,

        async login(credentials) {
          set({ error: null, status: "loading" }, false, "login:start");

          try {
            const session = await authFacade.login(credentials);

            set(
              {
                error: null,
                status: "authenticated",
                token: session.token,
                user: session.user
              },
              false,
              "login:success"
            );
          } catch (error) {
            set(
              {
                error: error instanceof Error ? getAuthErrorMessage(error.message) : "No se pudo iniciar sesión.",
                status: "unauthenticated",
                token: null,
                user: null
              },
              false,
              "login:error"
            );
          }
        },

        async logout() {
          const { token } = get();

          set({ error: null, status: "loading" }, false, "logout:start");

          try {
            if (token) {
              await authFacade.logout();
            }
          } catch {
            // Logout is best-effort; local state must always be cleared.
          } finally {
            get().reset();
          }
        },

        reset() {
          set(
            {
              ...initialAuthState,
              status: "unauthenticated"
            },
            false,
            "reset"
          );
        },

        async restoreSession() {
          const { token } = get();

          if (!token) {
            set({ error: null, status: "unauthenticated", user: null }, false, "restoreSession:noToken");
            return;
          }

          set({ error: null, status: "loading" }, false, "restoreSession:start");

          try {
            const user = await authFacade.getCurrentUser();

            set(
              {
                error: null,
                status: "authenticated",
                user
              },
              false,
              "restoreSession:success"
            );
          } catch {
            set(
              {
                error: null,
                status: "unauthenticated",
                token: null,
                user: null
              },
              false,
              "restoreSession:error"
            );
          }
        }
      }),
      {
        name: AUTH_STORAGE_KEY,
        partialize: (state) => ({
          token: state.token
        })
      }
    ),
    { name: "AuthStore" }
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
