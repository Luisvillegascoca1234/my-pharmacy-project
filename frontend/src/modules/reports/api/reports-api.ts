import { axiosApi } from "@/api";
import type {
  DailySalesReportQuery,
  DailySalesReportResponse,
  ExpiringProductsReportQuery,
  ExpiringProductsReportResponse,
  InventoryValuationReportQuery,
  InventoryValuationReportResponse
} from "../types/reportsTypes";

export const reportsApi = {
  async getDailySalesReport(query: DailySalesReportQuery, signal?: AbortSignal): Promise<DailySalesReportResponse> {
    const response = await axiosApi.get<DailySalesReportResponse>("/reports/daily-sales", {
      params: query,
      signal
    });

    return response.data;
  },

  async getInventoryValuationReport(
    query: InventoryValuationReportQuery,
    signal?: AbortSignal
  ): Promise<InventoryValuationReportResponse> {
    const response = await axiosApi.get<InventoryValuationReportResponse>("/reports/inventory-valuation", {
      params: query,
      signal
    });

    return response.data;
  },

  async getExpiringProductsReport(
    query: ExpiringProductsReportQuery,
    signal?: AbortSignal
  ): Promise<ExpiringProductsReportResponse> {
    const response = await axiosApi.get<ExpiringProductsReportResponse>("/reports/expiring-products", {
      params: query,
      signal
    });

    return response.data;
  }
};
