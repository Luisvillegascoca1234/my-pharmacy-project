import type { CreateUser, ResetUserPassword, UpdateUser, UserStatus } from "@pharmacy-pos/shared";

export type UsersAdminActions = {
  loadUsers: (signal?: AbortSignal) => Promise<void>;
  reset: () => void;
  resetPassword: (userId: string, input: ResetUserPassword) => Promise<void>;
  saveUser: (input: CreateUser | UpdateUser, userId?: string) => Promise<void>;
  setRoleId: (roleId: string) => void;
  setSearch: (search: string) => void;
  setStatusFilter: (status: UserStatus | "all") => void;
  updateStatus: (userId: string, status: UserStatus) => Promise<void>;
};
