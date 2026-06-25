import { Prisma } from "@prisma/client";
import type {
  DailySalesReportQuery,
  DailySalesReportResponse,
  DailySalesReportRow,
  ExpiringProduct,
  ExpiringProductsReportQuery,
  ExpiringProductsReportResponse,
  InventoryValuationProduct,
  InventoryValuationReportQuery,
  InventoryValuationReportResponse
} from "@pharmacy-pos/shared";
import { HttpError } from "../../common/http/http-error.js";
import { ReportsRepository } from "./reports.repository.js";
import type {
  DailyCancelledSaleRecord,
  DailyGrossSaleRecord,
  DailyRefundedPaymentRecord,
  DailySaleReturnRecord,
  ReportInventoryBatchRecord
} from "./reports.types.js";

const BOLIVIA_TIMEZONE = "America/La_Paz";
const BOLIVIA_UTC_OFFSET_HOURS = 4;
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

export type ReportsRepositoryPort = {
  listGrossSalesBetween(start: Date, end: Date): Promise<DailyGrossSaleRecord[]>;
  listCancelledSalesBetween(start: Date, end: Date): Promise<DailyCancelledSaleRecord[]>;
  listSaleReturnsBetween(start: Date, end: Date): Promise<DailySaleReturnRecord[]>;
  listRefundedPaymentsBetween(start: Date, end: Date): Promise<DailyRefundedPaymentRecord[]>;
  listAvailableInventoryBatches(filters?: { productId?: string; search?: string }): Promise<ReportInventoryBatchRecord[]>;
  listExpiringInventoryBatches(
    startDate: Date,
    endDate: Date,
    filters?: { productId?: string; search?: string }
  ): Promise<ReportInventoryBatchRecord[]>;
};

export class ReportsService {
  constructor(private readonly reportsRepository: ReportsRepositoryPort = new ReportsRepository()) {}

  async getDailySalesReport(query: DailySalesReportQuery): Promise<DailySalesReportResponse> {
    if (query.timezone !== BOLIVIA_TIMEZONE) {
      throw new HttpError(400, "Daily sales report only supports America/La_Paz timezone.", "UNSUPPORTED_TIMEZONE");
    }

    if (query.fromDate > query.toDate) {
      throw new HttpError(400, "fromDate must be less than or equal to toDate.", "INVALID_REPORT_DATE_RANGE");
    }

    const start = toBoliviaDayStartUtc(query.fromDate);
    const end = addUtcDays(toBoliviaDayStartUtc(query.toDate), 1);
    const rowsByDate = createEmptyRows(query.fromDate, query.toDate);
    const [grossSales, cancelledSales, saleReturns, refundedPayments] = await Promise.all([
      this.reportsRepository.listGrossSalesBetween(start, end),
      this.reportsRepository.listCancelledSalesBetween(start, end),
      this.reportsRepository.listSaleReturnsBetween(start, end),
      this.reportsRepository.listRefundedPaymentsBetween(start, end)
    ]);

    for (const sale of grossSales) {
      const row = rowsByDate.get(toBoliviaDateOnly(sale.confirmedAt));

      if (row) {
        row.grossSalesAmount = addMoney(row.grossSalesAmount, sale.totalAmount);
        row.saleCount += 1;
      }
    }

    for (const sale of cancelledSales) {
      const row = rowsByDate.get(toBoliviaDateOnly(sale.cancelledAt));

      if (row) {
        row.cancelledAmount = addMoney(row.cancelledAmount, sale.totalAmount);
        row.cancelledCount += 1;
      }
    }

    for (const saleReturn of saleReturns) {
      const row = rowsByDate.get(toBoliviaDateOnly(saleReturn.returnedAt));

      if (row) {
        row.returnedAmount = addMoney(row.returnedAmount, saleReturn.refundAmount);
        row.returnedCount += 1;
      }
    }

    for (const payment of refundedPayments) {
      if (payment.saleReturn) {
        continue;
      }

      const row = rowsByDate.get(toBoliviaDateOnly(payment.reversedAt));

      if (row) {
        row.returnedAmount = addMoney(row.returnedAmount, payment.refundAmount ?? payment.saleTotal);
        row.returnedCount += 1;
      }
    }

    const data = Array.from(rowsByDate.values()).map(finalizeRow);

    return {
      range: query,
      generatedAt: new Date().toISOString(),
      audited: false,
      data
    };
  }

