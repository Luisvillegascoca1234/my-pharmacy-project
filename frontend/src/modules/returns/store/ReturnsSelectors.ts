import type { ReturnsStore } from "./ReturnsStore";

export const selectReturnsState = (state: ReturnsStore) => ({
  createReason: state.createReason,
  createStatus: state.createStatus,
  detailStatus: state.detailStatus,
  error: state.error,
  lastSaleReturn: state.lastSaleReturn,
  returnableFromDate: state.returnableFromDate,
  returnablePagination: state.returnablePagination,
  returnableSales: state.returnableSales,
  returnableSalesStatus: state.returnableSalesStatus,
  returnableSearch: state.returnableSearch,
  returnableSellerUserId: state.returnableSellerUserId,
  returnableToDate: state.returnableToDate,
  saleReturnActorUserId: state.saleReturnActorUserId,
  saleReturnFromDate: state.saleReturnFromDate,
  saleReturnPagination: state.saleReturnPagination,
  saleReturns: state.saleReturns,
  saleReturnsStatus: state.saleReturnsStatus,
  saleReturnSaleId: state.saleReturnSaleId,
  saleReturnSearch: state.saleReturnSearch,
  saleReturnToDate: state.saleReturnToDate,
  selectedSaleReturn: state.selectedSaleReturn,
  selectedSaleReturnId: state.selectedSaleReturnId
});

export const selectReturnsActions = (state: ReturnsStore) => ({
  clearCreation: state.clearCreation,
  createTotalSaleReturn: state.createTotalSaleReturn,
  loadReturnableSales: state.loadReturnableSales,
  loadSaleReturn: state.loadSaleReturn,
  loadSaleReturns: state.loadSaleReturns,
  reset: state.reset,
  selectSaleReturn: state.selectSaleReturn,
  setReturnableFromDate: state.setReturnableFromDate,
  setReturnablePage: state.setReturnablePage,
  setReturnableSearch: state.setReturnableSearch,
  setReturnableSellerUserId: state.setReturnableSellerUserId,
  setReturnableToDate: state.setReturnableToDate,
  setSaleReturnActorUserId: state.setSaleReturnActorUserId,
  setSaleReturnFromDate: state.setSaleReturnFromDate,
  setSaleReturnPage: state.setSaleReturnPage,
  setSaleReturnSaleId: state.setSaleReturnSaleId,
  setSaleReturnSearch: state.setSaleReturnSearch,
  setSaleReturnToDate: state.setSaleReturnToDate
});
