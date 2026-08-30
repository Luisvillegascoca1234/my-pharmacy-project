import { ApiError } from "@/api/ApiError";
import type {
  StockPlanningDataError,
  StockPlanningDataErrorCode,
  StockPlanningRequestStatus
} from "../types/stockPlanningTypes";

export function createStockPlanningDataError(error: unknown): StockPlanningDataError {
  if (!ApiError.isApiError(error)) {
    return { code: "unknown", statusCode: null };
  }

  return {
    code: getErrorCode(error),
    statusCode: error.statusCode
  };
}

export function getStockPlanningStatusFromError(error: StockPlanningDataError): StockPlanningRequestStatus {
  return error.code === "forbidden" || error.code === "session-invalid" ? "forbidden" : "error";
}

function getErrorCode(error: ApiError): StockPlanningDataErrorCode {
  if (error.statusCode === 401) {
    return "session-invalid";
  }

  if (error.statusCode === 403) {
    return "forbidden";
  }

  if (error.statusCode === 404) {
    return "not-found";
  }

  if (error.statusCode === 409) {
    return "conflict";
  }

  if (error.statusCode === 400) {
    return "validation";
  }

  return "unknown";
}
