import { z } from "zod";
import { PageQuerySchema, createPaginatedResponseSchema } from "./pagination.schema.js";
import { optionalTextSchema } from "./shared-schema.helpers.js";

const pureDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const decimal4 = z.coerce.number().finite().min(0);
const signedDecimal4 = z.coerce.number().finite();

export const InventoryBatchStatusSchema = z.enum(["active", "depleted", "cancelled"]);
export type InventoryBatchStatus = z.infer<typeof InventoryBatchStatusSchema>;

export const InventoryMovementTypeSchema = z.enum([
  "purchase_received",
  "purchase_cancelled",
  "inventory_adjustment",
  "sale_confirmed",
  "sale_cancelled"
]);
export type InventoryMovementType = z.infer<typeof InventoryMovementTypeSchema>;

export const InventoryProductSummarySchema = z.object({
  id: z.string(),
  internalCode: z.string(),
  commercialName: z.string(),
  genericName: z.string().optional(),
  minimumStock: z.number().min(0),
  baseUnit: z.object({
    id: z.string(),
    name: z.string(),
    abbreviation: z.string()
  })
});

export type InventoryProductSummary = z.infer<typeof InventoryProductSummarySchema>;

export const InventoryBatchSchema = z.object({
  id: z.string(),
  productId: z.string(),
  product: InventoryProductSummarySchema,
  purchaseItemId: z.string(),
  purchaseId: z.string(),
  supplierName: z.string().optional(),
  originalQuantity: z.number().min(0),
  availableQuantity: z.number().min(0),
  baseUnitCost: z.number().min(0),
  batchNumber: z.string().optional(),
  expirationDate: pureDate.optional(),
  status: InventoryBatchStatusSchema,
  createdAt: z.string(),
  updatedAt: z.string()
});

export type InventoryBatch = z.infer<typeof InventoryBatchSchema>;

export const InventoryStockStatusSchema = z.enum(["available", "low_stock", "out_of_stock", "expired", "near_expiration"]);
export type InventoryStockStatus = z.infer<typeof InventoryStockStatusSchema>;

export const InventoryStockItemSchema = z.object({
  productId: z.string(),
  product: InventoryProductSummarySchema,
  batchNumber: z.string().optional(),
  expirationDate: pureDate.optional(),
  totalOriginalQuantity: z.number().min(0),
  totalAvailableQuantity: z.number().min(0),
  totalValue: z.number().min(0),
  averageUnitCost: z.number().min(0),
  layerCount: z.number().int().min(0),
  status: InventoryStockStatusSchema,
  oldestLayerCreatedAt: z.string()
});

export type InventoryStockItem = z.infer<typeof InventoryStockItemSchema>;

export const InventoryMovementSchema = z.object({
  id: z.string(),
  batchId: z.string(),
  productId: z.string(),
  product: InventoryProductSummarySchema,
  type: InventoryMovementTypeSchema,
  quantityBase: signedDecimal4,
  unitCostBase: z.number().min(0),
  referenceType: z.string(),
  referenceId: z.string(),
  referenceItemId: z.string().optional(),
  actorUser: z
    .object({
      id: z.string(),
      fullName: z.string(),
      email: z.string().email()
    })
    .optional(),
  batchNumber: z.string().optional(),
  expirationDate: pureDate.optional(),
  reason: z.string().optional(),
  createdAt: z.string()
});

export type InventoryMovement = z.infer<typeof InventoryMovementSchema>;

export const InventoryAdjustmentSchema = z.object({
  id: z.string(),
  batchId: z.string(),
  productId: z.string(),
  previousQuantity: z.number().min(0),
  countedQuantity: z.number().min(0),
  differenceQuantity: signedDecimal4,
  reason: z.string(),
  createdAt: z.string()
});

export type InventoryAdjustment = z.infer<typeof InventoryAdjustmentSchema>;

export const CreateInventoryAdjustmentSchema = z.object({
  batchId: z.string().min(1),
  countedQuantity: decimal4,
  reason: z.string().trim().min(3).max(240)
});

export type CreateInventoryAdjustment = z.infer<typeof CreateInventoryAdjustmentSchema>;

export const InventoryStockQuerySchema = PageQuerySchema.extend({
  search: optionalTextSchema,
  productId: optionalTextSchema,
  status: InventoryStockStatusSchema.optional()
});

export type InventoryStockQuery = z.infer<typeof InventoryStockQuerySchema>;

export const InventoryMovementsQuerySchema = PageQuerySchema.extend({
  search: optionalTextSchema,
  productId: optionalTextSchema,
  type: InventoryMovementTypeSchema.optional(),
  fromDate: pureDate.optional(),
  toDate: pureDate.optional()
});

export type InventoryMovementsQuery = z.infer<typeof InventoryMovementsQuerySchema>;

export const FefoPreviewQuerySchema = z.object({
  quantity: z.coerce.number().finite().positive().optional()
});

export type FefoPreviewQuery = z.infer<typeof FefoPreviewQuerySchema>;

export const FefoAllocationSchema = z.object({
  batchId: z.string(),
  batchNumber: z.string().optional(),
  expirationDate: pureDate.optional(),
  availableQuantity: z.number().min(0),
  allocatedQuantity: z.number().min(0),
  unitCostBase: z.number().min(0)
});

export type FefoAllocation = z.infer<typeof FefoAllocationSchema>;

export const FefoPreviewSchema = z.object({
  productId: z.string(),
  requestedQuantity: z.number().positive().optional(),
  totalAvailableQuantity: z.number().min(0),
  canFulfill: z.boolean(),
  allocations: z.array(FefoAllocationSchema)
});

export type FefoPreview = z.infer<typeof FefoPreviewSchema>;

export const InventoryStockListResponseSchema = createPaginatedResponseSchema(InventoryStockItemSchema);
export type InventoryStockListResponse = z.infer<typeof InventoryStockListResponseSchema>;

export const InventoryMovementsListResponseSchema = createPaginatedResponseSchema(InventoryMovementSchema);
export type InventoryMovementsListResponse = z.infer<typeof InventoryMovementsListResponseSchema>;
