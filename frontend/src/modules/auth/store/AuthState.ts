import type { AuthenticatedUser } from "@pharmacy-pos/shared";

export type AuthStatus = "authenticated" | "idle" | "loading" | "unauthenticated";

export type AuthState = {
  error: string | null;
  status: AuthStatus;
  token: string | null;
  user: AuthenticatedUser | null;
};

export const initialAuthState: AuthState = {
  error: null,
  status: "idle",
  token: null,
  user: null
};
