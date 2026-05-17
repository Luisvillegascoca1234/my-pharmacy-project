import type { UpdateProduct } from "@pharmacy-pos/shared";
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { suppliersFacade } from "@/modules/suppliers";
import { unitsFacade } from "@/modules/units/facades/unitsFacade";
import { productsFacade } from "../facades/productsFacade";
import type { ProductsCatalogActions } from "./ProductsCatalogActions";
import { initialProductsCatalogState, type ProductsCatalogState } from "./ProductsCatalogState";

export type ProductsCatalogStore = ProductsCatalogState & ProductsCatalogActions;

export const useProductsCatalogStore = create<ProductsCatalogStore>()(
  devtools(
    (set, get) => ({
      ...initialProductsCatalogState,

      async loadCatalog(search, includeSuppliers, signal) {
        set({ error: null, status: "loading" }, false, "loadCatalog:start");

        try {
          const [products, categories, units, suppliersResponse] = await Promise.all([
            productsFacade.getAll(search, signal),
            productsFacade.getCategories(signal),
            unitsFacade.getAll(signal),
            includeSuppliers ? suppliersFacade.getAll({ page: 1, pageSize: 100, status: "active" }, signal) : Promise.resolve(null)
          ]);

          set(
            {
              categories,
              error: null,
              products,
              status: "success",
              suppliers: suppliersResponse?.data ?? [],
              units
            },
            false,
            "loadCatalog:success"
          );
        } catch (error) {
          if (error instanceof DOMException && error.name === "AbortError") {
            return;
          }

          set(
            {
              error: error instanceof Error ? error.message : "No se pudo cargar el catálogo.",
              status: "error"
            },
            false,
            "loadCatalog:error"
          );
        }
      },

      reset() {
        set(initialProductsCatalogState, false, "reset");
      },

      async saveProduct(input, productId) {
        if (productId) {
          await productsFacade.update(productId, input as UpdateProduct);
        } else {
          await productsFacade.create(input);
        }

        await get().loadCatalog(get().search, true);
      },

      async saveProductUnits(productId, input) {
        await productsFacade.updateUnits(productId, input);
        await get().loadCatalog(get().search, true);
      },

      setSearch(search) {
        set({ search }, false, "setSearch");
      }
    }),
    { name: "ProductsCatalogStore" }
  )
);

export function resetProductsCatalogStore() {
  useProductsCatalogStore.getState().reset();
}
