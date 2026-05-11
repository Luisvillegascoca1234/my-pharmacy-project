import type { UsersAdminStore } from "./UsersAdminStore";

export const selectUsersAdminState = (state: UsersAdminStore) => ({
  error: state.error,
  roleId: state.roleId,
  roles: state.roles,
  search: state.search,
  status: state.status,
  statusFilter: state.statusFilter,
  users: state.users
});

export const selectUsersAdminActions = (state: UsersAdminStore) => ({
  loadUsers: state.loadUsers,
  reset: state.reset,
  resetPassword: state.resetPassword,
  saveUser: state.saveUser,
  setRoleId: state.setRoleId,
  setSearch: state.setSearch,
  setStatusFilter: state.setStatusFilter,
  updateStatus: state.updateStatus
});
