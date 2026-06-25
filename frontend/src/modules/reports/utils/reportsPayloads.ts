import { REPORTS_DEFAULT_EXPIRING_DAYS, REPORTS_TIMEZONE } from "../constants/reportsConstants";
import type {
  DailySalesReportQuery,
  ExpiringProductsReportQuery,
  InventoryValuationReportQuery
} from "../types/reportsTypes";

function normalizeText(value?: string): string | undefined {
  const normalized = value?.trim();

  return normalized ? normalized : undefined;
}

export function buildDailySalesReportQuery(query: DailySalesReportQuery): DailySalesReportQuery {
  return {
    fromDate: query.fromDate,
    timezone: query.timezone || REPORTS_TIMEZONE,
    toDate: query.toDate
  };
}

export function buildInventoryValuationReportQuery(query: InventoryValuationReportQuery): InventoryValuationReportQuery {
  return {
    productId: normalizeText(query.productId),
    search: normalizeText(query.search),
    timezone: query.timezone || REPORTS_TIMEZONE
  };
}

export function buildExpiringProductsReportQuery(query: ExpiringProductsReportQuery): ExpiringProductsReportQuery {
  return {
    days: query.days || REPORTS_DEFAULT_EXPIRING_DAYS,
    productId: normalizeText(query.productId),
    search: normalizeText(query.search),
    timezone: query.timezone || REPORTS_TIMEZONE
  };
}
