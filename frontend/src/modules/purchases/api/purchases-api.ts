import type {
  CancelPurchase,
  CreatePurchase,
  Purchase,
  PurchasesListResponse,
  PurchasesQuery,
  ReceivePurchase,
  UpdatePurchase
} from "@pharmacy-pos/shared";
import { axiosApi } from "@/api";

export const purchasesApi = {
  async listPurchases(query: PurchasesQuery, signal?: AbortSignal): Promise<PurchasesListResponse> {
    const response = await axiosApi.get<PurchasesListResponse>("/purchases", {
      params: query,
      signal
    });

    return response.data;
  },

  async getPurchase(purchaseId: string, signal?: AbortSignal): Promise<Purchase> {
    const response = await axiosApi.get<Purchase>(`/purchases/${purchaseId}`, { signal });

    return response.data;
  },

  async createPurchase(input: CreatePurchase): Promise<Purchase> {
    const response = await axiosApi.post<Purchase>("/purchases", input);

    return response.data;
  },

  async updatePurchase(purchaseId: string, input: UpdatePurchase): Promise<Purchase> {
    const response = await axiosApi.patch<Purchase>(`/purchases/${purchaseId}`, input);

    return response.data;
  },

  async receivePurchase(purchaseId: string, input: ReceivePurchase): Promise<Purchase> {
    const response = await axiosApi.post<Purchase>(`/purchases/${purchaseId}/receive`, input);

    return response.data;
  },

  async cancelPurchase(purchaseId: string, input: CancelPurchase): Promise<Purchase> {
    const response = await axiosApi.post<Purchase>(`/purchases/${purchaseId}/cancel`, input);

    return response.data;
  }
};
