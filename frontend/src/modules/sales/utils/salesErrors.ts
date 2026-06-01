import { ApiError } from "@/api/ApiError";
import type { SalesDataError, SalesRequestStatus } from "../types/salesTypes";

const SALES_ERROR_CODES: Record<string, SalesDataError["code"]> = {
  SALE_ACCESS_FORBIDDEN: "forbidden",
  SALE_CANCEL_FORBIDDEN: "forbidden",
  SALE_CANCEL_NOT_CURRENT_DAY: "not-current-day",
  SALE_CANCEL_REASON_REQUIRED: "validation",
  SALE_CASH_SESSION_CLOSED: "cash-session-closed",
  SALE_NOT_CANCELABLE: "sale-not-cancelable",
  SALE_ALREADY_CANCELLED: "sale-already-cancelled",
  SALE_NOT_FOUND: "not-found",
  SALE_PAYMENT_ALREADY_REVERTED: "sale-not-cancelable",
  SALE_PAYMENT_REQUIRED: "sale-not-cancelable",
  VALIDATION_ERROR: "validation"
};

export function createSalesDataError(error: unknown): SalesDataError {
  if (ApiError.isApiError(error)) {
    if (error.statusCode === 401 || error.statusCode === 403) {
      return {
        code: error.statusCode === 403 ? "forbidden" : "session-invalid",
        statusCode: error.statusCode
      };
    }

    return {
      code: error.code ? SALES_ERROR_CODES[error.code] ?? "unknown" : "unknown",
      statusCode: error.statusCode
    };
  }

  return {
    code: "unknown",
    statusCode: null
  };
}

export function getSalesStatusFromError(error: SalesDataError): SalesRequestStatus {
  if (error.code === "forbidden" || error.code === "session-invalid") {
    return "forbidden";
  }

  return "error";
}
