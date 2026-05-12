import {
  CancelPurchaseSchema,
  CreatePurchaseSchema,
  ReceivePurchaseSchema,
  UpdatePurchaseSchema,
  type CancelPurchase,
  type CreatePurchase,
  type Purchase,
  type ReceivePurchase,
  type UpdatePurchase
} from "@pharmacy-pos/shared";
import { createEmptyPurchaseDraftForm, type PurchaseDraftForm, type PurchaseDraftItemForm } from "../types/purchasesTypes";

function normalizeOptionalDate(value?: string): string | undefined {
  return value?.trim() || undefined;
}

function createPurchaseDraftItemFromPurchase(item: Purchase["items"][number]): PurchaseDraftItemForm {
  return {
    batchNumber: item.batchNumber ?? "",
    expirationDate: item.expirationDate ?? "",
    productId: item.productId,
    quantity: item.quantity,
    unitCost: item.unitCost,
    unitId: item.unitId
  };
}

export function createPurchaseDraftFromPurchase(purchase: Purchase): PurchaseDraftForm {
  return {
    items: purchase.items.map(createPurchaseDraftItemFromPurchase),
    notes: purchase.notes ?? "",
    purchaseDate: purchase.purchaseDate,
    supplierId: purchase.supplierId
  };
}

export function buildCreatePurchasePayload(input: CreatePurchase | PurchaseDraftForm): CreatePurchase {
  return CreatePurchaseSchema.parse({
    ...input,
    items: input.items.map((item) => ({
      ...item,
      expirationDate: normalizeOptionalDate(item.expirationDate)
    }))
  });
}

export function buildUpdatePurchasePayload(input: UpdatePurchase | PurchaseDraftForm): UpdatePurchase {
  return UpdatePurchaseSchema.parse({
    ...input,
    items: input.items.map((item) => ({
      ...item,
      expirationDate: normalizeOptionalDate(item.expirationDate)
    }))
  });
}

export function buildReceivePurchasePayload(input: ReceivePurchase): ReceivePurchase {
  return ReceivePurchaseSchema.parse(input);
}

export function buildCancelPurchasePayload(input: CancelPurchase): CancelPurchase {
  return CancelPurchaseSchema.parse(input);
}
