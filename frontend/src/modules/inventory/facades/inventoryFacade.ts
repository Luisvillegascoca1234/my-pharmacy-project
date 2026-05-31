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
import {
  CreateInventoryAdjustmentSchema,
  FefoPreviewQuerySchema,
  InventoryMovementsQuerySchema,
  InventoryStockQuerySchema
} from "@pharmacy-pos/shared";
import { inventoryApi } from "../api/inventory-api";

export const inventoryFacade = {
  listStock(query: InventoryStockQuery, signal?: AbortSignal): Promise<InventoryStockListResponse> {
    return inventoryApi.listStock(InventoryStockQuerySchema.parse(query), signal);
  },

  listProductBatches(productId: string, signal?: AbortSignal): Promise<InventoryBatch[]> {
    return inventoryApi.listProductBatches(productId, signal);
  },

  listMovements(query: InventoryMovementsQuery, signal?: AbortSignal): Promise<InventoryMovementsListResponse> {
    return inventoryApi.listMovements(InventoryMovementsQuerySchema.parse(query), signal);
  },

  createAdjustment(input: CreateInventoryAdjustment): Promise<InventoryAdjustment> {
    return inventoryApi.createAdjustment(CreateInventoryAdjustmentSchema.parse(input));
  },

  getFefoPreview(productId: string, quantity?: number, signal?: AbortSignal): Promise<FefoPreview> {
    const query = FefoPreviewQuerySchema.parse({ quantity });

    return inventoryApi.getFefoPreview(productId, query.quantity, signal);
  }
};
