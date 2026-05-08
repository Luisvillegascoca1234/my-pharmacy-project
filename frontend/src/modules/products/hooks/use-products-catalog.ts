import { useCallback, useEffect, useMemo, useState } from "react";
import type { CreateProduct, Product, ProductCategory, UpdateProduct, UpdateProductUnits } from "@pharmacy-pos/shared";
import { useAuthStore } from "@/modules/auth";
import { listUnits } from "@/modules/units/api/units-api";
import type { Unit } from "@pharmacy-pos/shared";
import {
  createProduct,
  listProductCategories,
  listProducts,
  updateProduct,
  updateProductUnits
} from "../api/products-api";

type CatalogStatus = "idle" | "loading" | "success" | "error";

export function useProductsCatalog() {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [search, setSearch] = useState("");
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
        const [nextProducts, nextCategories, nextUnits] = await Promise.all([
          listProducts(token, search, signal),
          listProductCategories(token, signal),
          listUnits(token, signal)
        ]);

        setProducts(nextProducts);
        setCategories(nextCategories);
        setUnits(nextUnits);
        setStatus("success");
      } catch (nextError) {
        if (nextError instanceof DOMException && nextError.name === "AbortError") {
          return;
        }

        setError(nextError instanceof Error ? nextError.message : "No se pudo cargar el catálogo.");
        setStatus("error");
      }
    },
    [search, token]
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

      if (productId) {
        await updateProduct(token, productId, input as UpdateProduct);
      } else {
        await createProduct(token, input);
      }

      await loadCatalog();
    },
    [loadCatalog, token]
  );

  const saveProductUnits = useCallback(
    async (productId: string, input: UpdateProductUnits) => {
      if (!token) {
        return;
      }

      await updateProductUnits(token, productId, input);
      await loadCatalog();
    },
    [loadCatalog, token]
  );

  return useMemo(
    () => ({
      products,
      categories,
      units,
      search,
      setSearch,
      status,
      error,
      canManage,
      reload: loadCatalog,
      saveProduct,
      saveProductUnits
    }),
    [canManage, categories, error, loadCatalog, products, saveProduct, saveProductUnits, search, status, units]
  );
}
