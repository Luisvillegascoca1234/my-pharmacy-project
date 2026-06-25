import type {
  DailySalesReportQuery,
  DailySalesReportResponse,
  DailySalesReportRow,
  ExpiringProduct,
  ExpiringProductsReportQuery,
  ExpiringProductsReportResponse,
  InventoryValuationLot,
  InventoryValuationProduct,
  InventoryValuationReportQuery,
  InventoryValuationReportResponse
} from "@pharmacy-pos/shared";

export type ReportsRequestStatus = "idle" | "loading" | "success" | "empty" | "error" | "forbidden";

export type ReportsDataErrorCode = "validation" | "forbidden" | "session-invalid" | "unknown";

export type ReportsDataError = {
  code: ReportsDataErrorCode;
  statusCode: number | null;
};

export type {
  DailySalesReportQuery,
  DailySalesReportResponse,
  DailySalesReportRow,
  ExpiringProduct,
  ExpiringProductsReportQuery,
  ExpiringProductsReportResponse,
  InventoryValuationLot,
  InventoryValuationProduct,
  InventoryValuationReportQuery,
  InventoryValuationReportResponse
};
