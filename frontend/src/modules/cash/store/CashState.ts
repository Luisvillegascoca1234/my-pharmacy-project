import type { CashSession, CurrentCashSession } from "@pharmacy-pos/shared";
import type { CashDataError, CashRequestStatus } from "../types/cashTypes";

export const initialCurrentCashSession: CurrentCashSession = {
  cashSession: null,
  isOpen: false
};

export type CashState = {
  closeStatus: CashRequestStatus;
  current: CurrentCashSession;
  currentStatus: CashRequestStatus;
  error: CashDataError | null;
  lastClosedCashSession: CashSession | null;
  openStatus: CashRequestStatus;
};

export const initialCashState: CashState = {
  closeStatus: "idle",
  current: initialCurrentCashSession,
  currentStatus: "idle",
  error: null,
  lastClosedCashSession: null,
  openStatus: "idle"
};
