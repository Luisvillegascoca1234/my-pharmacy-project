import type { CloseSupervisedCashSession, SupervisableCashSession } from "../types/cashSupervisionTypes";

export type CashSupervisionActions = {
  closeCashSession: (cashSessionId: string, input: CloseSupervisedCashSession) => Promise<SupervisableCashSession | null>;
  loadCashSessions: (signal?: AbortSignal) => Promise<void>;
  reset: () => void;
  selectCashSession: (cashSessionId: string | null) => void;
  setFromDate: (fromDate: string) => void;
  setOpenedByUserId: (openedByUserId: string) => void;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  setStatus: (status: "all" | "open" | "closed") => void;
  setToDate: (toDate: string) => void;
};
