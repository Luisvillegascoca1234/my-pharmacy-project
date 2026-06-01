import type {
  CancelablePayment,
  CancelablePaymentStatus,
  CancelableSale,
  CancelableSaleStatus,
  CancelableSaleSummary,
  CancelSale,
  PaginationMeta,
  SaleCancellationBlockReason,
  SalesListResponse,
  SalesQuery
} from "@pharmacy-pos/shared";

export type {
  CancelablePayment,
  CancelablePaymentStatus,
  CancelableSale,
  CancelableSaleStatus,
  CancelableSaleSummary,
  CancelSale,
  SaleCancellationBlockReason,
  SalesListResponse,
  SalesQuery
} from "@pharmacy-pos/shared";

export type SalesRequestStatus = "idle" | "loading" | "success" | "empty" | "error" | "forbidden";

export type SalesDataErrorCode =
  | "cash-session-closed"
  | "forbidden"
  | "not-current-day"
  | "not-found"
  | "sale-not-cancelable"
  | "sale-already-cancelled"
  | "session-invalid"
  | "validation"
  | "unknown";

export type SalesDataError = {
  code: SalesDataErrorCode;
  statusCode: number | null;
};

export type SalesStatusFilter = "all" | CancelableSaleStatus;

export const emptySalesPagination: PaginationMeta = {
  page: 1,
  pageSize: 20,
  total: 0,
  totalPages: 0
};
