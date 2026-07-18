import { Prisma, type UserStatus } from "@prisma/client";
import { prisma } from "../../infrastructure/prisma/prisma.client.js";
import type {
  AuditContext,
  CreateUserRecord,
  UpdateUserRecord,
  UsersRepositoryPort,
  UserWithRole
} from "./users.types.js";

const userInclude = Prisma.validator<Prisma.UserInclude>()({
  role: true
});

export class UsersRepository implements UsersRepositoryPort {
  listUsers(filters: { search?: string; roleId?: string; status?: UserStatus }): Promise<UserWithRole[]> {
    const normalizedSearch = filters.search?.trim();

    return prisma.user.findMany({
      where: {
        roleId: filters.roleId,
        status: filters.status,
        OR: normalizedSearch
          ? [
              { email: { contains: normalizedSearch, mode: "insensitive" } },
              { fullName: { contains: normalizedSearch, mode: "insensitive" } },
              { role: { is: { displayName: { contains: normalizedSearch, mode: "insensitive" } } } }
            ]
          : undefined
      },
      include: userInclude,
      orderBy: {
        fullName: "asc"
      }
    });
  }

  findUserById(id: string): Promise<UserWithRole | null> {
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

  createUser(input: CreateUserRecord): Promise<UserWithRole> {
    return prisma.user.create({
      data: input,
      include: userInclude
    });
  }

  updateUser(id: string, input: UpdateUserRecord): Promise<UserWithRole> {
    return prisma.user.update({
      where: { id },
      data: input,
      include: userInclude
    });
  }

  updateUserStatus(id: string, status: UserStatus): Promise<UserWithRole> {
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
