import type { PendingCartsStore } from "./PendingCartsStore";

export const selectPendingCartsState = (state: PendingCartsStore) => ({
  convertStatus: state.convertStatus,
  discardStatus: state.discardStatus,
  draft: state.draft,
  error: state.error,
  includeAll: state.includeAll,
  isDirty: state.isDirty,
  items: state.items,
  lastConvertedCart: state.lastConvertedCart,
  lastSavedCart: state.lastSavedCart,
  listStatus: state.listStatus,
  pagination: state.pagination,
  revalidation: state.revalidation,
  revalidationStatus: state.revalidationStatus,
  saveStatus: state.saveStatus,
  search: state.search,
  selectedCart: state.selectedCart,
  selectedCartId: state.selectedCartId,
  status: state.status
});

export const selectPendingCartsActions = (state: PendingCartsStore) => ({
  addDraftItem: state.addDraftItem,
  clearDraft: state.clearDraft,
  convertSelectedCart: state.convertSelectedCart,
  discardCart: state.discardCart,
  loadPendingCarts: state.loadPendingCarts,
  removeDraftItem: state.removeDraftItem,
  reset: state.reset,
  retakeCart: state.retakeCart,
  saveDraft: state.saveDraft,
  selectCart: state.selectCart,
  setDraft: state.setDraft,
  setDraftField: state.setDraftField,
  setDraftItemQuantity: state.setDraftItemQuantity,
  setIncludeAll: state.setIncludeAll,
  setPage: state.setPage,
  setPageSize: state.setPageSize,
  setSearch: state.setSearch,
  setStatus: state.setStatus
});
