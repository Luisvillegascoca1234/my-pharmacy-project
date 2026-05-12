import type { PaginationMeta, Purchase, PurchasesQuery, PurchaseSummary } from "@pharmacy-pos/shared";
import { createEmptyPurchaseDraftForm, type PurchaseDraftForm, type PurchaseRequestStatus, type PurchaseStatusFilter } from "../types/purchasesTypes";

export const PURCHASES_DEFAULT_PAGE_SIZE = 20;

export const initialPurchasesPagination: PaginationMeta = {
  page: 1,
  pageSize: PURCHASES_DEFAULT_PAGE_SIZE,
  total: 0,
  totalPages: 0
};

export type PurchasesState = {
  cancelStatus: PurchaseRequestStatus;
  detailStatus: PurchaseRequestStatus;
  draftForm: PurchaseDraftForm;
  error: string | null;
  errorStatusCode: number | null;
  fromDate: string;
  isDirty: boolean;
  items: PurchaseSummary[];
  listStatus: PurchaseRequestStatus;
  pagination: PaginationMeta;
  receiveStatus: PurchaseRequestStatus;
  saveStatus: PurchaseRequestStatus;
  search: string;
  selectedPurchase: Purchase | null;
  status: PurchaseStatusFilter;
  supplierId: string;
  toDate: string;
};

export const initialPurchasesState: PurchasesState = {
  cancelStatus: "idle",
  detailStatus: "idle",
  draftForm: createEmptyPurchaseDraftForm(),
  error: null,
  errorStatusCode: null,
  fromDate: "",
  isDirty: false,
  items: [],
  listStatus: "idle",
  pagination: initialPurchasesPagination,
  receiveStatus: "idle",
  saveStatus: "idle",
  search: "",
  selectedPurchase: null,
  status: "all",
  supplierId: "",
  toDate: ""
};

export function buildPurchasesQuery(state: PurchasesState): PurchasesQuery {
  return {
    fromDate: state.fromDate || undefined,
    page: state.pagination.page,
    pageSize: state.pagination.pageSize,
    search: state.search || undefined,
    status: state.status === "all" ? undefined : state.status,
    supplierId: state.supplierId || undefined,
    toDate: state.toDate || undefined
  };
}
