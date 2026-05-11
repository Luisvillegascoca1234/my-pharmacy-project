import type { CreateUser, UpdateUser, User, UserRole, UsersQuery } from "@pharmacy-pos/shared";
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

      async loadUsers(signal) {
        set({ error: null, status: "loading" }, false, "loadUsers:start");

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
              error: null,
              roles: roles.map(mapRoleDisplayName),
              status: "success",
              users: users.map(mapUserRoleDisplayName)
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
              error: error instanceof Error ? error.message : "No se pudieron cargar los usuarios.",
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

      async saveUser(input, userId) {
        if (userId) {
          await usersFacade.update(userId, input as UpdateUser);
        } else {
          await usersFacade.create(input as CreateUser);
        }

        await get().loadUsers();
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
      }
    }),
    { name: "UsersAdminStore" }
  )
);

export function resetUsersAdminStore() {
  useUsersAdminStore.getState().reset();
}

const roleDisplayNamesByName: Record<string, string> = {
  superadmin: "Superadministrador",
  admin: "Administrador",
  seller: "Vendedor"
};

function mapRoleDisplayName(role: UserRole): UserRole {
  return {
    ...role,
    displayName: roleDisplayNamesByName[role.name] ?? role.displayName
  };
}

function mapUserRoleDisplayName(user: User): User {
  return {
    ...user,
    role: mapRoleDisplayName(user.role)
  };
}
