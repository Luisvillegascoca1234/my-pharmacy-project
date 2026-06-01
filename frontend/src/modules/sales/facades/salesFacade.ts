import type { CancelSale, CancelableSale, SalesListResponse, SalesQuery } from "../types/salesTypes";
import { salesApi } from "../api/sales-api";
import { buildSalesQuery } from "../utils/salesPayloads";

export const salesFacade = {
  list(query: SalesQuery, signal?: AbortSignal): Promise<SalesListResponse> {
    return salesApi.list(buildSalesQuery(query), signal);
  },

  getById(saleId: string, signal?: AbortSignal): Promise<CancelableSale> {
    return salesApi.getById(saleId, signal);
  },

  cancel(saleId: string, input: CancelSale): Promise<CancelableSale> {
    return salesApi.cancel(saleId, input);
  }
};
