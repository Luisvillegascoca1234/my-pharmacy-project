import type { LoginRequest } from "@pharmacy-pos/shared";

export type AuthActions = {
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  reset: () => void;
  restoreSession: () => Promise<void>;
};
