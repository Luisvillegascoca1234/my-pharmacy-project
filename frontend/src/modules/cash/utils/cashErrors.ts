import { ApiError } from "@/api/ApiError";
import type { CashDataError } from "../types/cashTypes";

const CASH_ERROR_CODES: Record<string, CashDataError["code"]> = {
  CASH_SESSION_ALREADY_CLOSED: "already-closed",
  CASH_SESSION_ALREADY_OPEN: "already-open",
  CASH_SESSION_AMOUNT_INVALID: "amount-invalid",
  CASH_SESSION_CLOSE_FORBIDDEN: "forbidden",
  CASH_SESSION_COUNTED_AMOUNT_INVALID: "amount-invalid",
  CASH_SESSION_INITIAL_AMOUNT_INVALID: "amount-invalid",
  CASH_SESSION_NOT_FOUND: "not-found",
  CASH_SESSION_NOTE_INVALID: "amount-invalid"
};

export function createCashDataError(error: unknown): CashDataError {
  if (ApiError.isApiError(error)) {
    if (error.statusCode === 401 || error.statusCode === 403) {
      return {
        code: error.code === "CASH_SESSION_CLOSE_FORBIDDEN" ? "forbidden" : "session-invalid",
        statusCode: error.statusCode
      };
    }

    return {
      code: error.code ? CASH_ERROR_CODES[error.code] ?? "unknown" : "unknown",
      statusCode: error.statusCode
    };
  }

  return {
    code: "unknown",
    statusCode: null
  };
}
