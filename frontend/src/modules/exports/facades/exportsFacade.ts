import {
  CSV_EXPORT_CONTENT_TYPE,
  INVENTORY_MOVEMENTS_CSV_FILE_NAME,
  PARQUET_EXPORT_CONTENT_TYPE,
  SALES_CSV_FILE_NAME,
  STOCK_PLANNING_OBSERVATIONS_FILE_PREFIX,
  STOCK_PLANNING_RESULTS_FILE_PREFIX
} from "../constants/exportsConstants";
import { exportsApi } from "../api/exports-api";
import type {
  CsvExportFile,
  InventoryMovementsCsvExportQuery,
  SalesCsvExportQuery,
  StockPlanningParquetFile,
  StockPlanningParquetFilters
} from "../types/exportsTypes";
import {
  buildInventoryMovementsCsvExportQuery,
  buildSalesCsvExportQuery,
  buildStockPlanningParquetExportQuery,
  buildStockPlanningPredictionParquetExportQuery
} from "../utils/exportsPayloads";

export const exportsFacade = {
  async downloadSalesCsv(query: SalesCsvExportQuery, signal?: AbortSignal): Promise<CsvExportFile> {
    const content = await exportsApi.downloadSalesCsv(buildSalesCsvExportQuery(query), signal);

    return {
      content,
      contentType: CSV_EXPORT_CONTENT_TYPE,
      fileName: SALES_CSV_FILE_NAME,
      kind: "sales"
    };
  },

  async downloadInventoryMovementsCsv(
    query: InventoryMovementsCsvExportQuery,
    signal?: AbortSignal
  ): Promise<CsvExportFile> {
    const content = await exportsApi.downloadInventoryMovementsCsv(buildInventoryMovementsCsvExportQuery(query), signal);

    return {
      content,
      contentType: CSV_EXPORT_CONTENT_TYPE,
      fileName: INVENTORY_MOVEMENTS_CSV_FILE_NAME,
      kind: "inventory-movements"
    };
  },

  async downloadStockPlanningObservationsParquet(
    filters: StockPlanningParquetFilters,
    signal?: AbortSignal
  ): Promise<StockPlanningParquetFile> {
    const query = buildStockPlanningParquetExportQuery(filters);
    const content = await exportsApi.downloadStockPlanningObservationsParquet(query, signal);

    return {
      content,
      contentType: PARQUET_EXPORT_CONTENT_TYPE,
      fileName: `${STOCK_PLANNING_OBSERVATIONS_FILE_PREFIX}_${query.fromDate}_${query.toDate}.parquet`,
      kind: "observations"
    };
  },

  async downloadStockPlanningResultsParquet(
    filters: StockPlanningParquetFilters,
    signal?: AbortSignal
  ): Promise<StockPlanningParquetFile> {
    const query = buildStockPlanningPredictionParquetExportQuery(filters);
    const content = await exportsApi.downloadStockPlanningResultsParquet(query, signal);

    return {
      content,
      contentType: PARQUET_EXPORT_CONTENT_TYPE,
      fileName: `${STOCK_PLANNING_RESULTS_FILE_PREFIX}_${query.executionId}_${query.fromDate}_${query.toDate}.parquet`,
      kind: "prediction-results"
    };
  }
};
