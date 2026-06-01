import { ApiError } from "@/api/ApiError";
import type { PendingCartDataError, PendingCartRequestStatus } from "../types/pendingCartTypes";

const PENDING_CART_ERROR_CODES: Record<string, PendingCartDataError["code"]> = {
  PENDING_CART_ACCESS_FORBIDDEN: "forbidden",
  PENDING_CART_CONVERT_FORBIDDEN: "forbidden",
  PENDING_CART_DISCARD_FORBIDDEN: "forbidden",
  PENDING_CART_EXPIRED: "pending-expired",
  PENDING_CART_ITEM_PRICE_CHANGED: "price-changed",
  PENDING_CART_ITEM_PRODUCT_NOT_ACTIVE: "product-not-saleable",
  PENDING_CART_ITEM_PRODUCT_NOT_FOUND: "product-not-saleable",
  PENDING_CART_NOT_CONVERTIBLE: "validation",
  PENDING_CART_NOT_DISCARDABLE: "validation",
  PENDING_CART_NOT_EDITABLE: "validation",
  PENDING_CART_NOT_FOUND: "not-found",
  PENDING_CART_STOCK_INSUFFICIENT: "stock-insufficient",
  SALE_CASH_SESSION_REQUIRED: "cash-session-closed",
  SALE_CASH_SESSION_INVALID: "cash-session-closed",
  SALE_STOCK_INSUFFICIENT: "stock-insufficient",
  SALE_ITEM_PRODUCT_NOT_ACTIVE: "product-not-saleable",
  SALE_ITEM_PRODUCT_NOT_FOUND: "product-not-saleable",
  VALIDATION_ERROR: "validation"
};

function getProductId(details: unknown): string | undefined {
  if (typeof details !== "object" || details === null || !("productId" in details)) {
    return undefined;
  }

  const productId = (details as { productId?: unknown }).productId;

  return typeof productId === "string" ? productId : undefined;
}

export function createPendingCartDataError(error: unknown): PendingCartDataError {
  if (ApiError.isApiError(error)) {
    if (error.statusCode === 401 || error.statusCode === 403) {
      return {
        code: error.statusCode === 403 ? "forbidden" : "session-invalid",
        productId: getProductId(error.details),
        statusCode: error.statusCode
      };
    }

    return {
      code: error.code ? PENDING_CART_ERROR_CODES[error.code] ?? "unknown" : "unknown",
      productId: getProductId(error.details),
      statusCode: error.statusCode
    };
  }

  return {
    code: "unknown",
    statusCode: null
  };
}

export function getPendingCartStatusFromError(error: PendingCartDataError): PendingCartRequestStatus {
  if (error.code === "forbidden" || error.code === "session-invalid") {
    return "forbidden";
  }

  if (error.code === "pending-expired") {
    return "expired";
  }

  return "error";
}
