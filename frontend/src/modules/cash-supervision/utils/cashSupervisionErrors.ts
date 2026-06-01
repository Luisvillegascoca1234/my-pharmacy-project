import { ApiError } from "@/api/ApiError";
import type { CashSupervisionDataError, CashSupervisionRequestStatus } from "../types/cashSupervisionTypes";

const CASH_SUPERVISION_ERROR_CODES: Record<string, CashSupervisionDataError["code"]> = {
  CASH_SESSION_ALREADY_CLOSED: "already-closed",
  CASH_SESSION_CLOSE_FORBIDDEN: "forbidden",
  CASH_SESSION_CLOSED: "cash-session-closed",
  CASH_SESSION_COUNTED_AMOUNT_INVALID: "amount-invalid",
  CASH_SESSION_NOT_FOUND: "not-found",
  VALIDATION_ERROR: "amount-invalid"
};

export function createCashSupervisionDataError(error: unknown): CashSupervisionDataError {
  if (ApiError.isApiError(error)) {
    if (error.statusCode === 401 || error.statusCode === 403) {
      return {
        code: error.statusCode === 403 ? "forbidden" : "session-invalid",
        statusCode: error.statusCode
      };
    }

    return {
      code: error.code ? CASH_SUPERVISION_ERROR_CODES[error.code] ?? "unknown" : "unknown",
      statusCode: error.statusCode
    };
  }

  return {
    code: "unknown",
    statusCode: null
  };
}

export function getCashSupervisionStatusFromError(error: CashSupervisionDataError): CashSupervisionRequestStatus {
  if (error.code === "forbidden" || error.code === "session-invalid") {
    return "forbidden";
  }

  return "error";
}
