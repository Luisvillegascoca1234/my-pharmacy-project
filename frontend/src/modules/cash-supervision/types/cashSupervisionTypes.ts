import type { CashSessionsListResponse, CashSessionsQuery, CloseCashSession, PaginationMeta, SupervisableCashSession } from "@pharmacy-pos/shared";

export type { CashSessionsListResponse, CashSessionsQuery, SupervisableCashSession } from "@pharmacy-pos/shared";

export type CashSupervisionRequestStatus = "idle" | "loading" | "success" | "empty" | "error" | "forbidden";

export type CashSupervisionDataErrorCode =
  | "already-closed"
  | "amount-invalid"
  | "cash-session-closed"
  | "forbidden"
  | "not-found"
  | "session-invalid"
  | "unknown";

export type CashSupervisionDataError = {
  code: CashSupervisionDataErrorCode;
  statusCode: number | null;
};

export type CashSupervisionQuery = CashSessionsQuery;

export type CashSupervisionListResponse = CashSessionsListResponse;

export type CloseSupervisedCashSession = CloseCashSession;

export const emptyCashSupervisionPagination: PaginationMeta = {
  page: 1,
  pageSize: 20,
  total: 0,
  totalPages: 0
};
