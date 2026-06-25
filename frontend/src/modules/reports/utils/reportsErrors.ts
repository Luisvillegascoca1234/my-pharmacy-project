import { ApiError } from "@/api/ApiError";
import type { ReportsDataError, ReportsRequestStatus } from "../types/reportsTypes";

const REPORTS_ERROR_CODES: Record<string, ReportsDataError["code"]> = {
  REPORT_INVALID_DATE_RANGE: "validation",
  REPORT_INVALID_TIMEZONE: "validation",
  VALIDATION_ERROR: "validation"
};

export function createReportsDataError(error: unknown): ReportsDataError {
  if (ApiError.isApiError(error)) {
    if (error.statusCode === 401 || error.statusCode === 403) {
      return {
        code: error.statusCode === 403 ? "forbidden" : "session-invalid",
        statusCode: error.statusCode
      };
    }

    return {
      code: error.code ? REPORTS_ERROR_CODES[error.code] ?? "unknown" : "unknown",
      statusCode: error.statusCode
    };
  }

  return {
    code: "unknown",
    statusCode: null
  };
}

export function getReportsStatusFromError(error: ReportsDataError): ReportsRequestStatus {
  if (error.code === "forbidden" || error.code === "session-invalid") {
    return "forbidden";
  }

  return "error";
}
