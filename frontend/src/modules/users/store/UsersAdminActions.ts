import type { CreateUser, ResetUserPassword, UpdateUser, UserStatus } from "@pharmacy-pos/shared";

export type UsersAdminActions = {
  createUser: (input: CreateUser) => Promise<void>;
  loadUsers: (signal?: AbortSignal) => Promise<void>;
  reset: () => void;
  resetPassword: (userId: string, input: ResetUserPassword) => Promise<void>;
  setRoleId: (roleId: string) => void;
  setSearch: (search: string) => void;
  setStatusFilter: (status: UserStatus | "all") => void;
  updateStatus: (userId: string, status: UserStatus) => Promise<void>;
  updateUser: (userId: string, input: UpdateUser) => Promise<void>;
};
