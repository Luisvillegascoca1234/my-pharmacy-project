import type { NextFunction, Request, Response } from "express";
import { BASE_ROLES, ROLE_FACULTY_AREAS, ROLE_SCOPE_LEVELS, RolesCatalogResponseSchema } from "@pharmacy-pos/shared";
import { describe, expect, it, vi } from "vitest";
import { HttpError } from "../../common/http/http-error.js";
import { canReadRolesCatalog } from "./roles.routes.js";
import { RolesService, type PersistedRoleReference, type RolesCatalogRepository } from "./roles.service.js";

class FakeRolesRepository implements RolesCatalogRepository {
  constructor(private readonly roles: PersistedRoleReference[]) {}

  async listRoles() {
    return this.roles;
  }
}

const expectedPersistedRoles = [
  { id: "role-superadmin", name: "superadmin" },
  { id: "role-admin", name: "admin" },
  { id: "role-seller", name: "seller" }
];

describe("GET /api/roles contract", () => {
  it("returns the complete fixed catalog in stable order for an authorized request", async () => {
    const service = new RolesService(new FakeRolesRepository([...expectedPersistedRoles].reverse()));

    const result = await service.listRoles();

    expect(RolesCatalogResponseSchema.safeParse(result).success).toBe(true);
    expect(result.map((role) => role.name)).toEqual(BASE_ROLES);
    expect(result.map((role) => role.id)).toEqual(["role-superadmin", "role-admin", "role-seller"]);
    expect(result.map((role) => role.displayName)).toEqual(["Superadministrador", "Administrador", "Vendedor"]);
    expect(result.every((role) => role.faculties.map((faculty) => faculty.area).join() === ROLE_FACULTY_AREAS.join())).toBe(true);
    expect(new Set(result.flatMap((role) => role.faculties.map((faculty) => faculty.level)))).toEqual(new Set(ROLE_SCOPE_LEVELS));
  });

  it.each([
    ["admin", "Administrador"],
    ["seller", "Vendedor"]
  ] as const)("denies the %s role before the catalog handler runs", (roleName, _displayName) => {
    const next = vi.fn();
    const request = {
      authenticatedUser: { role: { name: roleName } }
    } as unknown as Request;

    canReadRolesCatalog(request, {} as Response, next as NextFunction);

    const error = next.mock.calls[0]?.[0];
    expect(error).toBeInstanceOf(HttpError);
    expect(error).toMatchObject({ statusCode: 403, code: "FORBIDDEN" });
  });

  it("allows a superadmin request to reach the catalog handler", () => {
    const next = vi.fn();
    const request = {
      authenticatedUser: { role: { name: "superadmin" } }
    } as unknown as Request;

    canReadRolesCatalog(request, {} as Response, next as NextFunction);

    expect(next).toHaveBeenCalledOnce();
    expect(next).toHaveBeenCalledWith();
  });

  it.each([
    ["a missing role", expectedPersistedRoles.slice(0, 2)],
    ["an unexpected role", [...expectedPersistedRoles, { id: "role-auditor", name: "auditor" }]],
    ["a replacement role", [...expectedPersistedRoles.slice(0, 2), { id: "role-auditor", name: "auditor" }]],
    ["an invalid persisted identifier", [{ id: "", name: "superadmin" }, ...expectedPersistedRoles.slice(1)]]
  ])("reports a controlled configuration inconsistency for %s", async (_case, roles) => {
    const service = new RolesService(new FakeRolesRepository(roles));

    await expect(service.listRoles()).rejects.toMatchObject({
      statusCode: 500,
      code: "ROLE_CATALOG_CONFIGURATION_INCONSISTENT"
    });
  });
});
