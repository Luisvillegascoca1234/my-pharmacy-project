import { ApiError } from "@/api/ApiError";
import type { PosDataError } from "../types/posTypes";

const POS_ERROR_CODES: Record<string, PosDataError["code"]> = {
  SALE_CASH_SESSION_INVALID: "cash-session-invalid",
  SALE_CASH_SESSION_REQUIRED: "cash-session-closed",
  SALE_ITEM_PRODUCT_NOT_ACTIVE: "product-not-saleable",
  SALE_ITEM_PRODUCT_NOT_FOUND: "product-not-saleable",
  SALE_PAYMENT_INSUFFICIENT: "payment-insufficient",
  SALE_STOCK_INSUFFICIENT: "stock-insufficient"
};

type StockErrorDetails = {
  productId?: unknown;
};

function getStockProductId(details: unknown): string | undefined {
  if (typeof details !== "object" || details === null) {
    return undefined;
  }

  const productId = (details as StockErrorDetails).productId;

  return typeof productId === "string" ? productId : undefined;
}

export function createPosDataError(error: unknown): PosDataError {
  if (ApiError.isApiError(error)) {
    if (error.statusCode === 401 || error.statusCode === 403) {
      return {
        code: "session-invalid",
        statusCode: error.statusCode
      };
    }

    const code = error.code ? POS_ERROR_CODES[error.code] ?? "unknown" : "unknown";

    return {
      code,
      productId: code === "stock-insufficient" ? getStockProductId(error.details) : undefined,
      statusCode: error.statusCode
    };
  }

  return {
    code: "unknown",
    statusCode: null
  };
}
