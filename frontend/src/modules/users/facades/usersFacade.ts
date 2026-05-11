import type { CreateUser, ResetUserPassword, UpdateUser, UpdateUserStatus, User, UserRole, UsersQuery } from "@pharmacy-pos/shared";
import { usersApi } from "../api/users-api";

export const usersFacade = {
  getCurrent(signal?: AbortSignal): Promise<User> {
    return usersApi.getCurrent(signal);
  },

  getAll(query: UsersQuery, signal?: AbortSignal): Promise<User[]> {
    return usersApi.listUsers(query, signal);
  },

  getRoles(signal?: AbortSignal): Promise<UserRole[]> {
    return usersApi.listRoles(signal);
  },

  create(input: CreateUser): Promise<User> {
    return usersApi.createUser(input);
  },

  update(userId: string, input: UpdateUser): Promise<User> {
    return usersApi.updateUser(userId, input);
  },

  updateStatus(userId: string, input: UpdateUserStatus): Promise<User> {
    return usersApi.updateUserStatus(userId, input);
  },

  resetPassword(userId: string, input: ResetUserPassword): Promise<void> {
    return usersApi.resetUserPassword(userId, input);
  }
};
