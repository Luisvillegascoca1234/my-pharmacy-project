import { Prisma } from "@prisma/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ExpiringProductsReportQuerySchema } from "@pharmacy-pos/shared";
import { expectHttpError } from "../../tests/utils/http-error.js";
import { canReadReports } from "./reports.routes.js";
import { ReportsService, type ReportsRepositoryPort } from "./reports.service.js";
import type {
  DailyCancelledSaleRecord,
  DailyGrossSaleRecord,
  DailyRefundedPaymentRecord,
  DailySaleReturnRecord,
  ReportInventoryBatchRecord
} from "./reports.types.js";

describe("ReportsService inventory reports", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("groups available batch valuation by product with lot detail", async () => {
    const repository = new FakeReportsRepository();
    repository.availableInventoryBatches = [
      makeBatch({ id: "batch-1", productId: "product-1", availableQuantity: 10, baseUnitCost: 2.5 }),
      makeBatch({
        id: "batch-2",
        productId: "product-1",
        availableQuantity: 4,
        baseUnitCost: 3,
        batchNumber: "LOT-002"
      }),
      makeBatch({
        id: "batch-3",
        productId: "product-2",
        internalCode: "MED-002",
        commercialName: "Ibuprofeno 400 mg",
        availableQuantity: 2,
        baseUnitCost: 1.25
      })
    ];
    const service = new ReportsService(repository);

    const report = await service.getInventoryValuationReport({ timezone: "America/La_Paz" });

    expect(report).toEqual(
      expect.objectContaining({
        timezone: "America/La_Paz",
        audited: false,
        totalValue: 39.5
      })
    );
    expect(report.data).toEqual([
      expect.objectContaining({
        productId: "product-1",
        totalAvailableQuantity: 14,
        totalValue: 37,
        lots: [
          expect.objectContaining({
            batchId: "batch-1",
            availableQuantity: 10,
            unitCostBase: 2.5,
            totalValue: 25
          }),
          expect.objectContaining({
            batchId: "batch-2",
            batchNumber: "LOT-002",
            availableQuantity: 4,
            unitCostBase: 3,
            totalValue: 12
          })
        ]
      }),
      expect.objectContaining({
        productId: "product-2",
        totalAvailableQuantity: 2,
        totalValue: 2.5
      })
    ]);
  });

  it("does not receive exhausted or cancelled batches from the repository valuation query", async () => {
    const repository = new FakeReportsRepository();
    repository.availableInventoryBatches = [
      makeBatch({ id: "active-batch", availableQuantity: 8, baseUnitCost: 1.5 })
    ];
    const service = new ReportsService(repository);

    const report = await service.getInventoryValuationReport({ timezone: "America/La_Paz" });

    expect(report.data).toEqual([
      expect.objectContaining({
        lots: [expect.objectContaining({ batchId: "active-batch", availableQuantity: 8, totalValue: 12 })],
        totalAvailableQuantity: 8,
        totalValue: 12
      })
    ]);
  });

  it("uses Bolivia operational date and query days for expiring products", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-25T13:00:00.000Z"));

    const repository = new FakeReportsRepository();
    repository.expiringInventoryBatches = [
      makeBatch({
        id: "batch-expiring",
        availableQuantity: 3,
        baseUnitCost: 4,
        expirationDate: new Date("2026-07-05T00:00:00.000Z")
      })
    ];
    const service = new ReportsService(repository);

    const report = await service.getExpiringProductsReport({ days: 10, timezone: "America/La_Paz" });

    expect(repository.lastExpiringRange).toEqual({
      startDate: new Date("2026-06-25T00:00:00.000Z"),
      endDate: new Date("2026-07-06T00:00:00.000Z")
    });
    expect(report).toEqual(
      expect.objectContaining({
        range: { days: 10, timezone: "America/La_Paz" },
        audited: false,
        data: [
          expect.objectContaining({
            batchId: "batch-expiring",
            expirationDate: "2026-07-05",
            daysUntilExpiration: 10,
            availableQuantity: 3,
            unitCostBase: 4,
            totalValue: 12
          })
        ]
      })
    );
  });

  it("uses the shared default days parameter for expiring products", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-25T13:00:00.000Z"));

    const repository = new FakeReportsRepository();
    const service = new ReportsService(repository);
    const query = ExpiringProductsReportQuerySchema.parse({});

    const report = await service.getExpiringProductsReport(query);

    expect(query).toEqual({ days: 30, timezone: "America/La_Paz" });
    expect(repository.lastExpiringRange).toEqual({
      startDate: new Date("2026-06-25T00:00:00.000Z"),
      endDate: new Date("2026-07-26T00:00:00.000Z")
    });
    expect(report.range).toEqual({ days: 30, timezone: "America/La_Paz" });
    expect(report.audited).toBe(false);
  });
});

