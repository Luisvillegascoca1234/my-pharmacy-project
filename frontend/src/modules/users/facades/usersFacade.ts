import {
  FIXED_ROLE_CATALOG,
  RolesCatalogResponseSchema,
  UserSchema,
  type CreateUser,
  type ResetUserPassword,
  type UpdateUser,
  type UpdateUserStatus,
  type User,
  type UserRole,
  type UsersQuery
} from "@pharmacy-pos/shared";
import { z } from "zod";
import { usersApi } from "../api/users-api";

const UsersResponseSchema = z.array(UserSchema);

export const usersFacade = {
  async getCurrent(signal?: AbortSignal): Promise<User> {
    return normalizeUser(UserSchema.parse(await usersApi.getCurrent(signal)));
  },

  async getAll(query: UsersQuery, signal?: AbortSignal): Promise<User[]> {
    return UsersResponseSchema.parse(await usersApi.listUsers(query, signal)).map(normalizeUser);
  },

  async getRoles(signal?: AbortSignal): Promise<UserRole[]> {
    return RolesCatalogResponseSchema.parse(await usersApi.listRoles(signal)).map(({ id, name }) => ({
      displayName: getInstitutionalRoleDisplayName(name),
      id,
      name
    }));
  },

  async create(input: CreateUser): Promise<User> {
    return normalizeUser(UserSchema.parse(await usersApi.createUser(input)));
  },

  async update(userId: string, input: UpdateUser): Promise<User> {
    return normalizeUser(UserSchema.parse(await usersApi.updateUser(userId, input)));
  },

  async updateStatus(userId: string, input: UpdateUserStatus): Promise<User> {
    return normalizeUser(UserSchema.parse(await usersApi.updateUserStatus(userId, input)));
  },

  resetPassword(userId: string, input: ResetUserPassword): Promise<void> {
    return usersApi.resetUserPassword(userId, input);
  }
};

function normalizeUser(user: User): User {
  return {
    ...user,
    role: {
      ...user.role,
      displayName: getInstitutionalRoleDisplayName(user.role.name)
    }
  };
}

function getInstitutionalRoleDisplayName(roleName: UserRole["name"]): string {
  const institutionalRole = FIXED_ROLE_CATALOG.find((role) => role.name === roleName);

  if (!institutionalRole) {
    throw new Error(`Unknown institutional role: ${roleName}`);
  }

  return institutionalRole.displayName;
}
