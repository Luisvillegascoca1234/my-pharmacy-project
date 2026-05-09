import type { UnitsCatalogActions } from "./UnitsCatalogActions";
import type { UnitsCatalogState } from "./UnitsCatalogState";

export type UnitsCatalogStore = UnitsCatalogState & UnitsCatalogActions;

export const selectUnitsCatalogActions = (state: UnitsCatalogStore) => ({
  loadCatalog: state.loadCatalog,
  reset: state.reset,
  saveCategory: state.saveCategory,
  saveUnit: state.saveUnit
});

export const selectUnitsCatalogState = (state: UnitsCatalogStore) => ({
  categories: state.categories,
  error: state.error,
  status: state.status,
  units: state.units
});
