import type {
  CancelPurchase,
  CreatePurchase,
  Purchase,
  PurchasesListResponse,
  PurchasesQuery,
  ReceivePurchase,
  UpdatePurchase
} from "@pharmacy-pos/shared";
import { PurchasesQuerySchema } from "@pharmacy-pos/shared";
import { purchasesApi } from "../api/purchases-api";
import {
  buildCancelPurchasePayload,
  buildCreatePurchasePayload,
  buildReceivePurchasePayload,
  buildUpdatePurchasePayload
} from "../utils/purchasePayloads";

export const purchasesFacade = {
  getAll(query: PurchasesQuery, signal?: AbortSignal): Promise<PurchasesListResponse> {
    return purchasesApi.listPurchases(PurchasesQuerySchema.parse(query), signal);
  },

  getById(purchaseId: string, signal?: AbortSignal): Promise<Purchase> {
    return purchasesApi.getPurchase(purchaseId, signal);
  },

  create(input: CreatePurchase): Promise<Purchase> {
    return purchasesApi.createPurchase(buildCreatePurchasePayload(input));
  },

  update(purchaseId: string, input: UpdatePurchase): Promise<Purchase> {
    return purchasesApi.updatePurchase(purchaseId, buildUpdatePurchasePayload(input));
  },

  receive(purchaseId: string, input: ReceivePurchase): Promise<Purchase> {
    return purchasesApi.receivePurchase(purchaseId, buildReceivePurchasePayload(input));
  },

  cancel(purchaseId: string, input: CancelPurchase): Promise<Purchase> {
    return purchasesApi.cancelPurchase(purchaseId, buildCancelPurchasePayload(input));
  }
};
