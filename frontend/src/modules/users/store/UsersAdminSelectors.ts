import type { UsersAdminStore } from "./UsersAdminStore";

export const selectUsersAdminState = (state: UsersAdminStore) => ({
  errorCode: state.errorCode,
  roleId: state.roleId,
  roles: state.roles,
  search: state.search,
  status: state.status,
  statusFilter: state.statusFilter,
  users: state.users
});

export const selectUsersAdminActions = (state: UsersAdminStore) => ({
  createUser: state.createUser,
  loadUsers: state.loadUsers,
  reset: state.reset,
  resetPassword: state.resetPassword,
  setRoleId: state.setRoleId,
  setSearch: state.setSearch,
  setStatusFilter: state.setStatusFilter,
  updateStatus: state.updateStatus,
  updateUser: state.updateUser
});
