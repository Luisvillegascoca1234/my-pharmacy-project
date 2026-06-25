import type { InventoryMovementsCsvExportQuery, SalesCsvExportQuery } from "@pharmacy-pos/shared";

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

export type { InventoryMovementsCsvExportQuery, SalesCsvExportQuery };
