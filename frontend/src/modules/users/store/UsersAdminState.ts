import type { User, UserRole, UserStatus } from "@pharmacy-pos/shared";

export type UsersAdminStatus = "idle" | "loading" | "success" | "error";
export type UsersAdminErrorCode = "load_failed";

export type UsersAdminState = {
  errorCode: UsersAdminErrorCode | null;
  roleId: string;
  roles: UserRole[];
  search: string;
  status: UsersAdminStatus;
  statusFilter: UserStatus | "all";
  users: User[];
};

export const initialUsersAdminState: UsersAdminState = {
  errorCode: null,
  roleId: "all",
  roles: [],
  search: "",
  status: "idle",
  statusFilter: "all",
  users: []
};
