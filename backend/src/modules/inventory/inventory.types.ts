import type { InventoryBatch, Prisma, PurchaseItem } from "@prisma/client";

export type InventoryTransactionClient = Prisma.TransactionClient;

export type PurchaseInventoryItem = Pick<
  PurchaseItem,
  | "id"
  | "productId"
  | "baseQuantity"
  | "baseUnitCost"
  | "isInventoryTracked"
  | "batchNumber"
  | "expirationDate"
>;

export type CreatePurchaseInventoryLayersInput = {
  purchaseId: string;
  actorUserId?: string;
  items: PurchaseInventoryItem[];
};

export type CancelPurchaseInventoryLayersInput = {
  purchaseId: string;
  actorUserId?: string;
  items: PurchaseInventoryItem[];
};

export type CreateInventoryBatchData = {
  purchaseItemId: string;
  productId: string;
  originalQuantity: Prisma.Decimal;
  availableQuantity: Prisma.Decimal;
  baseUnitCost: Prisma.Decimal;
  batchNumber: string | null;
  expirationDate: Date | null;
};

export type CreateInventoryMovementData = {
  batchId: string;
  productId: string;
  type: "purchase_received" | "purchase_cancelled";
  quantityBase: Prisma.Decimal;
  unitCostBase: Prisma.Decimal;
  referenceType: "purchase";
  referenceId: string;
  referenceItemId: string;
  actorUserId?: string;
  reason: "Purchase received" | "Purchase cancelled";
};

export type InventoryBatchWithPurchaseItem = InventoryBatch & {
  purchaseItem: PurchaseInventoryItem;
};
