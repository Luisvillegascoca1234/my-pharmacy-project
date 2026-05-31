import type {
  CreateInventoryAdjustment,
  FefoPreview,
  InventoryAdjustment,
  InventoryBatch,
  InventoryMovementsListResponse,
  InventoryMovementsQuery,
  InventoryStockListResponse,
  InventoryStockQuery
} from "@pharmacy-pos/shared";
import { axiosApi } from "@/api";

export const inventoryApi = {
  async listStock(query: InventoryStockQuery, signal?: AbortSignal): Promise<InventoryStockListResponse> {
    const response = await axiosApi.get<InventoryStockListResponse>("/inventory/stock", {
      params: query,
      signal
    });

    return response.data;
  },

  async listProductBatches(productId: string, signal?: AbortSignal): Promise<InventoryBatch[]> {
    const response = await axiosApi.get<InventoryBatch[]>(`/inventory/products/${productId}/batches`, { signal });

    return response.data;
  },

  async listMovements(query: InventoryMovementsQuery, signal?: AbortSignal): Promise<InventoryMovementsListResponse> {
    const response = await axiosApi.get<InventoryMovementsListResponse>("/inventory/movements", {
      params: query,
      signal
    });

    return response.data;
  },

  async createAdjustment(input: CreateInventoryAdjustment): Promise<InventoryAdjustment> {
    const response = await axiosApi.post<InventoryAdjustment>("/inventory/adjustments", input);

    return response.data;
  },

  async getFefoPreview(productId: string, quantity?: number, signal?: AbortSignal): Promise<FefoPreview> {
    const response = await axiosApi.get<FefoPreview>(`/inventory/products/${productId}/fefo-preview`, {
      params: { quantity },
      signal
    });

    return response.data;
  }
};
