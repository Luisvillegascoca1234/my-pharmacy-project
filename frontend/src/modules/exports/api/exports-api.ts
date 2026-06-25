import { axiosApi } from "@/api";
import type { InventoryMovementsCsvExportQuery, SalesCsvExportQuery } from "../types/exportsTypes";

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
  }
};
