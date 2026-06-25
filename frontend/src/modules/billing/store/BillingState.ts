import type { PaginationMeta } from "@pharmacy-pos/shared";
import type {
  BillingDataError,
  BillingRequestStatus,
  InvoiceableSalesQuery,
  InvoiceableSaleSummary,
  PreparedInvoice,
  PreparedInvoicesQuery,
  PreparedInvoiceStatusFilter,
  PreparedInvoiceSummary
} from "../types/billingTypes";
import { emptyBillingPagination } from "../types/billingTypes";

export const BILLING_DEFAULT_PAGE_SIZE = 20;

export const initialBillingPagination: PaginationMeta = emptyBillingPagination;

export type BillingState = {
  cancelReason: string;
  cancelStatus: BillingRequestStatus;
  detailStatus: BillingRequestStatus;
  error: BillingDataError | null;
  invoiceableFromDate: string;
  invoiceablePagination: PaginationMeta;
  invoiceableSales: InvoiceableSaleSummary[];
  invoiceableSalesStatus: BillingRequestStatus;
  invoiceableSearch: string;
  invoiceableSellerUserId: string;
  invoiceableToDate: string;
  lastPreparedInvoice: PreparedInvoice | null;
  preparedInvoiceFromDate: string;
  preparedInvoicePagination: PaginationMeta;
  preparedInvoices: PreparedInvoiceSummary[];
  preparedInvoicesStatus: BillingRequestStatus;
  preparedInvoiceSaleId: string;
  preparedInvoiceSearch: string;
  preparedInvoiceStatus: PreparedInvoiceStatusFilter;
  preparedInvoiceToDate: string;
  prepareStatus: BillingRequestStatus;
  selectedPreparedInvoice: PreparedInvoice | null;
  selectedPreparedInvoiceId: string | null;
};

export const initialBillingState: BillingState = {
  cancelReason: "",
  cancelStatus: "idle",
  detailStatus: "idle",
  error: null,
  invoiceableFromDate: "",
  invoiceablePagination: initialBillingPagination,
  invoiceableSales: [],
  invoiceableSalesStatus: "idle",
  invoiceableSearch: "",
  invoiceableSellerUserId: "",
  invoiceableToDate: "",
  lastPreparedInvoice: null,
  preparedInvoiceFromDate: "",
  preparedInvoicePagination: initialBillingPagination,
  preparedInvoices: [],
  preparedInvoicesStatus: "idle",
  preparedInvoiceSaleId: "",
  preparedInvoiceSearch: "",
  preparedInvoiceStatus: "all",
  preparedInvoiceToDate: "",
  prepareStatus: "idle",
  selectedPreparedInvoice: null,
  selectedPreparedInvoiceId: null
};

export function buildInvoiceableSalesQueryFromState(state: BillingState): InvoiceableSalesQuery {
  return {
    fromDate: state.invoiceableFromDate || undefined,
    page: state.invoiceablePagination.page,
    pageSize: state.invoiceablePagination.pageSize,
    search: state.invoiceableSearch || undefined,
    sellerUserId: state.invoiceableSellerUserId || undefined,
    toDate: state.invoiceableToDate || undefined
  };
}

export function buildPreparedInvoicesQueryFromState(state: BillingState): PreparedInvoicesQuery {
  return {
    fromDate: state.preparedInvoiceFromDate || undefined,
    page: state.preparedInvoicePagination.page,
    pageSize: state.preparedInvoicePagination.pageSize,
    saleId: state.preparedInvoiceSaleId || undefined,
    search: state.preparedInvoiceSearch || undefined,
    status: state.preparedInvoiceStatus === "all" ? undefined : state.preparedInvoiceStatus,
    toDate: state.preparedInvoiceToDate || undefined
  };
}
