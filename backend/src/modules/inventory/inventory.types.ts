import type { InventoryBatch, Prisma, PurchaseItem } from "@prisma/client";

export type InventoryTransactionClient = Prisma.TransactionClient;

export type AuditContext = {
  actorUserId?: string;
  ipAddress?: string;
  userAgent?: string;
};

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
  type: "purchase_received" | "purchase_cancelled" | "inventory_adjustment";
  quantityBase: Prisma.Decimal;
  unitCostBase: Prisma.Decimal;
  referenceType: "purchase" | "inventory_adjustment";
  referenceId: string;
  referenceItemId?: string | null;
  actorUserId?: string;
  reason: string;
};

export type CreateInventoryAdjustmentData = {
  batchId: string;
  productId: string;
  previousQuantity: Prisma.Decimal;
  countedQuantity: Prisma.Decimal;
  differenceQuantity: Prisma.Decimal;
  reason: string;
  actorUserId?: string;
};

export type InventoryBatchWithPurchaseItem = InventoryBatch & {
  purchaseItem: PurchaseInventoryItem;
};

export type InventoryProductRecord = {
  id: string;
  internalCode: string;
  commercialName: string;
  genericName: string | null;
  minimumStock: Prisma.Decimal;
  baseUnit: {
    id: string;
    name: string;
    abbreviation: string;
  };
};

export type InventoryBatchRecord = InventoryBatch & {
  product: InventoryProductRecord;
  purchaseItem: {
    id: string;
    purchaseId: string;
    purchase: {
      supplier: {
        businessName: string;
      };
    };
  };
};

export type InventoryMovementRecord = {
  id: string;
  batchId: string;
  productId: string;
  product: InventoryProductRecord;
  batch: Pick<InventoryBatch, "batchNumber" | "expirationDate">;
  type: "purchase_received" | "purchase_cancelled" | "inventory_adjustment";
  quantityBase: Prisma.Decimal;
  unitCostBase: Prisma.Decimal;
  referenceType: string;
  referenceId: string;
  referenceItemId: string | null;
  actorUser: {
    id: string;
    fullName: string;
    email: string;
  } | null;
  reason: string | null;
  createdAt: Date;
};

export type InventoryMovementFilters = {
  search?: string;
  productId?: string;
  type?: "purchase_received" | "purchase_cancelled" | "inventory_adjustment";
  fromDate?: string;
  toDate?: string;
  page: number;
  pageSize: number;
};

export type InventoryMovementListResult = {
  data: InventoryMovementRecord[];
  total: number;
};
