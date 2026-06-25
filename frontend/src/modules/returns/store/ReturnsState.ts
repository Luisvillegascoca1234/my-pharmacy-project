import type { PaginationMeta } from "@pharmacy-pos/shared";
import type {
  ReturnableSalesQuery,
  ReturnableSaleSummary,
  ReturnsDataError,
  ReturnsRequestStatus,
  SaleReturn,
  SaleReturnsQuery,
  SaleReturnSummary
} from "../types/returnsTypes";
import { emptyReturnsPagination } from "../types/returnsTypes";

export const RETURNS_DEFAULT_PAGE_SIZE = 20;

export const initialReturnsPagination: PaginationMeta = emptyReturnsPagination;

export type ReturnsState = {
  createReason: string;
  createStatus: ReturnsRequestStatus;
  detailStatus: ReturnsRequestStatus;
  error: ReturnsDataError | null;
  lastSaleReturn: SaleReturn | null;
  returnableFromDate: string;
  returnablePagination: PaginationMeta;
  returnableSales: ReturnableSaleSummary[];
  returnableSalesStatus: ReturnsRequestStatus;
  returnableSearch: string;
  returnableSellerUserId: string;
  returnableToDate: string;
  saleReturnActorUserId: string;
  saleReturnFromDate: string;
  saleReturnPagination: PaginationMeta;
  saleReturns: SaleReturnSummary[];
  saleReturnsStatus: ReturnsRequestStatus;
  saleReturnSaleId: string;
  saleReturnSearch: string;
  saleReturnToDate: string;
  selectedSaleReturn: SaleReturn | null;
  selectedSaleReturnId: string | null;
};

export const initialReturnsState: ReturnsState = {
  createReason: "",
  createStatus: "idle",
  detailStatus: "idle",
  error: null,
  lastSaleReturn: null,
  returnableFromDate: "",
  returnablePagination: initialReturnsPagination,
  returnableSales: [],
  returnableSalesStatus: "idle",
  returnableSearch: "",
  returnableSellerUserId: "",
  returnableToDate: "",
  saleReturnActorUserId: "",
  saleReturnFromDate: "",
  saleReturnPagination: initialReturnsPagination,
  saleReturns: [],
  saleReturnsStatus: "idle",
  saleReturnSaleId: "",
  saleReturnSearch: "",
  saleReturnToDate: "",
  selectedSaleReturn: null,
  selectedSaleReturnId: null
};

export function buildReturnableSalesQueryFromState(state: ReturnsState): ReturnableSalesQuery {
  return {
    fromDate: state.returnableFromDate || undefined,
    page: state.returnablePagination.page,
    pageSize: state.returnablePagination.pageSize,
    search: state.returnableSearch || undefined,
    sellerUserId: state.returnableSellerUserId || undefined,
    toDate: state.returnableToDate || undefined
  };
}

export function buildSaleReturnsQueryFromState(state: ReturnsState): SaleReturnsQuery {
  return {
    actorUserId: state.saleReturnActorUserId || undefined,
    fromDate: state.saleReturnFromDate || undefined,
    page: state.saleReturnPagination.page,
    pageSize: state.saleReturnPagination.pageSize,
    saleId: state.saleReturnSaleId || undefined,
    search: state.saleReturnSearch || undefined,
    toDate: state.saleReturnToDate || undefined
  };
}
