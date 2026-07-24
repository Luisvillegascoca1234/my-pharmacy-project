import type {
  InventoryMovementsCsvExportQuery,
  SalesCsvExportQuery,
  StockPlanningParquetExportQuery,
  StockPlanningPredictionParquetExportQuery
} from "@pharmacy-pos/shared";

export type CsvExportKind = "sales" | "inventory-movements";

export type CsvExportRequestStatus = "idle" | "loading" | "success" | "empty" | "error" | "forbidden";

export type CsvExportDataErrorCode = "validation" | "forbidden" | "session-invalid" | "unknown";

export type CsvExportDataError = {
  code: CsvExportDataErrorCode;
  statusCode: number | null;
};

export type CsvExportFile = {
  content: string;
  contentType: "text/csv; charset=utf-8";
  fileName: string;
  kind: CsvExportKind;
};

export type StockPlanningParquetExportKind = "observations" | "prediction-results";
export type StockPlanningParquetExportStatus = "error" | "forbidden" | "idle" | "loading" | "success";
export type StockPlanningParquetExportErrorCode =
  | "execution-not-found"
  | "forbidden"
  | "range-too-large"
  | "row-limit"
  | "session-invalid"
  | "unknown"
  | "validation";

export type StockPlanningParquetExportError = {
  code: StockPlanningParquetExportErrorCode;
  statusCode: number | null;
};

export type StockPlanningParquetFile = {
  content: ArrayBuffer;
  contentType: "application/vnd.apache.parquet";
  fileName: string;
  kind: StockPlanningParquetExportKind;
};

export type StockPlanningParquetFilters = {
  categoryId: string;
  executionId: string;
  fromDate: string;
  productId: string;
  supplierId: string;
  toDate: string;
};

export type {
  InventoryMovementsCsvExportQuery,
  SalesCsvExportQuery,
  StockPlanningParquetExportQuery,
  StockPlanningPredictionParquetExportQuery
};
