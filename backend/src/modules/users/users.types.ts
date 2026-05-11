import type { Permission, Role, RolePermission, User } from "@prisma/client";

export type UserWithRolePermissions = User & {
  role: Role & {
    permissions: Array<RolePermission & { permission: Permission }>;
  };
};

export type AuditContext = {
  actorUserId?: string;
  ipAddress?: string;
  userAgent?: string;
};
