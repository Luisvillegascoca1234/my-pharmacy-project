import type { User, UserRole, UserStatus } from "@pharmacy-pos/shared";

export type UsersAdminStatus = "idle" | "loading" | "success" | "error";

export type UsersAdminState = {
  error: string | null;
  roleId: string;
  roles: UserRole[];
  search: string;
  status: UsersAdminStatus;
  statusFilter: UserStatus | "all";
  users: User[];
};

export const initialUsersAdminState: UsersAdminState = {
  error: null,
  roleId: "all",
  roles: [],
  search: "",
  status: "idle",
  statusFilter: "all",
  users: []
};
