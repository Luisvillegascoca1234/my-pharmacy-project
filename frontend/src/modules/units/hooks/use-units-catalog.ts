import { useCallback, useEffect, useMemo } from "react";
import { isFeatureAllowed, type CreateProductCategory, type CreateUnit } from "@pharmacy-pos/shared";
import { useShallow } from "zustand/react/shallow";
import { selectAuthToken, selectAuthUser, useAuthStore } from "@/modules/auth";
import { selectUnitsCatalogActions, selectUnitsCatalogState } from "../store/UnitsCatalogSelectors";
import { useUnitsCatalogStore } from "../store/UnitsCatalogStore";

export function useUnitsCatalog() {
  const token = useAuthStore(selectAuthToken);
  const user = useAuthStore(selectAuthUser);
  const { categories, error, status, units } = useUnitsCatalogStore(useShallow(selectUnitsCatalogState));
  const {
    loadCatalog: loadCatalogFromStore,
    reset,
    saveCategory: saveCategoryToStore,
    saveUnit: saveUnitToStore
  } = useUnitsCatalogStore(useShallow(selectUnitsCatalogActions));

  const canRead = isFeatureAllowed(user?.role.name, "units");
  const canManage = isFeatureAllowed(user?.role.name, "unitManagement");

  const loadCatalog = useCallback(
    async (signal?: AbortSignal) => {
      if (!token || !canRead) {
        reset();
        return;
      }

      await loadCatalogFromStore(signal);
    },
    [canRead, loadCatalogFromStore, reset, token]
  );

  const saveUnit = useCallback(
    async (input: CreateUnit) => {
      if (!token || !canManage) {
        return;
      }

      await saveUnitToStore(input);
    },
    [canManage, saveUnitToStore, token]
  );

  const saveCategory = useCallback(
    async (input: CreateProductCategory) => {
      if (!token || !canManage) {
        return;
      }

      await saveCategoryToStore(input);
    },
    [canManage, saveCategoryToStore, token]
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
