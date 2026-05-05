import type { AuthenticatedUser } from "@pharmacy-pos/shared";

export type AuthTokenPayload = {
  sub: string;
  email: string;
};

export type AuthenticatedRequestUser = AuthenticatedUser;

export type AuditLoginContext = {
  ipAddress?: string;
  userAgent?: string;
};
