import type { CreateSale, PosProductSearchQuery, PosProductsListResponse, Sale } from "@pharmacy-pos/shared";
import { axiosApi } from "@/api";

export const posApi = {
  async searchProducts(query: PosProductSearchQuery, signal?: AbortSignal): Promise<PosProductsListResponse> {
    const response = await axiosApi.get<PosProductsListResponse>("/pos/products", {
      params: query,
      signal
    });

    return response.data;
  },

  async createCashSale(input: CreateSale): Promise<Sale> {
    const response = await axiosApi.post<Sale>("/sales", input);

    return response.data;
  }
};
