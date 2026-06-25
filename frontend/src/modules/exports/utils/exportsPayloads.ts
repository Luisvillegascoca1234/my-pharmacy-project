import { CSV_EXPORT_SEPARATOR } from "../constants/exportsConstants";
import type { InventoryMovementsCsvExportQuery, SalesCsvExportQuery } from "../types/exportsTypes";

function normalizeDate(value?: string): string | undefined {
  const normalized = value?.trim();

  return normalized ? normalized : undefined;
}

export function buildSalesCsvExportQuery(query: SalesCsvExportQuery): SalesCsvExportQuery {
  return {
    fromDate: normalizeDate(query.fromDate),
    separator: query.separator || CSV_EXPORT_SEPARATOR,
    toDate: normalizeDate(query.toDate)
  };
}

export function buildInventoryMovementsCsvExportQuery(
  query: InventoryMovementsCsvExportQuery
): InventoryMovementsCsvExportQuery {
  return {
    fromDate: normalizeDate(query.fromDate),
    separator: query.separator || CSV_EXPORT_SEPARATOR,
    toDate: normalizeDate(query.toDate)
  };
}
