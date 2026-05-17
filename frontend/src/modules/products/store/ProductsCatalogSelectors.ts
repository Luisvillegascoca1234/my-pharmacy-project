import type { ProductsCatalogActions } from "./ProductsCatalogActions";
import type { ProductsCatalogState } from "./ProductsCatalogState";

export type ProductsCatalogStore = ProductsCatalogState & ProductsCatalogActions;

export const selectProductsCatalogActions = (state: ProductsCatalogStore) => ({
  loadCatalog: state.loadCatalog,
  reset: state.reset,
  saveProduct: state.saveProduct,
  saveProductUnits: state.saveProductUnits,
  setSearch: state.setSearch
});

export const selectProductsCatalogState = (state: ProductsCatalogStore) => ({
  categories: state.categories,
  error: state.error,
  products: state.products,
  search: state.search,
  status: state.status,
  suppliers: state.suppliers,
  units: state.units
});
