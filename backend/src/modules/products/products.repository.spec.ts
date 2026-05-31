import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProductsRepository } from "./products.repository.js";

const { prismaMock, txMock } = vi.hoisted(() => {
  const tx = {
    product: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn()
    },
    productUnit: {
      upsert: vi.fn()
    }
  };

  return {
    txMock: tx,
    prismaMock: {
      $transaction: vi.fn((callback: (client: typeof tx) => unknown) => callback(tx)),
      product: {
        findUnique: vi.fn()
      },
      productUnit: {
        upsert: vi.fn()
      }
    }
  };
});

vi.mock("../../infrastructure/prisma/prisma.client.js", () => ({
  prisma: prismaMock
}));

const productRecord = {
  id: "product-1",
  baseUnitId: "unit-base",
  units: [
    {
      productId: "product-1",
      unitId: "unit-base",
      conversionFactor: 1
    }
  ]
};

describe("ProductsRepository base unit invariant", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.$transaction.mockImplementation((callback: (client: typeof txMock) => unknown) => callback(txMock));
    txMock.product.findUnique.mockResolvedValue(productRecord);
  });

  it("creates the base product unit with factor one when creating a product", async () => {
    txMock.product.create.mockResolvedValue({ id: "product-1", baseUnitId: "unit-base" });
    const repository = new ProductsRepository();

    const product = await repository.createProduct({
      baseUnitId: "unit-base",
      categoryId: "category-1",
      commercialName: "Paracetamol",
      internalCode: "MED-000001",
      salePrice: 12.5,
      supplierId: "supplier-1",
      type: "medicine"
    });

    expect(txMock.productUnit.upsert).toHaveBeenCalledWith({
      where: {
        productId_unitId: {
          productId: "product-1",
          unitId: "unit-base"
        }
      },
      create: {
        productId: "product-1",
        unitId: "unit-base",
        conversionFactor: 1
      },
      update: {
        conversionFactor: 1
      }
    });
    expect(product).toBe(productRecord);
  });

  it("normalizes the current base product unit when updating a product", async () => {
    txMock.product.update.mockResolvedValue({ id: "product-1", baseUnitId: "unit-base" });
    const repository = new ProductsRepository();

    await repository.updateProduct("product-1", {
      baseUnitId: "unit-base"
    });

    expect(txMock.productUnit.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          conversionFactor: 1,
          productId: "product-1",
          unitId: "unit-base"
        }),
        update: {
          conversionFactor: 1
        }
      })
    );
  });
});
