import type { CashSupervisionStore } from "./CashSupervisionStore";

export const selectCashSupervisionState = (state: CashSupervisionStore) => ({
  closeStatus: state.closeStatus,
  error: state.error,
  fromDate: state.fromDate,
  items: state.items,
  lastClosedCashSession: state.lastClosedCashSession,
  listStatus: state.listStatus,
  openedByUserId: state.openedByUserId,
  pagination: state.pagination,
  selectedCashSession: state.selectedCashSession,
  selectedCashSessionId: state.selectedCashSessionId,
  status: state.status,
  toDate: state.toDate
});

export const selectCashSupervisionActions = (state: CashSupervisionStore) => ({
  closeCashSession: state.closeCashSession,
  loadCashSessions: state.loadCashSessions,
  reset: state.reset,
  selectCashSession: state.selectCashSession,
  setFromDate: state.setFromDate,
  setOpenedByUserId: state.setOpenedByUserId,
  setPage: state.setPage,
  setPageSize: state.setPageSize,
  setStatus: state.setStatus,
  setToDate: state.setToDate
});
