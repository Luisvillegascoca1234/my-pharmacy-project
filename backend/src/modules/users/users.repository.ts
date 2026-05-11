import type { Prisma, UserStatus } from "@prisma/client";
import { prisma } from "../../infrastructure/prisma/prisma.client.js";
import type { AuditContext, UserWithRolePermissions } from "./users.types.js";

const userInclude = {
  role: {
    include: {
      permissions: {
        include: {
          permission: true
        }
      }
    }
  }
} satisfies Prisma.UserInclude;

export class UsersRepository {
  listUsers(filters: { search?: string; roleId?: string; status?: UserStatus }): Promise<UserWithRolePermissions[]> {
    const normalizedSearch = filters.search?.trim();

    return prisma.user.findMany({
      where: {
        roleId: filters.roleId,
        status: filters.status,
        OR: normalizedSearch
          ? [
              { email: { contains: normalizedSearch, mode: "insensitive" } },
              { fullName: { contains: normalizedSearch, mode: "insensitive" } },
              { role: { is: { displayName: { contains: normalizedSearch, mode: "insensitive" } } } },
              { role: { is: { name: { contains: normalizedSearch, mode: "insensitive" } } } }
            ]
          : undefined
      },
      include: userInclude,
      orderBy: {
        fullName: "asc"
      }
    });
  }

  findUserById(id: string): Promise<UserWithRolePermissions | null> {
    return prisma.user.findUnique({
      where: { id },
      include: userInclude
    });
  }

  findUserByEmail(email: string, exceptId?: string) {
    return prisma.user.findFirst({
      where: {
        email: {
          equals: email,
          mode: "insensitive"
        },
        id: exceptId ? { not: exceptId } : undefined
      }
    });
  }

  findRoleById(id: string) {
    return prisma.role.findUnique({
      where: { id }
    });
  }

  findRoleByName(name: string) {
    return prisma.role.findUnique({
      where: { name }
    });
  }

  countActiveSuperadmins(exceptUserId?: string) {
    return prisma.user.count({
      where: {
        id: exceptUserId ? { not: exceptUserId } : undefined,
        status: "active",
        role: {
          is: {
            name: "superadmin"
          }
        }
      }
    });
  }

  createUser(input: Prisma.UserUncheckedCreateInput): Promise<UserWithRolePermissions> {
    return prisma.user.create({
      data: input,
      include: userInclude
    });
  }

  updateUser(id: string, input: Prisma.UserUncheckedUpdateInput): Promise<UserWithRolePermissions> {
    return prisma.user.update({
      where: { id },
      data: input,
      include: userInclude
    });
  }

  updateUserStatus(id: string, status: UserStatus): Promise<UserWithRolePermissions> {
    return prisma.user.update({
      where: { id },
      data: { status },
      include: userInclude
    });
  }

  updatePassword(id: string, passwordHash: string) {
    return prisma.user.update({
      where: { id },
      data: { passwordHash }
    });
  }

  createAuditLog(action: string, entityId: string, metadata: unknown, context: AuditContext) {
    return prisma.auditLog.create({
      data: {
        action,
        actorUserId: context.actorUserId,
        entityType: "user",
        entityId,
        metadata: metadata as Prisma.InputJsonValue,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent
      }
    });
  }
}
