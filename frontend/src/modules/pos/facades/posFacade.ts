import type { PosProductSearchQuery, PosProductsListResponse, Sale } from "@pharmacy-pos/shared";
import type { PosCartItem } from "../types/posTypes";
import { posApi } from "../api/pos-api";
import { buildCreateSalePayload, buildPosProductSearchQuery } from "../utils/posPayloads";

export const posFacade = {
  searchProducts(query: PosProductSearchQuery, signal?: AbortSignal): Promise<PosProductsListResponse> {
    return posApi.searchProducts(buildPosProductSearchQuery(query), signal);
  },

  confirmCashSale(items: PosCartItem[], receivedAmount: number): Promise<Sale> {
    return posApi.createCashSale(buildCreateSalePayload(items, receivedAmount));
  }
};
