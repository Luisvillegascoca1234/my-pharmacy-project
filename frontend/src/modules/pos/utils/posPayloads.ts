import {
  CreateSaleSchema,
  PosProductSearchQuerySchema,
  type CreateSale,
  type PosProductSearchQuery
} from "@pharmacy-pos/shared";
import type { PosCartItem } from "../types/posTypes";
import { normalizeNonNegativeMoney } from "./posMoney";

export function buildPosProductSearchQuery(query: PosProductSearchQuery): PosProductSearchQuery {
  return PosProductSearchQuerySchema.parse({
    ...query,
    code: query.code?.trim() || undefined,
    search: query.search?.trim() || undefined
  });
}

export function buildCreateSalePayload(items: PosCartItem[], receivedAmount: number): CreateSale {
  return CreateSaleSchema.parse({
    items: items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity
    })),
    payment: {
      method: "cash",
      receivedAmount: normalizeNonNegativeMoney(receivedAmount)
    }
  });
}
