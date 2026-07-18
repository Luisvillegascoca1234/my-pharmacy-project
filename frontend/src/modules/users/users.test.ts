import { FIXED_ROLE_CATALOG, type RolesCatalogResponse, type User } from "@pharmacy-pos/shared";
import { afterEach, describe, expect, it, vi } from "vitest";
import { usersApi } from "./api/users-api";
import { usersFacade } from "./facades/usersFacade";
import { resetUsersAdminStore, useUsersAdminStore } from "./store/UsersAdminStore";

const rolesCatalog: RolesCatalogResponse = FIXED_ROLE_CATALOG.map((role) => ({
  ...role,
  faculties: role.faculties.map((faculty) => ({ ...faculty })),
  id: `role-${role.name}`
}));

const sellerUser: User = {
  createdAt: "2026-07-18T12:00:00.000Z",
  email: "seller@farmacia.test",
  fullName: "Personal de mostrador",
  id: "user-seller",
  role: {
    displayName: "Vendedor",
    id: "role-seller",
    name: "seller"
  },
  roleId: "role-seller",
  status: "active",
  updatedAt: "2026-07-18T12:00:00.000Z"
};

describe("institutional role assignment", () => {
  afterEach(() => {
    resetUsersAdminStore();
    vi.restoreAllMocks();
  });

  it("lists exactly the three fixed roles in institutional order", async () => {
    vi.spyOn(usersApi, "listRoles").mockResolvedValue(rolesCatalog);

    const roles = await usersFacade.getRoles();

    expect(roles).toEqual([
      { displayName: "Superadministrador", id: "role-superadmin", name: "superadmin" },
      { displayName: "Administrador", id: "role-admin", name: "admin" },
      { displayName: "Vendedor", id: "role-seller", name: "seller" }
    ]);
  });

  it("refreshes the visible user after assigning a different role", async () => {
    const adminUser: User = {
      ...sellerUser,
      role: { displayName: "Administrador", id: "role-admin", name: "admin" },
      roleId: "role-admin",
      updatedAt: "2026-07-18T12:05:00.000Z"
    };
    vi.spyOn(usersFacade, "update").mockResolvedValue(adminUser);
    vi.spyOn(usersFacade, "getAll").mockResolvedValue([adminUser]);
    vi.spyOn(usersFacade, "getRoles").mockResolvedValue(
      rolesCatalog.map(({ displayName, id, name }) => ({ displayName, id, name }))
    );
    useUsersAdminStore.setState({ status: "success", users: [sellerUser] });

    await useUsersAdminStore.getState().updateUser(sellerUser.id, { roleId: "role-admin" });

    expect(useUsersAdminStore.getState().users[0]).toMatchObject({
      id: sellerUser.id,
      role: { displayName: "Administrador", id: "role-admin", name: "admin" },
      roleId: "role-admin"
    });
  });

  it("exposes the expected load error state when users or the institutional catalog cannot be loaded", async () => {
    vi.spyOn(usersFacade, "getAll").mockRejectedValue(new Error("Unexpected server failure."));
    vi.spyOn(usersFacade, "getRoles").mockResolvedValue([]);

    await useUsersAdminStore.getState().loadUsers();

    expect(useUsersAdminStore.getState()).toMatchObject({
      errorCode: "load_failed",
      status: "error"
    });
  });
});
