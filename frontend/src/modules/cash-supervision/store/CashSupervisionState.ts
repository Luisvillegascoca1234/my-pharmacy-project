import type { PaginationMeta } from "@pharmacy-pos/shared";
import type {
  CashSupervisionDataError,
  CashSupervisionQuery,
  CashSupervisionRequestStatus,
  SupervisableCashSession
} from "../types/cashSupervisionTypes";
import { emptyCashSupervisionPagination } from "../types/cashSupervisionTypes";

export const CASH_SUPERVISION_DEFAULT_PAGE_SIZE = 20;

export const initialCashSupervisionPagination: PaginationMeta = emptyCashSupervisionPagination;

export type CashSupervisionState = {
  closeStatus: CashSupervisionRequestStatus;
  error: CashSupervisionDataError | null;
  fromDate: string;
  items: SupervisableCashSession[];
  lastClosedCashSession: SupervisableCashSession | null;
  listStatus: CashSupervisionRequestStatus;
  openedByUserId: string;
  pagination: PaginationMeta;
  selectedCashSession: SupervisableCashSession | null;
  selectedCashSessionId: string | null;
  status: "all" | "open" | "closed";
  toDate: string;
};

export const initialCashSupervisionState: CashSupervisionState = {
  closeStatus: "idle",
  error: null,
  fromDate: "",
  items: [],
  lastClosedCashSession: null,
  listStatus: "idle",
  openedByUserId: "",
  pagination: initialCashSupervisionPagination,
  selectedCashSession: null,
  selectedCashSessionId: null,
  status: "open",
  toDate: ""
};

export function buildCashSupervisionQueryFromState(state: CashSupervisionState): CashSupervisionQuery {
  return {
    fromDate: state.fromDate || undefined,
    openedByUserId: state.openedByUserId || undefined,
    page: state.pagination.page,
    pageSize: state.pagination.pageSize,
    status: state.status === "all" ? undefined : state.status,
    toDate: state.toDate || undefined
  };
}
