import { beforeEach, describe, expect, it, vi } from "vitest";
import { StockPlanningParquetRepository } from "./stock-planning-parquet.repository.js";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    auditLog: { create: vi.fn() },
    product: { count: vi.fn(), findMany: vi.fn() },
    stockPlanningConfiguration: { findFirst: vi.fn() },
    stockPlanningExecution: { findFirst: vi.fn() },
    stockPlanningDemandPoint: { findMany: vi.fn() },
    inventorySnapshot: { findMany: vi.fn() },
    stockPlanningForecast: { findMany: vi.fn() }
  }
}));

vi.mock("../../infrastructure/prisma/prisma.client.js", () => ({
  prisma: prismaMock
}));

describe("StockPlanningParquetRepository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.product.count.mockResolvedValue(0);
    prismaMock.product.findMany.mockResolvedValue([]);
    prismaMock.auditLog.create.mockResolvedValue({ id: "audit-1" });
  });

  it("applies product, category and supplier filters to the row pre-count and data query", async () => {
    const repository = new StockPlanningParquetRepository();
    const filters = {
      fromDate: "2026-01-01",
      toDate: "2026-12-31",
      productId: "product-1",
      categoryId: "category-1",
      supplierId: "supplier-1"
    };

    await repository.countProducts(filters);
    await repository.listProducts(filters);

    const expectedWhere = {
      id: "product-1",
      categoryId: "category-1",
      supplierId: "supplier-1"
    };
    expect(prismaMock.product.count).toHaveBeenCalledWith({ where: expectedWhere });
    expect(prismaMock.product.findMany.mock.calls[0][0].where).toEqual(expectedWhere);
    expect(prismaMock.product.findMany.mock.calls[0][0].where.status).toBeUndefined();
  });

  it("records archivo generado with filters, schema, compression and actor metadata", async () => {
    const repository = new StockPlanningParquetRepository();

    await repository.createGeneratedFileAuditLog({
      dataset: "prediction_results",
      fileName: "stock-planning-predictions.parquet",
      filters: {
        fromDate: "2026-07-01",
        toDate: "2026-07-31",
        executionId: "execution-1"
      },
      rowCount: 31,
      schemaVersion: "1.0.0",
      compression: "ZSTD",
      context: {
        actorUserId: "admin-1",
        ipAddress: "127.0.0.1",
        userAgent: "vitest"
      }
    });

    expect(prismaMock.auditLog.create).toHaveBeenCalledWith({
      data: {
        action: "STOCK_PLANNING_FILE_GENERATED",
        actorUserId: "admin-1",
        entityType: "stock_planning_export",
        entityId: "stock-planning-predictions.parquet",
        metadata: {
          event: "archivo generado",
          dataset: "prediction_results",
          fileName: "stock-planning-predictions.parquet",
          filters: {
            fromDate: "2026-07-01",
            toDate: "2026-07-31",
            executionId: "execution-1"
          },
          rowCount: 31,
          schemaVersion: "1.0.0",
          compression: "ZSTD"
        },
        ipAddress: "127.0.0.1",
        userAgent: "vitest"
      }
    });
  });
});

