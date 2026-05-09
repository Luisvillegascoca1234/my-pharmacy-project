import type { AuthActions } from "./AuthActions";
import type { AuthState } from "./AuthState";

export type AuthStore = AuthState & AuthActions;

export const selectAuthActions = (state: AuthStore) => ({
  login: state.login,
  logout: state.logout,
  reset: state.reset,
  restoreSession: state.restoreSession
});

export const selectAuthError = (state: AuthStore) => state.error;
export const selectAuthStatus = (state: AuthStore) => state.status;
export const selectAuthToken = (state: AuthStore) => state.token;
export const selectAuthUser = (state: AuthStore) => state.user;
