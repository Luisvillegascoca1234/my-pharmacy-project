import type { PurchasesStore } from "./PurchasesStore";

export const selectPurchasesState = (state: PurchasesStore) => ({
  cancelStatus: state.cancelStatus,
  detailStatus: state.detailStatus,
  draftForm: state.draftForm,
  error: state.error,
  errorStatusCode: state.errorStatusCode,
  fromDate: state.fromDate,
  isDirty: state.isDirty,
  items: state.items,
  listStatus: state.listStatus,
  pagination: state.pagination,
  receiveStatus: state.receiveStatus,
  saveStatus: state.saveStatus,
  search: state.search,
  selectedPurchase: state.selectedPurchase,
  status: state.status,
  supplierId: state.supplierId,
  toDate: state.toDate
});

export const selectPurchasesActions = (state: PurchasesStore) => ({
  addDraftItem: state.addDraftItem,
  cancelPurchase: state.cancelPurchase,
  loadPurchase: state.loadPurchase,
  loadPurchases: state.loadPurchases,
  receivePurchase: state.receivePurchase,
  removeDraftItem: state.removeDraftItem,
  reset: state.reset,
  resetDraftForm: state.resetDraftForm,
  saveDraftForm: state.saveDraftForm,
  setDraftField: state.setDraftField,
  setDraftItemField: state.setDraftItemField,
  setFromDate: state.setFromDate,
  setPage: state.setPage,
  setPageSize: state.setPageSize,
  setSearch: state.setSearch,
  setStatus: state.setStatus,
  setSupplierId: state.setSupplierId,
  setToDate: state.setToDate
});
