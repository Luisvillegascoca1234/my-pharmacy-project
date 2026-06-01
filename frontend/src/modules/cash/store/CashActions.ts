import type { CashSession, CloseCashSession, OpenCashSession } from "@pharmacy-pos/shared";

export type CashActions = {
  closeOwnCashSession: (input: CloseCashSession) => Promise<CashSession | null>;
  loadCurrentCashSession: (signal?: AbortSignal) => Promise<void>;
  openCashSession: (input: OpenCashSession) => Promise<CashSession | null>;
  reset: () => void;
};
