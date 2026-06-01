import type { PaginationMeta } from "@pharmacy-pos/shared";
import type { CancelableSale, CancelableSaleSummary, SalesDataError, SalesQuery, SalesRequestStatus, SalesStatusFilter } from "../types/salesTypes";
import { emptySalesPagination } from "../types/salesTypes";

export const SALES_DEFAULT_PAGE_SIZE = 20;

export const initialSalesPagination: PaginationMeta = emptySalesPagination;

export type SalesState = {
  cancelReason: string;
  cancelStatus: SalesRequestStatus;
  cashSessionId: string;
  detailStatus: SalesRequestStatus;
  error: SalesDataError | null;
  fromDate: string;
  items: CancelableSaleSummary[];
  lastCancelledSale: CancelableSale | null;
  listStatus: SalesRequestStatus;
  pagination: PaginationMeta;
  search: string;
  selectedSale: CancelableSale | null;
  selectedSaleId: string | null;
  sellerUserId: string;
  status: SalesStatusFilter;
  toDate: string;
};

export const initialSalesState: SalesState = {
  cancelReason: "",
  cancelStatus: "idle",
  cashSessionId: "",
  detailStatus: "idle",
  error: null,
  fromDate: "",
  items: [],
  lastCancelledSale: null,
  listStatus: "idle",
  pagination: initialSalesPagination,
  search: "",
  selectedSale: null,
  selectedSaleId: null,
  sellerUserId: "",
  status: "all",
  toDate: ""
};

export function buildSalesQueryFromState(state: SalesState): SalesQuery {
  return {
    cashSessionId: state.cashSessionId || undefined,
    fromDate: state.fromDate || undefined,
    page: state.pagination.page,
    pageSize: state.pagination.pageSize,
    search: state.search || undefined,
    sellerUserId: state.sellerUserId || undefined,
    status: state.status === "all" ? undefined : state.status,
    toDate: state.toDate || undefined
  };
}
