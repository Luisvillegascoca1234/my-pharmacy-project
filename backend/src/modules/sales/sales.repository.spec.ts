import { Prisma } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SalesRepository } from "./sales.repository.js";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    inventoryMovement: {
      create: vi.fn()
    }
  }
}));

vi.mock("../../infrastructure/prisma/prisma.client.js", () => ({
  prisma: prismaMock
}));

describe("SalesRepository inventory movement persistence", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.inventoryMovement.create.mockResolvedValue({ id: "movement-1" });
  });

  it("creates auditable stock output movements for confirmed sales", async () => {
    const repository = new SalesRepository();

    await repository.createSaleInventoryMovement({
      actorUserId: "seller-1",
      batchId: "batch-1",
      productId: "product-1",
      quantityBase: new Prisma.Decimal(-2),
      unitCostBase: new Prisma.Decimal(3.5),
      referenceId: "sale-1",
      referenceItemId: "sale-item-1",
      reason: "Sale confirmed"
    });

    expect(prismaMock.inventoryMovement.create).toHaveBeenCalledWith({
      data: {
        actorUserId: "seller-1",
        batchId: "batch-1",
        productId: "product-1",
        type: "sale_confirmed",
        quantityBase: new Prisma.Decimal(-2),
        unitCostBase: new Prisma.Decimal(3.5),
        referenceType: "sale",
        referenceId: "sale-1",
        referenceItemId: "sale-item-1",
        reason: "Sale confirmed"
      },
      select: {
        id: true
      }
    });
  });
});
