import { ApiError } from "@/api/ApiError";
import type { ReturnableSaleBlockReason, ReturnsDataError, ReturnsRequestStatus } from "../types/returnsTypes";

const RETURNS_ERROR_CODES: Record<string, ReturnsDataError["code"]> = {
  AUTHENTICATED_USER_NOT_ACTIVE: "forbidden",
  AUTHENTICATED_USER_NOT_FOUND: "session-invalid",
  AUTHENTICATED_USER_REQUIRED: "session-invalid",
  SALE_NOT_FOUND: "sale-not-found",
  SALE_NOT_RETURNABLE: "sale-not-returnable",
  SALE_PAYMENT_NOT_REFUNDABLE: "payment-not-refundable",
  SALE_RETURN_CONFLICT: "already-returned",
  SALE_RETURN_NOT_FOUND: "not-found",
  VALIDATION_ERROR: "validation"
};

type ReturnsErrorDetails = {
  returnBlockedReason?: unknown;
  saleId?: unknown;
};

function isReturnBlockedReason(value: unknown): value is ReturnableSaleBlockReason {
  return (
    value === "sale-not-found" ||
    value === "sale-cancelled" ||
    value === "already-returned" ||
    value === "cash-session-open" ||
    value === "active-invoice-exists" ||
    value === "payment-not-refundable" ||
    value === "unknown"
  );
}

function getReturnsErrorDetails(details: unknown): Pick<ReturnsDataError, "returnBlockedReason" | "saleId"> {
  if (typeof details !== "object" || details === null) {
    return {};
  }

  const data = details as ReturnsErrorDetails;

  return {
    returnBlockedReason: isReturnBlockedReason(data.returnBlockedReason) ? data.returnBlockedReason : undefined,
    saleId: typeof data.saleId === "string" ? data.saleId : undefined
  };
}

function getCodeFromBlockedReason(reason?: ReturnableSaleBlockReason): ReturnsDataError["code"] | undefined {
  if (reason === "active-invoice-exists") {
    return "active-invoice-exists";
  }

  if (reason === "already-returned") {
    return "already-returned";
  }

  if (reason === "cash-session-open") {
    return "cash-session-open";
  }

  if (reason === "payment-not-refundable") {
    return "payment-not-refundable";
  }

  if (reason === "sale-cancelled") {
    return "sale-cancelled";
  }

  if (reason === "sale-not-found") {
    return "sale-not-found";
  }

  return undefined;
}

export function createReturnsDataError(error: unknown): ReturnsDataError {
  if (ApiError.isApiError(error)) {
    if (error.statusCode === 401 || error.statusCode === 403) {
      return {
        code: error.statusCode === 403 ? "forbidden" : "session-invalid",
        statusCode: error.statusCode
      };
    }

    const details = getReturnsErrorDetails(error.details);
    const code =
      getCodeFromBlockedReason(details.returnBlockedReason) ??
      (error.code ? RETURNS_ERROR_CODES[error.code] ?? "unknown" : "unknown");

    return {
      code,
      ...details,
      statusCode: error.statusCode
    };
  }

  return {
    code: "unknown",
    statusCode: null
  };
}

export function getReturnsStatusFromError(error: ReturnsDataError): ReturnsRequestStatus {
  if (error.code === "forbidden" || error.code === "session-invalid") {
    return "forbidden";
  }

  return "error";
}
