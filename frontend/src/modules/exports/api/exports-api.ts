import { axiosApi } from "@/api";
import type {
  InventoryMovementsCsvExportQuery,
  SalesCsvExportQuery,
  StockPlanningParquetExportQuery,
  StockPlanningPredictionParquetExportQuery
} from "../types/exportsTypes";

export const exportsApi = {
  async downloadSalesCsv(query: SalesCsvExportQuery, signal?: AbortSignal): Promise<string> {
    const response = await axiosApi.get<string>("/exports/sales.csv", {
      params: query,
      responseType: "text",
      signal
    });

    return response.data;
  },

  async downloadInventoryMovementsCsv(query: InventoryMovementsCsvExportQuery, signal?: AbortSignal): Promise<string> {
    const response = await axiosApi.get<string>("/exports/inventory-movements.csv", {
      params: query,
      responseType: "text",
      signal
    });

    return response.data;
  },

  async downloadStockPlanningObservationsParquet(
    query: StockPlanningParquetExportQuery,
    signal?: AbortSignal
  ): Promise<ArrayBuffer> {
    const response = await axiosApi.get<ArrayBuffer>("/exports/stock-planning/time-series.parquet", {
      params: query,
      responseType: "arraybuffer",
      signal
    });

    return response.data;
  },

  async downloadStockPlanningResultsParquet(
    query: StockPlanningPredictionParquetExportQuery,
    signal?: AbortSignal
  ): Promise<ArrayBuffer> {
    const response = await axiosApi.get<ArrayBuffer>("/exports/stock-planning/predictions.parquet", {
      params: query,
      responseType: "arraybuffer",
      signal
    });

    return response.data;
  }
};
