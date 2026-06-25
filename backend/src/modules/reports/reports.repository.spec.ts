import { Prisma } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ReportsRepository } from "./reports.repository.js";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    inventoryBatch: {
      findMany: vi.fn()
    },
    payment: {
      findMany: vi.fn()
    },
    sale: {
      findMany: vi.fn()
    },
    saleReturn: {
      findMany: vi.fn()
    }
  }
}));

vi.mock("../../infrastructure/prisma/prisma.client.js", () => ({
  prisma: prismaMock
}));

describe("ReportsRepository inventory reports", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.inventoryBatch.findMany.mockResolvedValue([]);
  });

  it("lists only active inventory batches with available quantity for valuation", async () => {
    const repository = new ReportsRepository();

    await repository.listAvailableInventoryBatches({ search: "para", productId: "product-1" });

    const findManyInput = prismaMock.inventoryBatch.findMany.mock.calls[0][0] as Prisma.InventoryBatchFindManyArgs;

    expect(findManyInput.where).toEqual(
      expect.objectContaining({
        productId: "product-1",
        status: "active",
        availableQuantity: {
          gt: expect.any(Prisma.Decimal)
        }
      })
    );
    expect((findManyInput.where?.availableQuantity as { gt: Prisma.Decimal }).gt.equals(0)).toBe(true);
    expect(findManyInput.where?.OR).toEqual([
      { batchNumber: { contains: "para", mode: "insensitive" } },
      { product: { commercialName: { contains: "para", mode: "insensitive" } } },
      { product: { genericName: { contains: "para", mode: "insensitive" } } },
      { product: { internalCode: { contains: "para", mode: "insensitive" } } }
    ]);
  });

  it("restricts expiring products to the requested date window", async () => {
    const repository = new ReportsRepository();
    const startDate = new Date("2026-06-25T00:00:00.000Z");
    const endDate = new Date("2026-07-26T00:00:00.000Z");

    await repository.listExpiringInventoryBatches(startDate, endDate);

    const findManyInput = prismaMock.inventoryBatch.findMany.mock.calls[0][0] as Prisma.InventoryBatchFindManyArgs;

    expect(findManyInput.where).toEqual(
      expect.objectContaining({
        status: "active",
        availableQuantity: {
          gt: expect.any(Prisma.Decimal)
        },
        expirationDate: {
          gte: startDate,
          lt: endDate
        }
      })
    );
  });
});

describe("ReportsRepository daily sales report", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.payment.findMany.mockResolvedValue([]);
    prismaMock.sale.findMany.mockResolvedValue([]);
    prismaMock.saleReturn.findMany.mockResolvedValue([]);
  });

  it("queries gross, cancelled, returned and refunded values with inclusive date filters", async () => {
    const repository = new ReportsRepository();
    const start = new Date("2026-06-25T04:00:00.000Z");
    const end = new Date("2026-06-26T04:00:00.000Z");

    await repository.listGrossSalesBetween(start, end);
    await repository.listCancelledSalesBetween(start, end);
    await repository.listSaleReturnsBetween(start, end);
    await repository.listRefundedPaymentsBetween(start, end);

    expect(prismaMock.sale.findMany.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        where: {
          confirmedAt: {
            gte: start,
            lt: end
          }
        }
      })
    );
    expect(prismaMock.sale.findMany.mock.calls[1][0]).toEqual(
      expect.objectContaining({
        where: {
          status: "cancelled",
          cancelledAt: {
            gte: start,
            lt: end
          }
        }
      })
    );
    expect(prismaMock.saleReturn.findMany.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        where: {
          returnedAt: {
            gte: start,
            lt: end
          }
        }
      })
    );
    expect(prismaMock.payment.findMany.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        where: {
          status: "refunded",
          reversedAt: {
            gte: start,
            lt: end
          }
        }
      })
    );
  });
});
