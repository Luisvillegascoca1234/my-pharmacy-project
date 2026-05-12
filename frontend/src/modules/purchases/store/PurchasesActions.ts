import type { CancelPurchase, CreatePurchase, Purchase, ReceivePurchase, UpdatePurchase } from "@pharmacy-pos/shared";
import type { PurchaseDraftForm, PurchaseDraftItemForm, PurchaseStatusFilter } from "../types/purchasesTypes";

export type PurchasesActions = {
  addDraftItem: () => void;
  cancelPurchase: (purchaseId: string, input: CancelPurchase) => Promise<Purchase | null>;
  createPurchase: (input?: CreatePurchase) => Promise<Purchase | null>;
  loadPurchase: (purchaseId: string, signal?: AbortSignal) => Promise<Purchase | null>;
  loadPurchases: (signal?: AbortSignal) => Promise<void>;
  receivePurchase: (purchaseId: string, input: ReceivePurchase) => Promise<Purchase | null>;
  removeDraftItem: (index: number) => void;
  reset: () => void;
  resetDraftForm: () => void;
  saveDraftForm: (purchaseId?: string) => Promise<Purchase | null>;
  setDraftField: <Field extends keyof PurchaseDraftForm>(field: Field, value: PurchaseDraftForm[Field]) => void;
  setDraftItemField: <Field extends keyof PurchaseDraftItemForm>(index: number, field: Field, value: PurchaseDraftItemForm[Field]) => void;
  setFromDate: (fromDate: string) => void;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  setSearch: (search: string) => void;
  setStatus: (status: PurchaseStatusFilter) => void;
  setSupplierId: (supplierId: string) => void;
  setToDate: (toDate: string) => void;
  updatePurchase: (purchaseId: string, input?: UpdatePurchase) => Promise<Purchase | null>;
};