describe("ReportsService daily sales report", () => {
  it("subtracts cancelled sales and returns from confirmed gross sales without audit side effects", async () => {
    const repository = new FakeReportsRepository();
    repository.grossSales = [
      makeGrossSale({ id: "sale-confirmed", totalAmount: decimal(100) }),
      makeGrossSale({ id: "sale-cancelled", totalAmount: decimal(50) })
    ];
    repository.cancelledSales = [makeCancelledSale({ id: "sale-cancelled", totalAmount: decimal(50) })];
    repository.saleReturns = [makeSaleReturn({ id: "return-1", refundAmount: decimal(20) })];
    repository.refundedPayments = [
      makeRefundedPayment({ id: "payment-with-return", refundAmount: decimal(20), saleReturn: { id: "return-1" } }),
      makeRefundedPayment({ id: "standalone-refund", refundAmount: decimal(10), saleReturn: null })
    ];
    const service = new ReportsService(repository);

    const report = await service.getDailySalesReport({
      fromDate: "2026-06-25",
      toDate: "2026-06-25",
      timezone: "America/La_Paz"
    });

    expect(report.audited).toBe(false);
    expect(report.data).toEqual([
      {
        date: "2026-06-25",
        grossSalesAmount: 150,
        cancelledAmount: 50,
        returnedAmount: 30,
        netSalesAmount: 70,
        saleCount: 2,
        cancelledCount: 1,
        returnedCount: 2
      }
    ]);
  });
});

describe("Reports routes permissions", () => {
  it.each(["admin", "superadmin"])("allows %s to read reports", (roleName) => {
    const request = makeRoleRequest(roleName);
    const next = createNextSpy();

    canReadReports(request, {} as never, next);

    expect(next.calls).toEqual([undefined]);
  });

  it("blocks seller from reports before controller execution", () => {
    const request = makeRoleRequest("seller");
    const next = createNextSpy();

    canReadReports(request, {} as never, next);

    expect(next.calls).toHaveLength(1);
    expectHttpError(next.calls[0], {
      code: "FORBIDDEN",
      statusCode: 403
    });
  });
});

class FakeReportsRepository implements ReportsRepositoryPort {
  grossSales: DailyGrossSaleRecord[] = [];
  cancelledSales: DailyCancelledSaleRecord[] = [];
  saleReturns: DailySaleReturnRecord[] = [];
  refundedPayments: DailyRefundedPaymentRecord[] = [];
  availableInventoryBatches: ReportInventoryBatchRecord[] = [];
  expiringInventoryBatches: ReportInventoryBatchRecord[] = [];
  lastExpiringRange?: { startDate: Date; endDate: Date };

  listGrossSalesBetween(): Promise<DailyGrossSaleRecord[]> {
    return Promise.resolve(this.grossSales);
  }

  listCancelledSalesBetween(): Promise<DailyCancelledSaleRecord[]> {
    return Promise.resolve(this.cancelledSales);
  }

  listSaleReturnsBetween(): Promise<DailySaleReturnRecord[]> {
    return Promise.resolve(this.saleReturns);
  }

  listRefundedPaymentsBetween(): Promise<DailyRefundedPaymentRecord[]> {
    return Promise.resolve(this.refundedPayments);
  }

