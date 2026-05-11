import bcrypt from "bcryptjs";
import type { CreateUser, ResetUserPassword, UpdateUser, UpdateUserStatus, User, UsersQuery } from "@pharmacy-pos/shared";
import { UserSchema } from "@pharmacy-pos/shared";
import { HttpError } from "../../common/http/http-error.js";
import { UsersRepository } from "./users.repository.js";
import type { AuditContext, UserWithRolePermissions } from "./users.types.js";

export class UsersService {
  constructor(private readonly usersRepository = new UsersRepository()) {}

  async getCurrentUser(userId: string): Promise<User> {
    const user = await this.usersRepository.findUserById(userId);

    if (!user || user.status !== "active") {
      throw new HttpError(401, "Authentication is required.", "AUTHENTICATION_REQUIRED");
    }

    return toUser(user);
  }

  async listUsers(query: UsersQuery): Promise<User[]> {
    const users = await this.usersRepository.listUsers({
      search: query.search,
      roleId: query.roleId,
      status: query.status
    });

    return users.map(toUser);
  }

  async getUser(id: string): Promise<User> {
    const user = await this.usersRepository.findUserById(id);

    if (!user) {
      throw new HttpError(404, "User was not found.", "USER_NOT_FOUND");
    }

    return toUser(user);
  }

  async createUser(input: CreateUser, context: AuditContext): Promise<User> {
    const email = normalizeEmail(input.email);
    await this.ensureEmailIsAvailable(email);
    await this.ensureRoleExists(input.roleId);

    const passwordHash = await bcrypt.hash(input.password, 12);
    const user = await this.usersRepository.createUser({
      email,
      fullName: input.fullName.trim(),
      roleId: input.roleId,
      passwordHash,
      status: "active"
    });

    await this.usersRepository.createAuditLog(
      "USER_CREATED",
      user.id,
      { email: user.email, roleId: user.roleId, status: user.status },
      context
    );

    return toUser(user);
  }

  async updateUser(id: string, input: UpdateUser, context: AuditContext): Promise<User> {
    const currentUser = await this.usersRepository.findUserById(id);

    if (!currentUser) {
      throw new HttpError(404, "User was not found.", "USER_NOT_FOUND");
    }

    const email = input.email ? normalizeEmail(input.email) : undefined;

    if (email) {
      await this.ensureEmailIsAvailable(email, id);
    }

    if (input.roleId) {
      await this.ensureRoleExists(input.roleId);
      await this.ensureCanChangeRole(currentUser, input.roleId);
    }

    const user = await this.usersRepository.updateUser(id, {
      email,
      fullName: input.fullName?.trim(),
      roleId: input.roleId
    });

    await this.usersRepository.createAuditLog("USER_UPDATED", user.id, buildUserUpdateMetadata(currentUser, user), context);

    if (input.roleId && input.roleId !== currentUser.roleId) {
      await this.usersRepository.createAuditLog(
        "USER_ROLE_CHANGED",
        user.id,
        {
          before: { roleId: currentUser.roleId, roleName: currentUser.role.name },
          after: { roleId: user.roleId, roleName: user.role.name }
        },
        context
      );
    }

    return toUser(user);
  }

  async updateUserStatus(id: string, input: UpdateUserStatus, context: AuditContext): Promise<User> {
    const currentUser = await this.usersRepository.findUserById(id);

    if (!currentUser) {
      throw new HttpError(404, "User was not found.", "USER_NOT_FOUND");
    }

    await this.ensureCanChangeStatus(currentUser, input.status);

    const user = await this.usersRepository.updateUserStatus(id, input.status);

    await this.usersRepository.createAuditLog(
      "USER_STATUS_CHANGED",
      user.id,
      {
        before: { status: currentUser.status },
        after: { status: user.status }
      },
      context
    );

    return toUser(user);
  }

  async resetPassword(id: string, input: ResetUserPassword, context: AuditContext): Promise<void> {
    const user = await this.usersRepository.findUserById(id);

    if (!user) {
      throw new HttpError(404, "User was not found.", "USER_NOT_FOUND");
    }

    const passwordHash = await bcrypt.hash(input.password, 12);
    await this.usersRepository.updatePassword(id, passwordHash);
    await this.usersRepository.createAuditLog("USER_PASSWORD_RESET", id, { email: user.email }, context);
  }

  private async ensureEmailIsAvailable(email: string, exceptId?: string) {
    const existingUser = await this.usersRepository.findUserByEmail(email, exceptId);

    if (existingUser) {
      throw new HttpError(409, "User email is already in use.", "USER_EMAIL_IN_USE");
    }
  }

  private async ensureRoleExists(roleId: string) {
    const role = await this.usersRepository.findRoleById(roleId);

    if (!role) {
      throw new HttpError(400, "Role does not exist.", "ROLE_NOT_FOUND");
    }
  }

  private async ensureCanChangeRole(user: UserWithRolePermissions, nextRoleId: string) {
    if (user.roleId === nextRoleId || user.role.name !== "superadmin" || user.status !== "active") {
      return;
    }

    const nextRole = await this.usersRepository.findRoleById(nextRoleId);

    if (nextRole?.name === "superadmin") {
      return;
    }

    await this.ensureAnotherActiveSuperadminExists(user.id);
  }

  private async ensureCanChangeStatus(user: UserWithRolePermissions, nextStatus: UpdateUserStatus["status"]) {
    if (user.status === nextStatus || user.role.name !== "superadmin" || user.status !== "active" || nextStatus === "active") {
      return;
    }

    await this.ensureAnotherActiveSuperadminExists(user.id);
  }

  private async ensureAnotherActiveSuperadminExists(userId: string) {
    const activeSuperadmins = await this.usersRepository.countActiveSuperadmins(userId);

    if (activeSuperadmins === 0) {
      throw new HttpError(400, "The last active superadmin cannot be disabled.", "LAST_ACTIVE_SUPERADMIN");
    }
  }
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function toUser(user: UserWithRolePermissions): User {
  return UserSchema.parse({
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    roleId: user.roleId,
    role: {
      id: user.role.id,
      name: user.role.name,
      displayName: user.role.displayName
    },
    permissions: user.role.permissions.map((rolePermission) => rolePermission.permission.key),
    status: user.status,
    lastLoginAt: user.lastLoginAt?.toISOString(),
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString()
  });
}

function buildUserUpdateMetadata(before: UserWithRolePermissions, after: UserWithRolePermissions) {
  return {
    before: {
      email: before.email,
      fullName: before.fullName,
      roleId: before.roleId
    },
    after: {
      email: after.email,
      fullName: after.fullName,
      roleId: after.roleId
    }
  };
}
