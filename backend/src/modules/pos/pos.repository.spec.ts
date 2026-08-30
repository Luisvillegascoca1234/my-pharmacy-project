import { Prisma } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PosProductsRepository } from "./pos.repository.js";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    $transaction: vi.fn(async (operations: Promise<unknown>[]) => Promise.all(operations)),
    product: {
      count: vi.fn(),
      findMany: vi.fn()
    }
  }
}));

vi.mock("../../infrastructure/prisma/prisma.client.js", () => ({
  prisma: prismaMock
}));

describe("PosProductsRepository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.$transaction.mockImplementation(async (operations: Promise<unknown>[]) => Promise.all(operations));
    prismaMock.product.findMany.mockResolvedValue([]);
    prismaMock.product.count.mockResolvedValue(0);
  });

  it("searches every matching active product while selecting only saleable non-expired stock", async () => {
    const repository = new PosProductsRepository();
    const today = new Date("2026-05-31T00:00:00.000Z");

    await repository.searchProducts({
      page: 1,
      pageSize: 20,
      search: "para",
      today
    });

    const findManyInput = prismaMock.product.findMany.mock.calls[0][0] as Prisma.ProductFindManyArgs;
    const countInput = prismaMock.product.count.mock.calls[0][0] as Prisma.ProductCountArgs;
    const selectedBatches = findManyInput.select?.inventoryBatches;
    const saleableBatchWhere = selectedBatches && typeof selectedBatches === "object"
      ? selectedBatches.where
      : undefined;

    expect(findManyInput.where).toEqual(
      expect.objectContaining({
        status: "active"
      })
    );
    expect(findManyInput.where).not.toHaveProperty("inventoryBatches");
    expect(countInput.where).toEqual(findManyInput.where);
    expect(saleableBatchWhere).toEqual(expect.objectContaining({
      status: "active",
      OR: [{ expirationDate: null }, { expirationDate: { gte: today } }]
    }));
    expect(saleableBatchWhere?.availableQuantity).toEqual({
      gt: expect.any(Prisma.Decimal)
    });
    expect((saleableBatchWhere?.availableQuantity as { gt: Prisma.Decimal }).gt.equals(0)).toBe(true);
    expect(selectedBatches).toEqual(
      expect.objectContaining({
        where: saleableBatchWhere
      })
    );
  });
});
