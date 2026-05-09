import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { productsFacade } from "@/modules/products/facades/productsFacade";
import { unitsFacade } from "../facades/unitsFacade";
import type { UnitsCatalogActions } from "./UnitsCatalogActions";
import { initialUnitsCatalogState, type UnitsCatalogState } from "./UnitsCatalogState";

export type UnitsCatalogStore = UnitsCatalogState & UnitsCatalogActions;

export const useUnitsCatalogStore = create<UnitsCatalogStore>()(
  devtools(
    (set, get) => ({
      ...initialUnitsCatalogState,

      async loadCatalog(signal) {
        set({ error: null, status: "loading" }, false, "loadCatalog:start");

        try {
          const [units, categories] = await Promise.all([unitsFacade.getAll(signal), productsFacade.getCategories(signal)]);

          set(
            {
              categories,
              error: null,
              status: "success",
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
              error: error instanceof Error ? error.message : "No se pudieron cargar los catálogos.",
              status: "error"
            },
            false,
            "loadCatalog:error"
          );
        }
      },

      reset() {
        set(initialUnitsCatalogState, false, "reset");
      },

      async saveCategory(input) {
        await productsFacade.createCategory(input);
        await get().loadCatalog();
      },

      async saveUnit(input) {
        await unitsFacade.create(input);
        await get().loadCatalog();
      }
    }),
    { name: "UnitsCatalogStore" }
  )
);

export function resetUnitsCatalogStore() {
  useUnitsCatalogStore.getState().reset();
}