  listAvailableInventoryBatches(): Promise<ReportInventoryBatchRecord[]> {
    return Promise.resolve(this.availableInventoryBatches);
  }

  listExpiringInventoryBatches(startDate: Date, endDate: Date): Promise<ReportInventoryBatchRecord[]> {
    this.lastExpiringRange = { startDate, endDate };
    return Promise.resolve(this.expiringInventoryBatches);
  }
}

function makeBatch(
  overrides: Partial<Omit<ReportInventoryBatchRecord, "availableQuantity" | "baseUnitCost" | "product">> & {
    availableQuantity?: Prisma.Decimal.Value;
    baseUnitCost?: Prisma.Decimal.Value;
    internalCode?: string;
    commercialName?: string;
  } = {}
): ReportInventoryBatchRecord {
  const productId = overrides.productId ?? "product-1";

  return {
    id: overrides.id ?? "batch-1",
    productId,
    availableQuantity: decimal(overrides.availableQuantity ?? 1),
    baseUnitCost: decimal(overrides.baseUnitCost ?? 1),
    batchNumber: overrides.batchNumber ?? "LOT-001",
    expirationDate: overrides.expirationDate ?? new Date("2026-12-31T00:00:00.000Z"),
    createdAt: overrides.createdAt ?? new Date("2026-01-01T00:00:00.000Z"),
    product: {
      id: productId,
      internalCode: overrides.internalCode ?? "MED-001",
      commercialName: overrides.commercialName ?? "Paracetamol 500 mg",
      genericName: null,
      baseUnit: {
        id: "unit-1",
        name: "Comprimido",
        abbreviation: "comp"
      }
    }
  };
}

function decimal(value: Prisma.Decimal.Value) {
  return new Prisma.Decimal(value);
}

function makeGrossSale(overrides: Partial<DailyGrossSaleRecord> = {}): DailyGrossSaleRecord {
  return {
    id: overrides.id ?? "sale-1",
    confirmedAt: overrides.confirmedAt ?? new Date("2026-06-25T14:00:00.000Z"),
    totalAmount: decimal(overrides.totalAmount ?? 100)
  };
}

function makeCancelledSale(overrides: Partial<DailyCancelledSaleRecord> = {}): DailyCancelledSaleRecord {
  return {
    id: overrides.id ?? "sale-cancelled",
    cancelledAt: overrides.cancelledAt ?? new Date("2026-06-25T15:00:00.000Z"),
    totalAmount: decimal(overrides.totalAmount ?? 50)
  };
}

function makeSaleReturn(overrides: Partial<DailySaleReturnRecord> = {}): DailySaleReturnRecord {
  return {
    id: overrides.id ?? "return-1",
    returnedAt: overrides.returnedAt ?? new Date("2026-06-25T16:00:00.000Z"),
    refundAmount: decimal(overrides.refundAmount ?? 20)
  };
}

function makeRefundedPayment(overrides: Partial<DailyRefundedPaymentRecord> = {}): DailyRefundedPaymentRecord {
  return {
    id: overrides.id ?? "payment-1",
    reversedAt: overrides.reversedAt ?? new Date("2026-06-25T17:00:00.000Z"),
    refundAmount: overrides.refundAmount === null ? null : decimal(overrides.refundAmount ?? 10),
    saleTotal: decimal(overrides.saleTotal ?? 10),
    saleReturn: overrides.saleReturn === undefined ? null : overrides.saleReturn
  };
}

function makeRoleRequest(roleName: string) {
  return {
    authenticatedUser: {
      id: `${roleName}-1`,
      fullName: roleName,
      email: `${roleName}@example.com`,
      status: "active",
      role: {
        id: `${roleName}-role`,
        name: roleName
      }
    }
  } as never;
}

function createNextSpy() {
  const next = ((error?: unknown) => {
    next.calls.push(error);
  }) as ((error?: unknown) => void) & { calls: unknown[] };

  next.calls = [];

  return next;
}
