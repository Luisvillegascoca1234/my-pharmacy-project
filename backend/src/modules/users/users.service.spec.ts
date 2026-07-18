import type { Role, User } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";
import { UsersService } from "./users.service.js";
import type { UsersRepositoryPort, UserWithRole } from "./users.types.js";

describe("user role administration", () => {
  it("assigns any institutional role and returns no dynamic permissions", async () => {
    for (const role of [makeRole("superadmin"), makeRole("admin"), makeRole("seller")]) {
      const currentUser = makeUser(makeRole("seller"));
      const updatedUser = { ...currentUser, roleId: role.id, role };
      const repository = makeRepository({ currentUser, nextRole: role, updatedUser, activeSuperadmins: 1 });
      const service = new UsersService(repository);

      const result = await service.updateUser(currentUser.id, { roleId: role.id }, { actorUserId: "actor-1" });

      expect(result.role.name).toBe(role.name);
      expect(result).not.toHaveProperty("permissions");
      expect(repository.updateUser).toHaveBeenCalledWith(currentUser.id, expect.objectContaining({ roleId: role.id }));
    }
  });

  it("keeps the last active superadmin protected from role changes", async () => {
    const currentUser = makeUser(makeRole("superadmin"));
    const nextRole = makeRole("admin");
    const repository = makeRepository({ currentUser, nextRole, updatedUser: currentUser, activeSuperadmins: 0 });
    const service = new UsersService(repository);

    await expect(service.updateUser(currentUser.id, { roleId: nextRole.id }, { actorUserId: "actor-1" })).rejects.toMatchObject({
      code: "LAST_ACTIVE_SUPERADMIN",
      statusCode: 400
    });
    expect(repository.updateUser).not.toHaveBeenCalled();
  });
});

function makeRepository(input: {
  currentUser: UserWithRole;
  nextRole: Role;
  updatedUser: UserWithRole;
  activeSuperadmins: number;
}) {
  const repository: UsersRepositoryPort = {
    createUser: vi.fn().mockResolvedValue(input.updatedUser),
    findUserById: vi.fn().mockResolvedValue(input.currentUser),
    findUserByEmail: vi.fn().mockResolvedValue(null),
    findRoleById: vi.fn().mockImplementation(async (id: string) =>
      id === input.nextRole.id ? input.nextRole : input.currentUser.role
    ),
    countActiveSuperadmins: vi.fn().mockResolvedValue(input.activeSuperadmins),
    listUsers: vi.fn().mockResolvedValue([input.currentUser]),
    updatePassword: vi.fn().mockResolvedValue(undefined),
    updateUser: vi.fn().mockResolvedValue(input.updatedUser),
    updateUserStatus: vi.fn().mockResolvedValue(input.updatedUser),
    createAuditLog: vi.fn().mockResolvedValue(undefined)
  };

  return repository;
}

function makeRole(name: Role["name"]): Role {
  return {
    id: `role-${name}`,
    name,
    displayName: name === "superadmin" ? "Superadministrador" : name === "admin" ? "Administrador" : "Vendedor",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z")
  };
}

function makeUser(role: Role): UserWithRole {
  const user: User = {
    id: "user-1",
    email: "user@example.com",
    passwordHash: "hash",
    fullName: "User One",
    roleId: role.id,
    status: "active",
    lastLoginAt: null,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z")
  };

  return { ...user, role };
}
