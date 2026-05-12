import type { PurchaseStatus } from "@pharmacy-pos/shared";

export type PurchaseStatusFilter = PurchaseStatus | "all";

export type PurchaseRequestStatus = "idle" | "loading" | "success" | "error";

export type PurchaseDraftItemForm = {
  batchNumber: string;
  expirationDate: string;
  productId: string;
  quantity: number;
  unitCost: number;
  unitId: string;
};

export type PurchaseDraftForm = {
  items: PurchaseDraftItemForm[];
  notes: string;
  purchaseDate: string;
  supplierId: string;
};

export const createEmptyPurchaseDraftItemForm = (): PurchaseDraftItemForm => ({
  batchNumber: "",
  expirationDate: "",
  productId: "",
  quantity: 1,
  unitCost: 0,
  unitId: ""
});

export const createEmptyPurchaseDraftForm = (): PurchaseDraftForm => ({
  items: [createEmptyPurchaseDraftItemForm()],
  notes: "",
  purchaseDate: new Date().toISOString().slice(0, 10),
  supplierId: ""
});
