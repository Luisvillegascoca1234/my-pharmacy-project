import type { CreateProduct, UpdateProductUnits } from "@pharmacy-pos/shared";

export type ProductsCatalogActions = {
  loadCatalog: (search: string, includeSuppliers: boolean, signal?: AbortSignal) => Promise<void>;
  reset: () => void;
  saveProduct: (input: CreateProduct, productId?: string) => Promise<void>;
  saveProductUnits: (productId: string, input: UpdateProductUnits) => Promise<void>;
  setSearch: (search: string) => void;
};
