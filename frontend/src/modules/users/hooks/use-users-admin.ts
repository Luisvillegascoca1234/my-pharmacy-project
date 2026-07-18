import { useCallback, useEffect, useMemo } from "react";
import {
  isFeatureAllowed,
  type CreateUser,
  type ResetUserPassword,
  type UpdateUser,
  type UserStatus
} from "@pharmacy-pos/shared";
import { useShallow } from "zustand/react/shallow";
import { selectAuthToken, selectAuthUser, useAuthStore } from "@/modules/auth";
import { selectUsersAdminActions, selectUsersAdminState } from "../store/UsersAdminSelectors";
import { useUsersAdminStore } from "../store/UsersAdminStore";

export function useUsersAdmin() {
  const token = useAuthStore(selectAuthToken);
  const authUser = useAuthStore(selectAuthUser);
  const { errorCode, roleId, roles, search, status, statusFilter, users } = useUsersAdminStore(useShallow(selectUsersAdminState));
  const {
    createUser: createUserInStore,
    loadUsers: loadUsersFromStore,
    reset,
    resetPassword: resetPasswordFromStore,
    setRoleId,
    setSearch,
    setStatusFilter,
    updateStatus: updateStatusInStore,
    updateUser: updateUserInStore
  } = useUsersAdminStore(useShallow(selectUsersAdminActions));

  const canManage = isFeatureAllowed(authUser?.role.name, "users");

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

  const createUser = useCallback(
    async (input: CreateUser) => {
      if (!token || !canManage) {
        return;
      }

      await createUserInStore(input);
    },
    [canManage, createUserInStore, token]
  );

  const updateUser = useCallback(
    async (userId: string, input: UpdateUser) => {
      if (!token || !canManage) {
        return;
      }

      await updateUserInStore(userId, input);
    },
    [canManage, token, updateUserInStore]
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
      createUser,
      errorCode,
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
      updateStatus,
      updateUser
    }),
    [
      canManage,
      createUser,
      errorCode,
      loadUsers,
      resetPassword,
      roleId,
      roles,
      search,
      setRoleId,
      setSearch,
      setStatusFilter,
      status,
      statusFilter,
      updateStatus,
      updateUser,
      users
    ]
  );
}