  async getInventoryValuationReport(query: InventoryValuationReportQuery): Promise<InventoryValuationReportResponse> {
    ensureBoliviaTimezone(query.timezone, "Inventory valuation report");

    const batches = await this.reportsRepository.listAvailableInventoryBatches({
      productId: query.productId,
      search: query.search
    });
    const data = Array.from(groupInventoryValuationProducts(batches).values()).map(finalizeInventoryValuationProduct);
    const totalValue = data.reduce((total, product) => addMoney(total, product.totalValue), 0);

    return {
      generatedAt: new Date().toISOString(),
      timezone: query.timezone,
      audited: false,
      totalValue,
      data
    };
  }

  async getExpiringProductsReport(query: ExpiringProductsReportQuery): Promise<ExpiringProductsReportResponse> {
    ensureBoliviaTimezone(query.timezone, "Expiring products report");

    const today = getCurrentBoliviaDateOnly();
    const startDate = toUtcDateOnlyStart(today);
    const endDate = addUtcDays(toUtcDateOnlyStart(addDateOnlyDays(today, query.days)), 1);
    const batches = await this.reportsRepository.listExpiringInventoryBatches(startDate, endDate, {
      productId: query.productId,
      search: query.search
    });

    return {
      range: query,
      generatedAt: new Date().toISOString(),
      audited: false,
      data: batches.map((batch) => toExpiringProduct(batch, today))
    };
  }
}

function createEmptyRows(fromDate: string, toDate: string) {
  const rows = new Map<string, DailySalesReportRow>();
  const startTime = Date.parse(`${fromDate}T00:00:00.000Z`);
  const endTime = Date.parse(`${toDate}T00:00:00.000Z`);

  for (let time = startTime; time <= endTime; time += MILLISECONDS_PER_DAY) {
    const date = new Date(time).toISOString().slice(0, 10);

    rows.set(date, {
      date,
      grossSalesAmount: 0,
      cancelledAmount: 0,
      returnedAmount: 0,
      netSalesAmount: 0,
      saleCount: 0,
      cancelledCount: 0,
      returnedCount: 0
    });
  }

  return rows;
}

function finalizeRow(row: DailySalesReportRow): DailySalesReportRow {
  return {
    ...row,
    grossSalesAmount: toMoney(row.grossSalesAmount),
    cancelledAmount: toMoney(row.cancelledAmount),
    returnedAmount: toMoney(row.returnedAmount),
    netSalesAmount: toMoney(new Prisma.Decimal(row.grossSalesAmount).minus(row.cancelledAmount).minus(row.returnedAmount))
  };
}

function toBoliviaDayStartUtc(date: string) {
  return new Date(`${date}T0${BOLIVIA_UTC_OFFSET_HOURS}:00:00.000Z`);
}

function toBoliviaDateOnly(value: Date) {
  const boliviaTime = value.getTime() - BOLIVIA_UTC_OFFSET_HOURS * 60 * 60 * 1000;

  return new Date(boliviaTime).toISOString().slice(0, 10);
}

function addUtcDays(value: Date, days: number) {
  return new Date(value.getTime() + days * MILLISECONDS_PER_DAY);
}

function ensureBoliviaTimezone(timezone: string, reportName: string) {
  if (timezone !== BOLIVIA_TIMEZONE) {
    throw new HttpError(400, `${reportName} only supports America/La_Paz timezone.`, "UNSUPPORTED_TIMEZONE");
  }
}

