import { z } from "zod";
import { PageQuerySchema, createPaginatedResponseSchema } from "./pagination.schema.js";
import { optionalTextSchema } from "./shared-schema.helpers.js";
import { SupplierSummarySchema } from "./supplier.schema.js";

const pureDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const hasMaxDecimalPlaces = (places: number) => (value: number) => {
  const [, decimals = ""] = value.toString().split(".");
  return decimals.length <= places;
};

const money = z.coerce.number().finite().min(0).refine(hasMaxDecimalPlaces(2), {
  message: "Must have at most 2 decimal places."
});

const decimal4 = z.coerce.number().finite().min(0).refine(hasMaxDecimalPlaces(4), {
  message: "Must have at most 4 decimal places."
});

const positiveDecimal4 = decimal4.refine((value) => value > 0, {
  message: "Must be greater than 0."
});

export const PurchaseStatusSchema = z.enum(["draft", "received", "cancelled"]);
export type PurchaseStatus = z.infer<typeof PurchaseStatusSchema>;

export const PurchaseUserSummarySchema = z.object({
  id: z.string(),
  fullName: z.string(),
  email: z.string().email()
});

export type PurchaseUserSummary = z.infer<typeof PurchaseUserSummarySchema>;

export const PurchaseItemSchema = z.object({
  id: z.string(),
  purchaseId: z.string(),
  productId: z.string(),
  productName: z.string(),
  unitId: z.string(),
  unitName: z.string(),
  quantity: z.number().min(0),
  unitCost: z.number().min(0),
  conversionFactor: z.number().positive(),
  baseQuantity: z.number().min(0),
  baseUnitCost: z.number().min(0),
  lineTotal: z.number().min(0),
  isInventoryTracked: z.boolean(),
  batchNumber: z.string().optional(),
  expirationDate: pureDate.optional(),
  createdAt: z.string(),
  updatedAt: z.string()
});

export type PurchaseItem = z.infer<typeof PurchaseItemSchema>;

export const PurchaseSummarySchema = z.object({
  id: z.string(),
  supplierId: z.string(),
  supplier: SupplierSummarySchema,
  purchaseDate: pureDate,
  status: PurchaseStatusSchema,
  totalAmount: z.number().min(0),
  createdByUserId: z.string(),
  receivedByUserId: z.string().optional(),
  receivedAt: z.string().optional(),
  cancelledAt: z.string().optional(),
  notes: z.string().optional(),
  receiveNotes: z.string().optional(),
  cancelReason: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string()
});

export type PurchaseSummary = z.infer<typeof PurchaseSummarySchema>;

export const PurchaseSchema = PurchaseSummarySchema.extend({
  createdByUser: PurchaseUserSummarySchema,
  receivedByUser: PurchaseUserSummarySchema.optional(),
  items: z.array(PurchaseItemSchema)
});

export type Purchase = z.infer<typeof PurchaseSchema>;

export const PurchaseItemInputSchema = z.object({
  productId: z.string().min(1),
  unitId: z.string().min(1),
  quantity: positiveDecimal4,
  unitCost: money,
  batchNumber: optionalTextSchema.pipe(z.string().max(80).optional()).transform((value) => value?.toUpperCase()),
  expirationDate: pureDate.optional()
});

export type PurchaseItemInput = z.infer<typeof PurchaseItemInputSchema>;

export const CreatePurchaseSchema = z.object({
  supplierId: z.string().min(1),
  purchaseDate: pureDate,
  notes: optionalTextSchema,
  items: z.array(PurchaseItemInputSchema).min(1)
});

export type CreatePurchase = z.infer<typeof CreatePurchaseSchema>;

export const UpdatePurchaseSchema = CreatePurchaseSchema;
export type UpdatePurchase = z.infer<typeof UpdatePurchaseSchema>;

export const ReceivePurchaseSchema = z.object({
  receiveNotes: optionalTextSchema
});

export type ReceivePurchase = z.infer<typeof ReceivePurchaseSchema>;

export const CancelPurchaseSchema = z.object({
  cancelReason: z.string().trim().min(3).max(240)
});

export type CancelPurchase = z.infer<typeof CancelPurchaseSchema>;

export const PurchasesQuerySchema = PageQuerySchema.extend({
  search: optionalTextSchema,
  status: PurchaseStatusSchema.optional(),
  supplierId: optionalTextSchema,
  fromDate: pureDate.optional(),
  toDate: pureDate.optional()
});

export type PurchasesQuery = z.infer<typeof PurchasesQuerySchema>;

export const PurchasesListResponseSchema = createPaginatedResponseSchema(PurchaseSummarySchema);
export type PurchasesListResponse = z.infer<typeof PurchasesListResponseSchema>;
