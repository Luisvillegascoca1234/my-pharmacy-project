import {
  AuthenticatedUserSchema,
  type AuthenticatedUser,
  type RoleName,
  type UserStatus
} from "@pharmacy-pos/shared";
import { prisma } from "../../infrastructure/prisma/prisma.client.js";

type AuthIdentityRecord = {
  id: string;
  email: string;
  fullName: string;
  status: UserStatus;
  role: {
    id: string;
    name: RoleName;
    displayName: string;
  };
};

export class AuthRepository {
  findUserByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
      include: { role: true }
    });
  }

  findActiveUserById(id: string) {
    return prisma.user.findFirst({
      where: {
        id,
        status: "active"
      },
      include: { role: true }
    });
  }

  updateLastLoginAt(userId: string) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        lastLoginAt: new Date()
      }
    });
  }

  createAuthAuditLog(input: {
    action: "AUTH_LOGIN_SUCCESS" | "AUTH_LOGIN_FAILURE" | "AUTH_LOGOUT";
    actorUserId?: string;
    email?: string;
    reason?: string;
    ipAddress?: string;
    userAgent?: string;
  }) {
    return prisma.auditLog.create({
      data: {
        action: input.action,
        actorUserId: input.actorUserId,
        entityType: "auth",
        entityId: input.actorUserId ?? input.email,
        metadata: {
          email: input.email,
          reason: input.reason
        },
        ipAddress: input.ipAddress,
        userAgent: input.userAgent
      }
    });
  }
}

export function toAuthenticatedUser(user: AuthIdentityRecord): AuthenticatedUser {
  return AuthenticatedUserSchema.parse({
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    status: user.status,
    role: {
      id: user.role.id,
      name: user.role.name,
      displayName: user.role.displayName
    }
  });
}