function addMoney(current: number, value: Prisma.Decimal.Value) {
  return toMoney(new Prisma.Decimal(current).plus(value));
}

function toMoney(value: Prisma.Decimal.Value) {
  return Number(new Prisma.Decimal(value).toDecimalPlaces(2));
}

function groupInventoryValuationProducts(batches: ReportInventoryBatchRecord[]) {
  const products = new Map<string, InventoryValuationProduct>();

  for (const batch of batches) {
    const current = products.get(batch.productId);
    const lot = toInventoryValuationLot(batch);
    const totalAvailableQuantity = (current?.totalAvailableQuantity ?? 0) + lot.availableQuantity;
    const totalValue = addMoney(current?.totalValue ?? 0, lot.totalValue);

    products.set(batch.productId, {
      productId: batch.product.id,
      internalCode: batch.product.internalCode,
      commercialName: batch.product.commercialName,
      genericName: batch.product.genericName ?? undefined,
      baseUnit: batch.product.baseUnit,
      totalAvailableQuantity,
      totalValue,
      lots: [...(current?.lots ?? []), lot]
    });
  }

  return products;
}

function finalizeInventoryValuationProduct(product: InventoryValuationProduct): InventoryValuationProduct {
  return {
    ...product,
    totalAvailableQuantity: toQuantity(product.totalAvailableQuantity),
    totalValue: toMoney(product.totalValue),
    lots: product.lots.map((lot) => ({
      ...lot,
      availableQuantity: toQuantity(lot.availableQuantity),
      unitCostBase: toQuantity(lot.unitCostBase),
      totalValue: toMoney(lot.totalValue)
    }))
  };
}

function toInventoryValuationLot(batch: ReportInventoryBatchRecord) {
  const totalValue = toMoney(batch.availableQuantity.mul(batch.baseUnitCost));

  return {
    batchId: batch.id,
    batchNumber: batch.batchNumber ?? undefined,
    expirationDate: batch.expirationDate ? toDateOnly(batch.expirationDate) : undefined,
    availableQuantity: Number(batch.availableQuantity),
    unitCostBase: Number(batch.baseUnitCost),
    totalValue
  };
}

function toExpiringProduct(batch: ReportInventoryBatchRecord, today: string): ExpiringProduct {
  const expirationDate = batch.expirationDate ? toDateOnly(batch.expirationDate) : today;
  const totalValue = toMoney(batch.availableQuantity.mul(batch.baseUnitCost));

  return {
    productId: batch.product.id,
    internalCode: batch.product.internalCode,
    commercialName: batch.product.commercialName,
    genericName: batch.product.genericName ?? undefined,
    batchId: batch.id,
    batchNumber: batch.batchNumber ?? undefined,
    expirationDate,
    daysUntilExpiration: getDateOnlyDiffDays(today, expirationDate),
    availableQuantity: toQuantity(batch.availableQuantity),
    unitCostBase: toQuantity(batch.baseUnitCost),
    totalValue
  };
}

function getCurrentBoliviaDateOnly() {
  return toBoliviaDateOnly(new Date());
}

function toUtcDateOnlyStart(date: string) {
  return new Date(`${date}T00:00:00.000Z`);
}

function addDateOnlyDays(date: string, days: number) {
  return toDateOnly(addUtcDays(toUtcDateOnlyStart(date), days));
}

function getDateOnlyDiffDays(startDate: string, endDate: string) {
  return Math.round((toUtcDateOnlyStart(endDate).getTime() - toUtcDateOnlyStart(startDate).getTime()) / MILLISECONDS_PER_DAY);
}

function toDateOnly(value: Date) {
  return value.toISOString().slice(0, 10);
}

function toQuantity(value: Prisma.Decimal.Value) {
  return Number(new Prisma.Decimal(value).toDecimalPlaces(4));
}
