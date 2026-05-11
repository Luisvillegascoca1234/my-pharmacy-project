import type { CreateUser, ResetUserPassword, UpdateUser, UpdateUserStatus, User, UserRole, UsersQuery } from "@pharmacy-pos/shared";
import { axiosApi } from "@/api";

export const usersApi = {
  async getCurrent(signal?: AbortSignal): Promise<User> {
    const response = await axiosApi.get<User>("/users/me", { signal });

    return response.data;
  },

  async listUsers(query: UsersQuery, signal?: AbortSignal): Promise<User[]> {
    const response = await axiosApi.get<User[]>("/users", {
      params: query,
      signal
    });

    return response.data;
  },

  async listRoles(signal?: AbortSignal): Promise<UserRole[]> {
    const response = await axiosApi.get<UserRole[]>("/roles", { signal });

    return response.data;
  },

  async createUser(input: CreateUser): Promise<User> {
    const response = await axiosApi.post<User>("/users", input);

    return response.data;
  },

  async updateUser(userId: string, input: UpdateUser): Promise<User> {
    const response = await axiosApi.patch<User>(`/users/${userId}`, input);

    return response.data;
  },

  async updateUserStatus(userId: string, input: UpdateUserStatus): Promise<User> {
    const response = await axiosApi.patch<User>(`/users/${userId}/status`, input);

    return response.data;
  },

  async resetUserPassword(userId: string, input: ResetUserPassword): Promise<void> {
    await axiosApi.post(`/users/${userId}/reset-password`, input);
  }
};
