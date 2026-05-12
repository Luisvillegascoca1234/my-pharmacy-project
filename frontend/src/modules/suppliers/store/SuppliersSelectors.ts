import type { SuppliersStore } from "./SuppliersStore";

export const selectSuppliersState = (state: SuppliersStore) => ({
  detailStatus: state.detailStatus,
  draftForm: state.draftForm,
  error: state.error,
  errorStatusCode: state.errorStatusCode,
  isDirty: state.isDirty,
  items: state.items,
  listStatus: state.listStatus,
  pagination: state.pagination,
  saveStatus: state.saveStatus,
  search: state.search,
  selectedSupplier: state.selectedSupplier,
  status: state.status
});

export const selectSuppliersActions = (state: SuppliersStore) => ({
  createSupplier: state.createSupplier,
  loadSupplier: state.loadSupplier,
  loadSuppliers: state.loadSuppliers,
  reset: state.reset,
  resetDraftForm: state.resetDraftForm,
  saveDraftForm: state.saveDraftForm,
  setDraftField: state.setDraftField,
  setDraftForm: state.setDraftForm,
  setPage: state.setPage,
  setPageSize: state.setPageSize,
  setSearch: state.setSearch,
  setSelectedSupplier: state.setSelectedSupplier,
  setStatus: state.setStatus,
  updateSupplier: state.updateSupplier
});
