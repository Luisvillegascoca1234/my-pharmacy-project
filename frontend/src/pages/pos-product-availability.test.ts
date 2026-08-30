import { describe, expect, it } from "vitest";
import type { PosProduct } from "@pharmacy-pos/shared";
import { getPosProductAvailability } from "./pos-product-availability";

describe("POS product availability presentation", () => {
  it("identifies a catalog product without saleable stock as out of stock", () => {
    expect(getPosProductAvailability(makeProduct({ saleableStock: 0 }))).toEqual({
      actionLabel: "Sin existencias",
      description: "Producto registrado, temporalmente sin existencias.",
      isOutOfStock: true,
      stockLabel: "Agotado"
    });
  });

  it("keeps a product with saleable stock available to add", () => {
    expect(getPosProductAvailability(makeProduct({ saleableStock: 12 }))).toEqual({
      actionLabel: "Agregar",
      description: null,
      isOutOfStock: false,
      stockLabel: "12 CAP"
    });
  });
});

function makeProduct(overrides: Partial<PosProduct> = {}): PosProduct {
  return {
    id: "product-1",
    internalCode: "PRD-0001",
    commercialName: "Amoxicilina 500 mg comprimidos",
    salePrice: 24,
    baseUnit: {
      id: "unit-1",
      name: "Cápsula",
      abbreviation: "CAP"
    },
    saleableStock: 5,
    ...overrides
  };
}
