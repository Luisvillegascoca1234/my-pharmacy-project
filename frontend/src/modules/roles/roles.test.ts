import { FIXED_ROLE_CATALOG } from "@pharmacy-pos/shared";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/api";
import { rolesApi } from "./api/roles-api";
import { rolesFacade } from "./facades/rolesFacade";
import { createRolesDataError, InvalidRolesConfigurationError } from "./utils/rolesErrors";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("roles data boundary", () => {
  it("accepts the complete institutional catalog returned by the API", async () => {
    vi.spyOn(rolesApi, "listRoles").mockResolvedValue(
      FIXED_ROLE_CATALOG.map((role) => ({
        ...role,
        faculties: role.faculties.map((faculty) => ({ ...faculty })),
        id: `role-${role.name}`
      }))
    );

    const roles = await rolesFacade.listRoles();

    expect(roles.map((role) => role.name)).toEqual(["superadmin", "admin", "seller"]);
    expect(roles[0]?.faculties.map((faculty) => faculty.areaLabel)).toEqual([
      "Operación de mostrador",
      "Catálogo farmacéutico",
      "Inventario y trazabilidad",
      "Abastecimiento",
      "Cierre administrativo y análisis",
      "Gobierno del sistema"
    ]);
  });

  it("rejects an incomplete API response as an invalid institutional configuration", async () => {
    vi.spyOn(rolesApi, "listRoles").mockResolvedValue([]);

    await expect(rolesFacade.listRoles()).rejects.toBeInstanceOf(InvalidRolesConfigurationError);
  });

  it("maps the backend configuration inconsistency to the dedicated data state", () => {
    const error = createRolesDataError(
      new ApiError({
        code: "ROLE_CATALOG_CONFIGURATION_INCONSISTENT",
        details: { actualRoleNames: ["admin", "superadmin"] },
        message: "The persisted role catalog is inconsistent with the fixed role policy.",
        statusCode: 500
      })
    );

    expect(error).toEqual({
      cause: { actualRoleNames: ["admin", "superadmin"] },
      code: "invalid-configuration"
    });
  });

  it("keeps unrelated request failures recoverable", () => {
    const requestError = new ApiError({ message: "Service unavailable", statusCode: 503 });

    expect(createRolesDataError(requestError)).toEqual({ cause: requestError, code: "request-failed" });
  });
});
