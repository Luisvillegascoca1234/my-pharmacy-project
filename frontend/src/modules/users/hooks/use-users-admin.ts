import { useCallback, useEffect, useMemo } from "react";
import type { CreateUser, ResetUserPassword, UpdateUser, UserStatus } from "@pharmacy-pos/shared";
import { useShallow } from "zustand/react/shallow";
import { selectAuthToken, selectAuthUser, useAuthStore } from "@/modules/auth";
import { selectUsersAdminActions, selectUsersAdminState } from "../store/UsersAdminSelectors";
import { useUsersAdminStore } from "../store/UsersAdminStore";

export function useUsersAdmin() {
  const token = useAuthStore(selectAuthToken);
  const authUser = useAuthStore(selectAuthUser);
  const { error, roleId, roles, search, status, statusFilter, users } = useUsersAdminStore(useShallow(selectUsersAdminState));
  const {
    loadUsers: loadUsersFromStore,
    reset,
    resetPassword: resetPasswordFromStore,
    saveUser: saveUserToStore,
    setRoleId,
    setSearch,
    setStatusFilter,
    updateStatus: updateStatusInStore
  } = useUsersAdminStore(useShallow(selectUsersAdminActions));

  const canManage = authUser?.role.name === "superadmin";

  const loadUsers = useCallback(
    async (signal?: AbortSignal) => {
      if (!token || !canManage) {
        reset();
        return;
      }

      await loadUsersFromStore(signal);
    },
    [canManage, loadUsersFromStore, reset, roleId, search, statusFilter, token]
  );

  useEffect(() => {
    const controller = new AbortController();

    void loadUsers(controller.signal);

    return () => controller.abort();
  }, [loadUsers]);

  const saveUser = useCallback(
    async (input: CreateUser | UpdateUser, userId?: string) => {
      if (!token || !canManage) {
        return;
      }

      await saveUserToStore(input, userId);
    },
    [canManage, saveUserToStore, token]
  );

  const updateStatus = useCallback(
    async (userId: string, nextStatus: UserStatus) => {
      if (!token || !canManage) {
        return;
      }

      await updateStatusInStore(userId, nextStatus);
    },
    [canManage, token, updateStatusInStore]
  );

  const resetPassword = useCallback(
    async (userId: string, input: ResetUserPassword) => {
      if (!token || !canManage) {
        return;
      }

      await resetPasswordFromStore(userId, input);
    },
    [canManage, resetPasswordFromStore, token]
  );

  return useMemo(
    () => ({
      canManage,
      error,
      roleId,
      roles,
      search,
      setRoleId,
      setSearch,
      setStatusFilter,
      status,
      statusFilter,
      users,
      reload: loadUsers,
      resetPassword,
      saveUser,
      updateStatus
    }),
    [
      canManage,
      error,
      loadUsers,
      resetPassword,
      roleId,
      roles,
      saveUser,
      search,
      setRoleId,
      setSearch,
      setStatusFilter,
      status,
      statusFilter,
      updateStatus,
      users
    ]
  );
}
