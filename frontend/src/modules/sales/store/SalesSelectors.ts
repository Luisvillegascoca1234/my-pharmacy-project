import type { SalesStore } from "./SalesStore";

export const selectSalesState = (state: SalesStore) => ({
  cancelReason: state.cancelReason,
  cancelStatus: state.cancelStatus,
  cashSessionId: state.cashSessionId,
  detailStatus: state.detailStatus,
  error: state.error,
  fromDate: state.fromDate,
  items: state.items,
  lastCancelledSale: state.lastCancelledSale,
  listStatus: state.listStatus,
  pagination: state.pagination,
  search: state.search,
  selectedSale: state.selectedSale,
  selectedSaleId: state.selectedSaleId,
  sellerUserId: state.sellerUserId,
  status: state.status,
  toDate: state.toDate
});

export const selectSalesActions = (state: SalesStore) => ({
  cancelSelectedSale: state.cancelSelectedSale,
  clearCancellation: state.clearCancellation,
  loadSale: state.loadSale,
  loadSales: state.loadSales,
  reset: state.reset,
  selectSale: state.selectSale,
  setCancelReason: state.setCancelReason,
  setCashSessionId: state.setCashSessionId,
  setFromDate: state.setFromDate,
  setPage: state.setPage,
  setPageSize: state.setPageSize,
  setSearch: state.setSearch,
  setSellerUserId: state.setSellerUserId,
  setStatus: state.setStatus,
  setToDate: state.setToDate
});
