import type {
  CreateTotalSaleReturn,
  PaginationMeta,
  ReturnableSaleBlockReason,
  ReturnableSalesListResponse,
  ReturnableSalesQuery,
  ReturnableSaleSummary,
  SaleReturn,
  SaleReturnItem,
  SaleReturnsListResponse,
  SaleReturnsQuery,
  SaleReturnSummary
} from "@pharmacy-pos/shared";

export type {
  CreateTotalSaleReturn,
  ReturnableSaleBlockReason,
  ReturnableSalesListResponse,
  ReturnableSalesQuery,
  ReturnableSaleSummary,
  SaleReturn,
  SaleReturnItem,
  SaleReturnsListResponse,
  SaleReturnsQuery,
  SaleReturnSummary
} from "@pharmacy-pos/shared";

export type ReturnsRequestStatus = "idle" | "loading" | "success" | "empty" | "error" | "forbidden";

export type ReturnsDataErrorCode =
  | "active-invoice-exists"
  | "already-returned"
  | "cash-session-open"
  | "forbidden"
  | "not-found"
  | "payment-not-refundable"
  | "sale-cancelled"
  | "sale-not-found"
  | "sale-not-returnable"
  | "session-invalid"
  | "validation"
  | "unknown";

export type ReturnsDataError = {
  code: ReturnsDataErrorCode;
  returnBlockedReason?: ReturnableSaleBlockReason;
  saleId?: string;
  statusCode: number | null;
};

export const emptyReturnsPagination: PaginationMeta = {
  page: 1,
  pageSize: 20,
  total: 0,
  totalPages: 0
};
