import { ApiError } from "@/api/ApiError";
import type { CsvExportDataError, CsvExportRequestStatus } from "../types/exportsTypes";

const CSV_EXPORT_ERROR_CODES: Record<string, CsvExportDataError["code"]> = {
  CSV_EXPORT_INVALID_DATE_RANGE: "validation",
  VALIDATION_ERROR: "validation"
};

export function createCsvExportDataError(error: unknown): CsvExportDataError {
  if (ApiError.isApiError(error)) {
    if (error.statusCode === 401 || error.statusCode === 403) {
      return {
        code: error.statusCode === 403 ? "forbidden" : "session-invalid",
        statusCode: error.statusCode
      };
    }

    return {
      code: error.code ? CSV_EXPORT_ERROR_CODES[error.code] ?? "unknown" : "unknown",
      statusCode: error.statusCode
    };
  }

  return {
    code: "unknown",
    statusCode: null
  };
}

export function getCsvExportStatusFromError(error: CsvExportDataError): CsvExportRequestStatus {
  if (error.code === "forbidden" || error.code === "session-invalid") {
    return "forbidden";
  }

  return "error";
}
