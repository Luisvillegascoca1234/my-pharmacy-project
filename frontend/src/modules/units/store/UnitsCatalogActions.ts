import type { CreateProductCategory, CreateUnit } from "@pharmacy-pos/shared";

export type UnitsCatalogActions = {
  loadCatalog: (signal?: AbortSignal) => Promise<void>;
  reset: () => void;
  saveCategory: (input: CreateProductCategory) => Promise<void>;
  saveUnit: (input: CreateUnit) => Promise<void>;
};
