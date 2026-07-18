import { useCallback, useEffect, useMemo, useState } from "react";
import type { RolesCatalogResponse } from "@pharmacy-pos/shared";
import { rolesFacade } from "../facades/rolesFacade";
import type { RolesDataError, RolesRequestStatus } from "../types/rolesTypes";
import { createRolesDataError } from "../utils/rolesErrors";

function isAbortError(error: unknown) {
  return error instanceof Error && error.name === "AbortError";
}

export function useRolesCatalog() {
  const [roles, setRoles] = useState<RolesCatalogResponse>([]);
  const [status, setStatus] = useState<RolesRequestStatus>("idle");
  const [error, setError] = useState<RolesDataError | null>(null);

  const loadRoles = useCallback(async (signal?: AbortSignal) => {
    setStatus("loading");
    setError(null);

    try {
      const response = await rolesFacade.listRoles(signal);

      setRoles(response);
      setStatus("success");
    } catch (requestError) {
      if (isAbortError(requestError)) {
        return;
      }

      const dataError = createRolesDataError(requestError);

      setRoles([]);
      setError(dataError);
      setStatus(dataError.code === "invalid-configuration" ? "invalid-configuration" : "error");
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    void loadRoles(controller.signal);

    return () => controller.abort();
  }, [loadRoles]);

  return useMemo(() => ({ error, reload: loadRoles, roles, status }), [error, loadRoles, roles, status]);
}
