import type {
  CancelPreparedInvoice,
  InvoiceableSalesListResponse,
  InvoiceableSalesQuery,
  InvoiceableSaleSummary,
  PaginationMeta,
  PrepareInvoiceFromSale,
  PreparedInvoice,
  PreparedInvoiceEligibilityBlockReason,
  PreparedInvoicesListResponse,
  PreparedInvoicesQuery,
  PreparedInvoiceStatus,
  PreparedInvoiceSummary
} from "@pharmacy-pos/shared";

export type {
  CancelPreparedInvoice,
  InvoiceableSalesListResponse,
  InvoiceableSalesQuery,
  InvoiceableSaleSummary,
  PrepareInvoiceFromSale,
  PreparedInvoice,
  PreparedInvoiceEligibilityBlockReason,
  PreparedInvoicesListResponse,
  PreparedInvoicesQuery,
  PreparedInvoiceStatus,
  PreparedInvoiceSummary
} from "@pharmacy-pos/shared";

export type BillingRequestStatus = "idle" | "loading" | "success" | "empty" | "error" | "forbidden";

export type BillingDataErrorCode =
  | "active-invoice-exists"
  | "forbidden"
  | "not-found"
  | "sale-cancelled"
  | "sale-not-found"
  | "sale-not-invoiceable"
  | "sale-returned"
  | "session-invalid"
  | "validation"
  | "already-cancelled"
  | "unknown";

export type BillingDataError = {
  code: BillingDataErrorCode;
  invoiceBlockedReason?: PreparedInvoiceEligibilityBlockReason;
  saleId?: string;
  statusCode: number | null;
};

export type PreparedInvoiceStatusFilter = "all" | PreparedInvoiceStatus;

export const emptyBillingPagination: PaginationMeta = {
  page: 1,
  pageSize: 20,
  total: 0,
  totalPages: 0
};
