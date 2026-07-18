import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { ApiError } from "@/api";
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
          set({ errorCode: null, status: "loading" }, false, "login:start");

          try {
            const session = await authFacade.login(credentials);

            set(
              {
                errorCode: null,
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
                errorCode: getAuthErrorCode(error),
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

          set({ errorCode: null, status: "loading" }, false, "logout:start");

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
            set({ errorCode: null, status: "unauthenticated", user: null }, false, "restoreSession:noToken");
            return;
          }

          set({ errorCode: null, status: "loading" }, false, "restoreSession:start");

          try {
            const user = await authFacade.getCurrentUser();

            set(
              {
                errorCode: null,
                status: "authenticated",
                user
              },
              false,
              "restoreSession:success"
            );
          } catch {
            set(
              {
                errorCode: "session_restore_failed",
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

function getAuthErrorCode(error: unknown): "inactive_account" | "invalid_credentials" | "login_failed" {
  if (ApiError.isApiError(error)) {
    if (error.code === "INVALID_CREDENTIALS") {
      return "invalid_credentials";
    }

    if (error.code === "USER_INACTIVE") {
      return "inactive_account";
    }
  }

  return "login_failed";
}
