import type { PosProduct } from "@pharmacy-pos/shared";
import type { PosCartItem, PosCartTotals } from "../types/posTypes";
import { multiplyMoney, normalizeNonNegativeMoney, normalizePositiveInteger } from "./posMoney";

export const emptyPosCartTotals: PosCartTotals = {
  itemCount: 0,
  totalAmount: 0,
  totalQuantity: 0
};

export function createPosCartItem(product: PosProduct, quantity = 1): PosCartItem {
  const normalizedQuantity = normalizePositiveInteger(quantity);
  const unitPrice = normalizeNonNegativeMoney(product.salePrice);

  return {
    barcode: product.barcode,
    baseUnit: product.baseUnit,
    commercialName: product.commercialName,
    genericName: product.genericName,
    internalCode: product.internalCode,
    nextExpirationDate: product.nextExpirationDate,
    productId: product.id,
    quantity: normalizedQuantity,
    saleableStock: product.saleableStock,
    subtotal: multiplyMoney(unitPrice, normalizedQuantity),
    unitPrice
  };
}

export function updatePosCartItemQuantity(item: PosCartItem, quantity: number): PosCartItem {
  const normalizedQuantity = normalizePositiveInteger(quantity);

  return {
    ...item,
    quantity: normalizedQuantity,
    subtotal: multiplyMoney(item.unitPrice, normalizedQuantity)
  };
}

export function calculatePosCartTotals(items: PosCartItem[]): PosCartTotals {
  if (items.length === 0) {
    return emptyPosCartTotals;
  }

  return {
    itemCount: items.length,
    totalAmount: normalizeNonNegativeMoney(items.reduce((total, item) => total + item.subtotal, 0)),
    totalQuantity: items.reduce((total, item) => total + item.quantity, 0)
  };
}
