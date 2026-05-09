import type { AuthenticatedUser, AuthSession, LoginRequest } from "@pharmacy-pos/shared";
import { authApi } from "../api/auth-api";

export const authFacade = {
  getCurrentUser(signal?: AbortSignal): Promise<AuthenticatedUser> {
    return authApi.getCurrentUser(signal);
  },

  login(credentials: LoginRequest): Promise<AuthSession> {
    return authApi.login(credentials);
  },

  logout(): Promise<void> {
    return authApi.logout();
  }
};
