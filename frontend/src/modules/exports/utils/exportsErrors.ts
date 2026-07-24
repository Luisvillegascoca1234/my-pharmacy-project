import { ApiError } from "@/api/ApiError";
import type {
  CsvExportDataError,
  CsvExportRequestStatus,
  StockPlanningParquetExportError,
  StockPlanningParquetExportStatus
} from "../types/exportsTypes";

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

const STOCK_PLANNING_PARQUET_ERROR_CODES: Record<string, StockPlanningParquetExportError["code"]> = {
  INVALID_STOCK_PLANNING_EXPORT_DATE_RANGE: "validation",
  STOCK_PLANNING_EXPORT_EXECUTION_NOT_FOUND: "execution-not-found",
  STOCK_PLANNING_EXPORT_RANGE_TOO_LARGE: "range-too-large",
  STOCK_PLANNING_EXPORT_ROW_LIMIT_EXCEEDED: "row-limit",
  VALIDATION_ERROR: "validation"
};

export function createStockPlanningParquetExportError(error: unknown): StockPlanningParquetExportError {
  if (ApiError.isApiError(error)) {
    if (error.statusCode === 401 || error.statusCode === 403) {
      return {
        code: error.statusCode === 403 ? "forbidden" : "session-invalid",
        statusCode: error.statusCode
      };
    }

    return {
      code: error.code ? STOCK_PLANNING_PARQUET_ERROR_CODES[error.code] ?? "unknown" : "unknown",
      statusCode: error.statusCode
    };
  }

  return { code: "unknown", statusCode: null };
}

export function getStockPlanningParquetStatusFromError(
  error: StockPlanningParquetExportError
): StockPlanningParquetExportStatus {
  return error.code === "forbidden" || error.code === "session-invalid" ? "forbidden" : "error";
}
