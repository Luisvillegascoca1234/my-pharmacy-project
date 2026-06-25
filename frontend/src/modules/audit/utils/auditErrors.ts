import { ApiError } from "@/api/ApiError";
import type { AuditDataError, AuditRequestStatus } from "../types/auditTypes";

const AUDIT_ERROR_CODES: Record<string, AuditDataError["code"]> = {
  VALIDATION_ERROR: "validation"
};

export function createAuditDataError(error: unknown): AuditDataError {
  if (ApiError.isApiError(error)) {
    if (error.statusCode === 401 || error.statusCode === 403) {
      return {
        code: error.statusCode === 403 ? "forbidden" : "session-invalid",
        statusCode: error.statusCode
      };
    }

    return {
      code: error.code ? AUDIT_ERROR_CODES[error.code] ?? "unknown" : "unknown",
      statusCode: error.statusCode
    };
  }

  return {
    code: "unknown",
    statusCode: null
  };
}

export function getAuditStatusFromError(error: AuditDataError): AuditRequestStatus {
  if (error.code === "forbidden" || error.code === "session-invalid") {
    return "forbidden";
  }

  return "error";
}
