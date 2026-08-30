import type { PosProduct } from "@pharmacy-pos/shared";

export type PosProductAvailabilityPresentation = {
  actionLabel: string;
  description: string | null;
  isOutOfStock: boolean;
  stockLabel: string;
};

export function getPosProductAvailability(product: PosProduct): PosProductAvailabilityPresentation {
  if (product.saleableStock <= 0) {
    return {
      actionLabel: "Sin existencias",
      description: "Producto registrado, temporalmente sin existencias.",
      isOutOfStock: true,
      stockLabel: "Agotado"
    };
  }

  return {
    actionLabel: "Agregar",
    description: null,
    isOutOfStock: false,
    stockLabel: `${product.saleableStock} ${product.baseUnit.abbreviation}`
  };
}
