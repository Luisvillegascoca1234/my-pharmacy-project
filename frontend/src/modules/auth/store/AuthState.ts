import type { AuthenticatedUser } from "@pharmacy-pos/shared";

export type AuthStatus = "authenticated" | "idle" | "loading" | "unauthenticated";
export type AuthErrorCode = "inactive_account" | "invalid_credentials" | "login_failed" | "session_restore_failed";

export type AuthState = {
  errorCode: AuthErrorCode | null;
  status: AuthStatus;
  token: string | null;
  user: AuthenticatedUser | null;
};

export const initialAuthState: AuthState = {
  errorCode: null,
  status: "idle",
  token: null,
  user: null
};
