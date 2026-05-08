import { useCallback, useEffect, useMemo, useState } from "react";
import type { CreateProductCategory, CreateUnit, ProductCategory, Unit } from "@pharmacy-pos/shared";
import { useAuthStore } from "@/modules/auth";
import { createProductCategory, listProductCategories } from "@/modules/products/api/products-api";
import { createUnit, listUnits } from "../api/units-api";

type CatalogStatus = "idle" | "loading" | "success" | "error";

export function useUnitsCatalog() {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const [units, setUnits] = useState<Unit[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [status, setStatus] = useState<CatalogStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const canManage = user?.role.name === "superadmin" || user?.role.name === "admin";

  const loadCatalog = useCallback(
    async (signal?: AbortSignal) => {
      if (!token) {
        return;
      }

      setStatus("loading");
      setError(null);

      try {
        const [nextUnits, nextCategories] = await Promise.all([listUnits(token, signal), listProductCategories(token, signal)]);

        setUnits(nextUnits);
        setCategories(nextCategories);
        setStatus("success");
      } catch (nextError) {
        if (nextError instanceof DOMException && nextError.name === "AbortError") {
          return;
        }

        setError(nextError instanceof Error ? nextError.message : "No se pudieron cargar los catálogos.");
        setStatus("error");
      }
    },
    [token]
  );

  useEffect(() => {
    const controller = new AbortController();

    void loadCatalog(controller.signal);

    return () => controller.abort();
  }, [loadCatalog]);

  const saveUnit = useCallback(
    async (input: CreateUnit) => {
      if (!token) {
        return;
      }

      await createUnit(token, input);
      await loadCatalog();
    },
    [loadCatalog, token]
  );

  const saveCategory = useCallback(
    async (input: CreateProductCategory) => {
      if (!token) {
        return;
      }

      await createProductCategory(token, input);
      await loadCatalog();
    },
    [loadCatalog, token]
  );

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
