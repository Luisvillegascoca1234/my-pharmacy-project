import { RolesCatalogResponseSchema, type RolesCatalogResponse } from "@pharmacy-pos/shared";
import { rolesApi } from "../api/roles-api";
import { InvalidRolesConfigurationError } from "../utils/rolesErrors";

export const rolesFacade = {
  async listRoles(signal?: AbortSignal): Promise<RolesCatalogResponse> {
    const result = RolesCatalogResponseSchema.safeParse(await rolesApi.listRoles(signal));

    if (!result.success) {
      throw new InvalidRolesConfigurationError(result.error.flatten());
    }

    return result.data;
  }
};
