import type { PaginationMeta } from "@pharmacy-pos/shared";
import type {
  PendingCart,
  PendingCartDataError,
  PendingCartDraft,
  PendingCartsQuery,
  PendingCartRequestStatus,
  PendingCartStatusFilter,
  PendingCartRevalidation
} from "../types/pendingCartTypes";
import { createEmptyPendingCartDraft, emptyPendingCartPagination } from "../types/pendingCartTypes";

export const PENDING_CARTS_DEFAULT_PAGE_SIZE = 20;

export const initialPendingCartsPagination: PaginationMeta = emptyPendingCartPagination;

export type PendingCartsState = {
  convertStatus: PendingCartRequestStatus;
  discardStatus: PendingCartRequestStatus;
  draft: PendingCartDraft;
  error: PendingCartDataError | null;
  includeAll: boolean;
  isDirty: boolean;
  items: PendingCart[];
  lastConvertedCart: PendingCart | null;
  lastSavedCart: PendingCart | null;
  listStatus: PendingCartRequestStatus;
  pagination: PaginationMeta;
  revalidation: PendingCartRevalidation | null;
  revalidationStatus: PendingCartRequestStatus;
  saveStatus: PendingCartRequestStatus;
  search: string;
  selectedCart: PendingCart | null;
  selectedCartId: string | null;
  status: PendingCartStatusFilter;
};

export const initialPendingCartsState: PendingCartsState = {
  convertStatus: "idle",
  discardStatus: "idle",
  draft: createEmptyPendingCartDraft(),
  error: null,
  includeAll: false,
  isDirty: false,
  items: [],
  lastConvertedCart: null,
  lastSavedCart: null,
  listStatus: "idle",
  pagination: initialPendingCartsPagination,
  revalidation: null,
  revalidationStatus: "idle",
  saveStatus: "idle",
  search: "",
  selectedCart: null,
  selectedCartId: null,
  status: "active"
};

export function buildPendingCartsQuery(state: PendingCartsState): PendingCartsQuery {
  return {
    includeAll: state.includeAll || undefined,
    page: state.pagination.page,
    pageSize: state.pagination.pageSize,
    search: state.search || undefined,
    status: state.status === "all" ? undefined : state.status
  };
}
