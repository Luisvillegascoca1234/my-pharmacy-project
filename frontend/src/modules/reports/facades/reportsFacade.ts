import { reportsApi } from "../api/reports-api";
import type {
  DailySalesReportQuery,
  DailySalesReportResponse,
  ExpiringProductsReportQuery,
  ExpiringProductsReportResponse,
  InventoryValuationReportQuery,
  InventoryValuationReportResponse
} from "../types/reportsTypes";
import {
  buildDailySalesReportQuery,
  buildExpiringProductsReportQuery,
  buildInventoryValuationReportQuery
} from "../utils/reportsPayloads";

export const reportsFacade = {
  getDailySalesReport(query: DailySalesReportQuery, signal?: AbortSignal): Promise<DailySalesReportResponse> {
    return reportsApi.getDailySalesReport(buildDailySalesReportQuery(query), signal);
  },

  getInventoryValuationReport(
    query: InventoryValuationReportQuery,
    signal?: AbortSignal
  ): Promise<InventoryValuationReportResponse> {
    return reportsApi.getInventoryValuationReport(buildInventoryValuationReportQuery(query), signal);
  },

  getExpiringProductsReport(
    query: ExpiringProductsReportQuery,
    signal?: AbortSignal
  ): Promise<ExpiringProductsReportResponse> {
    return reportsApi.getExpiringProductsReport(buildExpiringProductsReportQuery(query), signal);
  }
};
