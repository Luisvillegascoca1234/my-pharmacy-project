import { useCallback, useEffect, useMemo } from "react";
import type { CreateProduct, UpdateProductUnits } from "@pharmacy-pos/shared";
import { useShallow } from "zustand/react/shallow";
import { selectAuthToken, selectAuthUser, useAuthStore } from "@/modules/auth";
import { selectProductsCatalogActions, selectProductsCatalogState } from "../store/ProductsCatalogSelectors";
import { useProductsCatalogStore } from "../store/ProductsCatalogStore";

export function useProductsCatalog() {
  const token = useAuthStore(selectAuthToken);
  const user = useAuthStore(selectAuthUser);
  const { categories, error, products, search, status, suppliers, units } = useProductsCatalogStore(useShallow(selectProductsCatalogState));
  const { loadCatalog: loadCatalogFromStore, reset, saveProduct: saveProductToStore, saveProductUnits: saveProductUnitsToStore, setSearch } =
    useProductsCatalogStore(useShallow(selectProductsCatalogActions));

  const canManage = user?.role.name === "superadmin" || user?.role.name === "admin";

  const loadCatalog = useCallback(
    async (signal?: AbortSignal) => {
      if (!token) {
        reset();
        return;
      }

      await loadCatalogFromStore(search, canManage, signal);
    },
    [canManage, loadCatalogFromStore, reset, search, token]
  );

  useEffect(() => {
    const controller = new AbortController();

    void loadCatalog(controller.signal);

    return () => controller.abort();
  }, [loadCatalog]);

  const saveProduct = useCallback(
    async (input: CreateProduct, productId?: string) => {
      if (!token) {
        return;
      }

      await saveProductToStore(input, productId);
    },
    [saveProductToStore, token]
  );

  const saveProductUnits = useCallback(
    async (productId: string, input: UpdateProductUnits) => {
      if (!token) {
        return;
      }

      await saveProductUnitsToStore(productId, input);
    },
    [saveProductUnitsToStore, token]
  );

  return useMemo(
    () => ({
      products,
      categories,
      units,
      suppliers,
      search,
      setSearch,
      status,
      error,
      canManage,
      reload: loadCatalog,
      saveProduct,
      saveProductUnits
    }),
    [canManage, categories, error, loadCatalog, products, saveProduct, saveProductUnits, search, setSearch, status, suppliers, units]
  );
}
