import type { ProductCategory, Unit } from "@pharmacy-pos/shared";

export type CatalogStatus = "error" | "idle" | "loading" | "success";

export type UnitsCatalogState = {
  categories: ProductCategory[];
  error: string | null;
  status: CatalogStatus;
  units: Unit[];
};

export const initialUnitsCatalogState: UnitsCatalogState = {
  categories: [],
  error: null,
  status: "idle",
  units: []
};
