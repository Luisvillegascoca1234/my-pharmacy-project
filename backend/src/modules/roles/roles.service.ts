import { BASE_ROLES, FIXED_ROLE_CATALOG, RolesCatalogResponseSchema, type RolesCatalogResponse } from "@pharmacy-pos/shared";
import { HttpError } from "../../common/http/http-error.js";
import { RolesRepository } from "./roles.repository.js";

export type PersistedRoleReference = {
  id: string;
  name: string;
};

export interface RolesCatalogRepository {
  listRoles(): Promise<PersistedRoleReference[]>;
}

export class RolesService {
  constructor(private readonly rolesRepository: RolesCatalogRepository = new RolesRepository()) {}

  async listRoles(): Promise<RolesCatalogResponse> {
    const persistedRoles = await this.rolesRepository.listRoles();
    const persistedByName = new Map(persistedRoles.map((role) => [role.name, role]));
    const hasExpectedCatalog =
      persistedRoles.length === BASE_ROLES.length &&
      BASE_ROLES.every((roleName) => persistedByName.has(roleName));

    if (!hasExpectedCatalog) {
      throw createCatalogConfigurationError(persistedRoles);
    }

    const response = FIXED_ROLE_CATALOG.map((fixedRole) => {
      const persistedRole = persistedByName.get(fixedRole.name);

      if (!persistedRole) {
        throw createCatalogConfigurationError(persistedRoles);
      }

      return {
        ...fixedRole,
        faculties: fixedRole.faculties.map((faculty) => ({ ...faculty })),
        id: persistedRole.id
      };
    });
    const parsedResponse = RolesCatalogResponseSchema.safeParse(response);

    if (!parsedResponse.success) {
      throw createCatalogConfigurationError(persistedRoles, parsedResponse.error.flatten());
    }

    return parsedResponse.data;
  }
}

function createCatalogConfigurationError(persistedRoles: PersistedRoleReference[], validationIssues?: unknown) {
  return new HttpError(
    500,
    "The persisted role catalog is inconsistent with the fixed role policy.",
    "ROLE_CATALOG_CONFIGURATION_INCONSISTENT",
    {
      actualRoleNames: persistedRoles.map((role) => role.name).sort(),
      expectedRoleNames: [...BASE_ROLES],
      validationIssues
    }
  );
}
