import type { PaginationMeta, Supplier, SuppliersQuery } from "@pharmacy-pos/shared";
import { createEmptySupplierDraftForm, type SupplierDraftForm, type SupplierRequestStatus, type SupplierStatusFilter } from "../types/suppliersTypes";

export const SUPPLIERS_DEFAULT_PAGE_SIZE = 20;

export const initialSuppliersPagination: PaginationMeta = {
  page: 1,
  pageSize: SUPPLIERS_DEFAULT_PAGE_SIZE,
  total: 0,
  totalPages: 0
};

export type SuppliersState = {
  detailStatus: SupplierRequestStatus;
  draftForm: SupplierDraftForm;
  error: string | null;
  errorStatusCode: number | null;
  isDirty: boolean;
  items: Supplier[];
  listStatus: SupplierRequestStatus;
  pagination: PaginationMeta;
  saveStatus: SupplierRequestStatus;
  search: string;
  selectedSupplier: Supplier | null;
  status: SupplierStatusFilter;
};

export const initialSuppliersState: SuppliersState = {
  detailStatus: "idle",
  draftForm: createEmptySupplierDraftForm(),
  error: null,
  errorStatusCode: null,
  isDirty: false,
  items: [],
  listStatus: "idle",
  pagination: initialSuppliersPagination,
  saveStatus: "idle",
  search: "",
  selectedSupplier: null,
  status: "all"
};

export function buildSuppliersQuery(state: SuppliersState): SuppliersQuery {
  return {
    page: state.pagination.page,
    pageSize: state.pagination.pageSize,
    search: state.search || undefined,
    status: state.status === "all" ? undefined : state.status
  };
}
