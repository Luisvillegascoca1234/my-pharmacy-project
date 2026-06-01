import type { CancelSale, CancelableSale, SalesListResponse, SalesQuery } from "../types/salesTypes";
import { axiosApi } from "@/api";

export const salesApi = {
  async list(query: SalesQuery, signal?: AbortSignal): Promise<SalesListResponse> {
    const response = await axiosApi.get<SalesListResponse>("/sales", {
      params: query,
      signal
    });

    return response.data;
  },

  async getById(saleId: string, signal?: AbortSignal): Promise<CancelableSale> {
    const response = await axiosApi.get<CancelableSale>(`/sales/${saleId}`, { signal });

    return response.data;
  },

  async cancel(saleId: string, input: CancelSale): Promise<CancelableSale> {
    const response = await axiosApi.post<CancelableSale>(`/sales/${saleId}/cancel`, input);

    return response.data;
  }
};
