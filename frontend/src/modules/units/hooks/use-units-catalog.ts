import { useCallback, useEffect, useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { selectAuthToken, selectAuthUser, useAuthStore } from "@/modules/auth";
import { selectUnitsCatalogActions, selectUnitsCatalogState } from "../store/UnitsCatalogSelectors";
import { useUnitsCatalogStore } from "../store/UnitsCatalogStore";

export function useUnitsCatalog() {
  const token = useAuthStore(selectAuthToken);
  const user = useAuthStore(selectAuthUser);
  const { categories, error, status, units } = useUnitsCatalogStore(useShallow(selectUnitsCatalogState));
  const { loadCatalog: loadCatalogFromStore, reset, saveCategory, saveUnit } = useUnitsCatalogStore(useShallow(selectUnitsCatalogActions));

  const canManage = user?.role.name === "superadmin" || user?.role.name === "admin";

  const loadCatalog = useCallback(
    async (signal?: AbortSignal) => {
      if (!token) {
        reset();
        return;
      }

      await loadCatalogFromStore(signal);
    },
    [loadCatalogFromStore, reset, token]
  );

  useEffect(() => {
    const controller = new AbortController();

    void loadCatalog(controller.signal);

    return () => controller.abort();
  }, [loadCatalog]);

  return useMemo(
    () => ({
      units,
      categories,
      status,
      error,
      canManage,
      saveUnit,
      saveCategory,
      reload: loadCatalog
    }),
    [canManage, categories, error, loadCatalog, saveCategory, saveUnit, status, units]
  );
}
