import type { Product, ProductCategory, Supplier, Unit } from "@pharmacy-pos/shared";

export type CatalogStatus = "error" | "idle" | "loading" | "success";

export type ProductsCatalogState = {
  categories: ProductCategory[];
  error: string | null;
  products: Product[];
  search: string;
  status: CatalogStatus;
  suppliers: Supplier[];
  units: Unit[];
};

export const initialProductsCatalogState: ProductsCatalogState = {
  categories: [],
  error: null,
  products: [],
  search: "",
  status: "idle",
  suppliers: [],
  units: []
};
