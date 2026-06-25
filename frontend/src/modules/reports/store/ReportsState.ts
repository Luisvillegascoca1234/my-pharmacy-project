import { REPORTS_DEFAULT_EXPIRING_DAYS, REPORTS_TIMEZONE } from "../constants/reportsConstants";
import type {
  DailySalesReportQuery,
  DailySalesReportResponse,
  ExpiringProductsReportQuery,
  ExpiringProductsReportResponse,
  InventoryValuationReportQuery,
  InventoryValuationReportResponse,
  ReportsDataError,
  ReportsRequestStatus
} from "../types/reportsTypes";

export type ReportsState = {
  dailySalesFromDate: string;
  dailySalesReport: DailySalesReportResponse | null;
  dailySalesStatus: ReportsRequestStatus;
  dailySalesToDate: string;
  error: ReportsDataError | null;
  expiringDays: number;
  expiringProductId: string;
  expiringProductsReport: ExpiringProductsReportResponse | null;
  expiringProductsStatus: ReportsRequestStatus;
  expiringSearch: string;
  inventoryValuationProductId: string;
  inventoryValuationReport: InventoryValuationReportResponse | null;
  inventoryValuationSearch: string;
  inventoryValuationStatus: ReportsRequestStatus;
};

export const initialReportsState: ReportsState = {
  dailySalesFromDate: "",
  dailySalesReport: null,
  dailySalesStatus: "idle",
  dailySalesToDate: "",
  error: null,
  expiringDays: REPORTS_DEFAULT_EXPIRING_DAYS,
  expiringProductId: "",
  expiringProductsReport: null,
  expiringProductsStatus: "idle",
  expiringSearch: "",
  inventoryValuationProductId: "",
  inventoryValuationReport: null,
  inventoryValuationSearch: "",
  inventoryValuationStatus: "idle"
};

export function buildDailySalesReportQueryFromState(state: ReportsState): DailySalesReportQuery {
  return {
    fromDate: state.dailySalesFromDate,
    timezone: REPORTS_TIMEZONE,
    toDate: state.dailySalesToDate
  };
}

export function buildInventoryValuationReportQueryFromState(state: ReportsState): InventoryValuationReportQuery {
  return {
    productId: state.inventoryValuationProductId || undefined,
    search: state.inventoryValuationSearch || undefined,
    timezone: REPORTS_TIMEZONE
  };
}

export function buildExpiringProductsReportQueryFromState(state: ReportsState): ExpiringProductsReportQuery {
  return {
    days: state.expiringDays,
    productId: state.expiringProductId || undefined,
    search: state.expiringSearch || undefined,
    timezone: REPORTS_TIMEZONE
  };
}
