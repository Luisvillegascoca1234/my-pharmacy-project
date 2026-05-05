import {
  AuthenticatedUserSchema,
  AuthSessionSchema,
  type AuthenticatedUser,
  type AuthSession,
  type LoginRequest
} from "@pharmacy-pos/shared";
import { apiRequest } from "@/api/client";

export async function login(credentials: LoginRequest): Promise<AuthSession> {
  const payload = await apiRequest<AuthSession>("/auth/login", {
    method: "POST",
    body: credentials
  });

  return AuthSessionSchema.parse(payload);
}

export async function getCurrentUser(token: string, signal?: AbortSignal): Promise<AuthenticatedUser> {
  const payload = await apiRequest<AuthenticatedUser>("/auth/me", {
    token,
    signal
  });

  return AuthenticatedUserSchema.parse(payload);
}

export async function logout(token: string): Promise<void> {
  await apiRequest<void>("/auth/logout", {
    method: "POST",
    token
  });
}
