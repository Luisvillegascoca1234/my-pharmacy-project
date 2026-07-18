import type { UsersQuery } from "@pharmacy-pos/shared";
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { usersFacade } from "../facades/usersFacade";
import type { UsersAdminActions } from "./UsersAdminActions";
import { initialUsersAdminState, type UsersAdminState } from "./UsersAdminState";

export type UsersAdminStore = UsersAdminState & UsersAdminActions;

export const useUsersAdminStore = create<UsersAdminStore>()(
  devtools(
    (set, get) => ({
      ...initialUsersAdminState,

      async createUser(input) {
        await usersFacade.create(input);
        await get().loadUsers();
      },

      async loadUsers(signal) {
        set({ errorCode: null, status: "loading" }, false, "loadUsers:start");

        try {
          const state = get();
          const query: UsersQuery = {
            search: state.search || undefined,
            roleId: state.roleId === "all" ? undefined : state.roleId,
            status: state.statusFilter === "all" ? undefined : state.statusFilter
          };
          const [users, roles] = await Promise.all([usersFacade.getAll(query, signal), usersFacade.getRoles(signal)]);

          set(
            {
              errorCode: null,
              roles,
              status: "success",
              users
            },
            false,
            "loadUsers:success"
          );
        } catch (error) {
          if (error instanceof DOMException && error.name === "AbortError") {
            return;
          }

          set(
            {
              errorCode: "load_failed",
              status: "error"
            },
            false,
            "loadUsers:error"
          );
        }
      },

      reset() {
        set(initialUsersAdminState, false, "reset");
      },

      async resetPassword(userId, input) {
        await usersFacade.resetPassword(userId, input);
      },

      setRoleId(roleId) {
        set({ roleId }, false, "setRoleId");
      },

      setSearch(search) {
        set({ search }, false, "setSearch");
      },

      setStatusFilter(statusFilter) {
        set({ statusFilter }, false, "setStatusFilter");
      },

      async updateStatus(userId, status) {
        await usersFacade.updateStatus(userId, { status });
        await get().loadUsers();
      },

      async updateUser(userId, input) {
        await usersFacade.update(userId, input);
        await get().loadUsers();
      }
    }),
    { name: "UsersAdminStore" }
  )
);

export function resetUsersAdminStore() {
  useUsersAdminStore.getState().reset();
}
