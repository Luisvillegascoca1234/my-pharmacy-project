import type { CashStore } from "./CashStore";

export const selectCashState = (state: CashStore) => ({
  closeStatus: state.closeStatus,
  current: state.current,
  currentStatus: state.currentStatus,
  error: state.error,
  lastClosedCashSession: state.lastClosedCashSession,
  openStatus: state.openStatus
});

export const selectCashActions = (state: CashStore) => ({
  closeOwnCashSession: state.closeOwnCashSession,
  loadCurrentCashSession: state.loadCurrentCashSession,
  openCashSession: state.openCashSession,
  reset: state.reset
});
