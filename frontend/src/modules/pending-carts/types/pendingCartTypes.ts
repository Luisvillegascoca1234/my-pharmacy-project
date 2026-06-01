import type {
  ConvertPendingCart,
  DiscardPendingCart,
  EditPendingCart,
  PendingCart,
  PendingCartItem,
  PendingCartItemInput,
  PendingCartRevalidation,
  PendingCartRevalidationIssue,
  PendingCartRevalidationIssueCode,
  PendingCartsListResponse,
  PendingCartsQuery,
  PendingCartStatus,
  PaginationMeta,
  SavePendingCart
} from "@pharmacy-pos/shared";

export type {
  ConvertPendingCart,
  DiscardPendingCart,
  EditPendingCart,
  PendingCart,
  PendingCartItem,
  PendingCartItemInput,
  PendingCartRevalidation,
  PendingCartRevalidationIssue,
  PendingCartRevalidationIssueCode,
  PendingCartsListResponse,
  PendingCartsQuery,
  PendingCartStatus,
  SavePendingCart
} from "@pharmacy-pos/shared";

export type PendingCartRequestStatus = "idle" | "loading" | "success" | "empty" | "error" | "forbidden" | "expired";

export type PendingCartDataErrorCode =
  | "cash-session-closed"
  | "forbidden"
  | "pending-expired"
  | "price-changed"
  | "product-not-saleable"
  | "session-invalid"
  | "stock-insufficient"
  | "validation"
  | "not-found"
  | "unknown";

export type PendingCartDataError = {
  code: PendingCartDataErrorCode;
  productId?: string;
  statusCode: number | null;
};

export type PendingCartStatusFilter = "all" | PendingCartStatus;

export type PendingCartDraft = {
  items: PendingCartItemInput[];
  name: string;
  note: string;
};

export const emptyPendingCartPagination: PaginationMeta = {
  page: 1,
  pageSize: 20,
  total: 0,
  totalPages: 0
};

export function createEmptyPendingCartDraft(): PendingCartDraft {
  return {
    items: [],
    name: "",
    note: ""
  };
}
