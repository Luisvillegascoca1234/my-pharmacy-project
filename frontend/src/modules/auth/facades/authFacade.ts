import {
  AuthenticatedUserSchema,
  AuthSessionSchema,
  FIXED_ROLE_CATALOG,
  type AuthenticatedUser,
  type AuthSession,
  type LoginRequest
} from "@pharmacy-pos/shared";
import { authApi } from "../api/auth-api";

export const authFacade = {
  async getCurrentUser(signal?: AbortSignal): Promise<AuthenticatedUser> {
    return normalizeAuthenticatedUser(AuthenticatedUserSchema.parse(await authApi.getCurrentUser(signal)));
  },

  async login(credentials: LoginRequest): Promise<AuthSession> {
    const session = AuthSessionSchema.parse(await authApi.login(credentials));

    return {
      ...session,
      user: normalizeAuthenticatedUser(session.user)
    };
  },

  logout(): Promise<void> {
    return authApi.logout();
  }
};

function normalizeAuthenticatedUser(user: AuthenticatedUser): AuthenticatedUser {
  const institutionalRole = FIXED_ROLE_CATALOG.find((role) => role.name === user.role.name);

  if (!institutionalRole) {
    throw new Error(`Unknown institutional role: ${user.role.name}`);
  }

  return {
    ...user,
    role: {
      ...user.role,
      displayName: institutionalRole.displayName
    }
  };
}
