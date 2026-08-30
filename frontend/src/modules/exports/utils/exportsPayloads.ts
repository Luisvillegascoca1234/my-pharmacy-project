import { CSV_EXPORT_SEPARATOR } from "../constants/exportsConstants";
import type {
  InventoryMovementsCsvExportQuery,
  SalesCsvExportQuery,
  StockPlanningParquetExportQuery,
  StockPlanningParquetFilters,
  StockPlanningPredictionParquetExportQuery
} from "../types/exportsTypes";

function normalizeOptionalText(value?: string): string | undefined {
  const normalized = value?.trim();

  return normalized ? normalized : undefined;
}

export function buildSalesCsvExportQuery(query: SalesCsvExportQuery): SalesCsvExportQuery {
  return {
    fromDate: normalizeOptionalText(query.fromDate),
    separator: query.separator || CSV_EXPORT_SEPARATOR,
    toDate: normalizeOptionalText(query.toDate)
  };
}

export function buildInventoryMovementsCsvExportQuery(
  query: InventoryMovementsCsvExportQuery
): InventoryMovementsCsvExportQuery {
  return {
    fromDate: normalizeOptionalText(query.fromDate),
    separator: query.separator || CSV_EXPORT_SEPARATOR,
    toDate: normalizeOptionalText(query.toDate)
  };
}

export function buildStockPlanningParquetExportQuery(
  filters: StockPlanningParquetFilters
): StockPlanningParquetExportQuery {
  return {
    categoryId: normalizeOptionalText(filters.categoryId),
    fromDate: filters.fromDate.trim(),
    productId: normalizeOptionalText(filters.productId),
    supplierId: normalizeOptionalText(filters.supplierId),
    toDate: filters.toDate.trim()
  };
}

export function buildStockPlanningPredictionParquetExportQuery(
  filters: StockPlanningParquetFilters
): StockPlanningPredictionParquetExportQuery {
  return {
    ...buildStockPlanningParquetExportQuery(filters),
    executionId: filters.executionId.trim()
  };
}
