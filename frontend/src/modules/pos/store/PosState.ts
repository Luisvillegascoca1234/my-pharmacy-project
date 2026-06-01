import type { PaginationMeta, PosProduct, PosProductSearchQuery, Sale, SaleReceipt } from "@pharmacy-pos/shared";
import type { PosCartItem, PosCartTotals, PosDataError, PosRequestStatus } from "../types/posTypes";
import { emptyPosCartTotals } from "../utils/posCart";

export const POS_DEFAULT_PAGE_SIZE = 20;

export const initialPosPagination: PaginationMeta = {
  page: 1,
  pageSize: POS_DEFAULT_PAGE_SIZE,
  total: 0,
  totalPages: 0
};

export type PosState = {
  cartItems: PosCartItem[];
  cartTotals: PosCartTotals;
  code: string;
  confirmedSale: Sale | null;
  error: PosDataError | null;
  pagination: PaginationMeta;
  receipt: SaleReceipt | null;
  search: string;
  searchResults: PosProduct[];
  searchStatus: PosRequestStatus;
  saleStatus: PosRequestStatus;
};

export const initialPosState: PosState = {
  cartItems: [],
  cartTotals: emptyPosCartTotals,
  code: "",
  confirmedSale: null,
  error: null,
  pagination: initialPosPagination,
  receipt: null,
  search: "",
  searchResults: [],
  searchStatus: "idle",
  saleStatus: "idle"
};

export function buildPosSearchQuery(state: PosState): PosProductSearchQuery {
  return {
    code: state.code || undefined,
    page: state.pagination.page,
    pageSize: state.pagination.pageSize,
    search: state.search || undefined
  };
}
