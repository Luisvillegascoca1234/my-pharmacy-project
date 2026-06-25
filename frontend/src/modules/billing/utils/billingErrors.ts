import { ApiError } from "@/api/ApiError";
import type { BillingDataError, BillingRequestStatus, PreparedInvoiceEligibilityBlockReason } from "../types/billingTypes";

const BILLING_ERROR_CODES: Record<string, BillingDataError["code"]> = {
  AUTHENTICATED_USER_NOT_ACTIVE: "forbidden",
  AUTHENTICATED_USER_NOT_FOUND: "session-invalid",
  AUTHENTICATED_USER_REQUIRED: "session-invalid",
  PREPARED_INVOICE_ACTIVE_EXISTS: "active-invoice-exists",
  PREPARED_INVOICE_ALREADY_CANCELLED: "already-cancelled",
  PREPARED_INVOICE_NOT_FOUND: "not-found",
  SALE_NOT_FOUND: "sale-not-found",
  SALE_NOT_INVOICEABLE: "sale-not-invoiceable",
  VALIDATION_ERROR: "validation"
};

type BillingErrorDetails = {
  invoiceBlockedReason?: unknown;
  saleId?: unknown;
};

function isInvoiceBlockedReason(value: unknown): value is PreparedInvoiceEligibilityBlockReason {
  return (
    value === "sale-not-found" ||
    value === "sale-cancelled" ||
    value === "sale-returned" ||
    value === "active-invoice-exists" ||
    value === "unknown"
  );
}

function getBillingErrorDetails(details: unknown): Pick<BillingDataError, "invoiceBlockedReason" | "saleId"> {
  if (typeof details !== "object" || details === null) {
    return {};
  }

  const data = details as BillingErrorDetails;

  return {
    invoiceBlockedReason: isInvoiceBlockedReason(data.invoiceBlockedReason) ? data.invoiceBlockedReason : undefined,
    saleId: typeof data.saleId === "string" ? data.saleId : undefined
  };
}

function getCodeFromBlockedReason(reason?: PreparedInvoiceEligibilityBlockReason): BillingDataError["code"] | undefined {
  if (reason === "active-invoice-exists") {
    return "active-invoice-exists";
  }

  if (reason === "sale-cancelled") {
    return "sale-cancelled";
  }

  if (reason === "sale-returned") {
    return "sale-returned";
  }

  if (reason === "sale-not-found") {
    return "sale-not-found";
  }

  return undefined;
}

export function createBillingDataError(error: unknown): BillingDataError {
  if (ApiError.isApiError(error)) {
    if (error.statusCode === 401 || error.statusCode === 403) {
      return {
        code: error.statusCode === 403 ? "forbidden" : "session-invalid",
        statusCode: error.statusCode
      };
    }

    const details = getBillingErrorDetails(error.details);
    const code =
      getCodeFromBlockedReason(details.invoiceBlockedReason) ??
      (error.code ? BILLING_ERROR_CODES[error.code] ?? "unknown" : "unknown");

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

export function getBillingStatusFromError(error: BillingDataError): BillingRequestStatus {
  if (error.code === "forbidden" || error.code === "session-invalid") {
    return "forbidden";
  }

  return "error";
}
