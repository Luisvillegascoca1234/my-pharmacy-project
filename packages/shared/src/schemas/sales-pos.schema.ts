import { z } from "zod";
import { PageQuerySchema, createPaginatedResponseSchema } from "./pagination.schema.js";
import {
  nonNegativeMoneyInputSchema,
  nonNegativeMoneySchema,
  optionalTextSchema,
  signedMoneySchema
} from "./shared-schema.helpers.js";

const pureDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const quantity = z.number().int().min(0);
const soldQuantity = z.number().int().positive();
const positiveQuantityInput = z.coerce.number().int().positive();

export const SaleStatusSchema = z.enum(["confirmed", "cancelled"]);
export type SaleStatus = z.infer<typeof SaleStatusSchema>;

export const PaymentMethodSchema = z.enum(["cash"]);
export type PaymentMethod = z.infer<typeof PaymentMethodSchema>;

export const PaymentStatusSchema = z.enum(["paid", "reverted", "cancelled"]);
export type PaymentStatus = z.infer<typeof PaymentStatusSchema>;

export const CancelablePaymentStatusSchema = z.enum(["paid", "reverted", "cancelled"]);
export type CancelablePaymentStatus = z.infer<typeof CancelablePaymentStatusSchema>;

export const PosProductUnitSchema = z.object({
  id: z.string(),
  name: z.string(),
  abbreviation: z.string()
});

export type PosProductUnit = z.infer<typeof PosProductUnitSchema>;

export const PosProductSchema = z.object({
  id: z.string(),
  internalCode: z.string(),
  barcode: z.string().optional(),
  commercialName: z.string(),
  genericName: z.string().optional(),
  salePrice: nonNegativeMoneySchema,
  baseUnit: PosProductUnitSchema,
  saleableStock: quantity,
  nextExpirationDate: pureDate.optional()
});

export type PosProduct = z.infer<typeof PosProductSchema>;

export const PosProductSearchQuerySchema = PageQuerySchema.extend({
  search: optionalTextSchema,
  code: optionalTextSchema
});

export type PosProductSearchQuery = z.infer<typeof PosProductSearchQuerySchema>;

export const SaleBatchConsumptionSchema = z.object({
  id: z.string(),
  saleItemId: z.string(),
  batchId: z.string(),
  batchNumber: z.string().optional(),
  expirationDate: pureDate.optional(),
  quantity: soldQuantity,
  unitCost: nonNegativeMoneySchema,
  totalCost: nonNegativeMoneySchema,
  inventoryMovementId: z.string().optional()
});

export type SaleBatchConsumption = z.infer<typeof SaleBatchConsumptionSchema>;

export const SaleItemSchema = z.object({
  id: z.string(),
  saleId: z.string(),
  productId: z.string(),
  internalCode: z.string(),
  barcode: z.string().optional(),
  commercialName: z.string(),
  genericName: z.string().optional(),
  baseUnit: PosProductUnitSchema,
  unitPrice: nonNegativeMoneySchema,
  quantity: soldQuantity,
  subtotal: nonNegativeMoneySchema,
  totalCost: nonNegativeMoneySchema,
  margin: signedMoneySchema,
  consumptions: z.array(SaleBatchConsumptionSchema),
  createdAt: z.string(),
  updatedAt: z.string()
});

export type SaleItem = z.infer<typeof SaleItemSchema>;

export const PaymentSchema = z.object({
  id: z.string(),
  saleId: z.string(),
  cashSessionId: z.string(),
  method: PaymentMethodSchema,
  saleTotal: nonNegativeMoneySchema,
  receivedAmount: nonNegativeMoneySchema,
  changeAmount: nonNegativeMoneySchema,
  status: PaymentStatusSchema,
  paidAt: z.string(),
  createdAt: z.string(),
  updatedAt: z.string()
});

export type Payment = z.infer<typeof PaymentSchema>;

export const SaleReceiptItemSchema = z.object({
  productName: z.string(),
  quantity: soldQuantity,
  unitPrice: nonNegativeMoneySchema,
  subtotal: nonNegativeMoneySchema
});

export type SaleReceiptItem = z.infer<typeof SaleReceiptItemSchema>;

export const SaleReceiptSchema = z.object({
  saleId: z.string(),
  saleCorrelativeCode: z.string(),
  cashSessionCorrelativeCode: z.string(),
  sellerName: z.string(),
  issuedAt: z.string(),
  items: z.array(SaleReceiptItemSchema),
  totalAmount: nonNegativeMoneySchema,
  receivedAmount: nonNegativeMoneySchema,
  changeAmount: nonNegativeMoneySchema
});

export type SaleReceipt = z.infer<typeof SaleReceiptSchema>;

export const SaleUserSummarySchema = z.object({
  id: z.string(),
  fullName: z.string(),
  email: z.string().email()
});

export type SaleUserSummary = z.infer<typeof SaleUserSummarySchema>;

export const SaleSchema = z.object({
  id: z.string(),
  correlativeCode: z.string(),
  sellerUserId: z.string(),
  sellerUser: SaleUserSummarySchema,
  cashSessionId: z.string(),
  cashSessionCorrelativeCode: z.string(),
  status: SaleStatusSchema,
  items: z.array(SaleItemSchema),
  payment: PaymentSchema,
  totalAmount: nonNegativeMoneySchema,
  totalCost: nonNegativeMoneySchema,
  totalMargin: signedMoneySchema,
  receipt: SaleReceiptSchema,
  confirmedAt: z.string(),
  createdAt: z.string(),
  updatedAt: z.string()
});

export type Sale = z.infer<typeof SaleSchema>;

export const CancelableSaleStatusSchema = z.enum(["confirmed", "cancelled"]);
export type CancelableSaleStatus = z.infer<typeof CancelableSaleStatusSchema>;

export const SaleCancellationBlockReasonSchema = z.enum([
  "cash-session-closed",
  "already-cancelled",
  "forbidden",
  "not-current-day",
  "unknown"
]);

export type SaleCancellationBlockReason = z.infer<typeof SaleCancellationBlockReasonSchema>;

export const CancelablePaymentSchema = PaymentSchema.omit({ status: true }).extend({
  reversedAt: z.string().optional(),
  status: CancelablePaymentStatusSchema
});

export type CancelablePayment = z.infer<typeof CancelablePaymentSchema>;

export const CancelableSaleSchema = SaleSchema.omit({ payment: true, status: true }).extend({
  canCancel: z.boolean().optional(),
  cancellationBlockedReason: SaleCancellationBlockReasonSchema.optional(),
  cancelReason: z.string().optional(),
  cancelledAt: z.string().optional(),
  cancelledByUser: SaleUserSummarySchema.optional(),
  cancelledByUserId: z.string().optional(),
  payment: CancelablePaymentSchema,
  status: CancelableSaleStatusSchema
});

export type CancelableSale = z.infer<typeof CancelableSaleSchema>;

export const CancelableSaleSummarySchema = CancelableSaleSchema.pick({
  id: true,
  canCancel: true,
  cancellationBlockedReason: true,
  cancelReason: true,
  cancelledAt: true,
  cashSessionCorrelativeCode: true,
  cashSessionId: true,
  confirmedAt: true,
  correlativeCode: true,
  createdAt: true,
  sellerUser: true,
  sellerUserId: true,
  status: true,
  totalAmount: true,
  totalMargin: true,
  updatedAt: true
});

export type CancelableSaleSummary = z.infer<typeof CancelableSaleSummarySchema>;

export const CancelSaleSchema = z.object({
  cancelReason: z.string().trim().min(3).max(240)
});

export type CancelSale = z.infer<typeof CancelSaleSchema>;

export const SalesQuerySchema = PageQuerySchema.extend({
  cashSessionId: optionalTextSchema,
  fromDate: pureDate.optional(),
  search: optionalTextSchema,
  sellerUserId: optionalTextSchema,
  status: CancelableSaleStatusSchema.optional(),
  toDate: pureDate.optional()
});

export type SalesQuery = z.infer<typeof SalesQuerySchema>;

export const SalesListResponseSchema = createPaginatedResponseSchema(CancelableSaleSummarySchema);
export type SalesListResponse = z.infer<typeof SalesListResponseSchema>;

export const CreateSaleItemSchema = z.object({
  productId: z.string().min(1),
  quantity: positiveQuantityInput
});

export type CreateSaleItem = z.infer<typeof CreateSaleItemSchema>;

export const CreateSalePaymentSchema = z.object({
  method: z.literal("cash"),
  receivedAmount: nonNegativeMoneyInputSchema
});

export type CreateSalePayment = z.infer<typeof CreateSalePaymentSchema>;

export const CreateSaleSchema = z.object({
  items: z.array(CreateSaleItemSchema).min(1),
  payment: CreateSalePaymentSchema
});

export type CreateSale = z.infer<typeof CreateSaleSchema>;

export const PosProductsListResponseSchema = createPaginatedResponseSchema(PosProductSchema);
export type PosProductsListResponse = z.infer<typeof PosProductsListResponseSchema>;

export const PendingCartStatusSchema = z.enum(["active", "converted", "discarded", "expired"]);
export type PendingCartStatus = z.infer<typeof PendingCartStatusSchema>;

export const PendingCartRevalidationIssueCodeSchema = z.enum(["price-changed", "stock-insufficient", "product-not-saleable"]);
export type PendingCartRevalidationIssueCode = z.infer<typeof PendingCartRevalidationIssueCodeSchema>;

export const PendingCartRevalidationIssueSchema = z.object({
  code: PendingCartRevalidationIssueCodeSchema,
  currentUnitPrice: nonNegativeMoneySchema.optional(),
  productId: z.string(),
  referenceUnitPrice: nonNegativeMoneySchema.optional(),
  requestedQuantity: soldQuantity.optional(),
  saleableStock: quantity.optional()
});

export type PendingCartRevalidationIssue = z.infer<typeof PendingCartRevalidationIssueSchema>;

export const PendingCartItemSchema = z.object({
  barcode: z.string().optional(),
  baseUnit: PosProductUnitSchema,
  commercialName: z.string(),
  currentUnitPrice: nonNegativeMoneySchema.optional(),
  genericName: z.string().optional(),
  internalCode: z.string(),
  isSaleable: z.boolean().optional(),
  nextExpirationDate: pureDate.optional(),
  productId: z.string(),
  quantity: soldQuantity,
  referenceSubtotal: nonNegativeMoneySchema,
  referenceUnitPrice: nonNegativeMoneySchema,
  revalidationIssues: z.array(PendingCartRevalidationIssueSchema).optional(),
  saleableStock: quantity.optional()
});

export type PendingCartItem = z.infer<typeof PendingCartItemSchema>;

export const PendingCartSchema = z.object({
  id: z.string(),
  convertedAt: z.string().optional(),
  convertedSale: SaleSchema.optional(),
  convertedSaleId: z.string().optional(),
  createdAt: z.string(),
  currentTotalAmount: nonNegativeMoneySchema.optional(),
  discardReason: z.string().optional(),
  discardedAt: z.string().optional(),
  expiredAt: z.string().optional(),
  expiresAt: z.string(),
  items: z.array(PendingCartItemSchema),
  name: z.string().optional(),
  note: z.string().optional(),
  ownerUser: SaleUserSummarySchema.optional(),
  ownerUserId: z.string(),
  referenceTotalAmount: nonNegativeMoneySchema,
  revalidationIssues: z.array(PendingCartRevalidationIssueSchema).optional(),
  status: PendingCartStatusSchema,
  updatedAt: z.string()
});

export type PendingCart = z.infer<typeof PendingCartSchema>;

export const PendingCartItemInputSchema = z.object({
  productId: z.string().min(1),
  quantity: positiveQuantityInput
});

export type PendingCartItemInput = z.infer<typeof PendingCartItemInputSchema>;

export const SavePendingCartSchema = z.object({
  items: z.array(PendingCartItemInputSchema).min(1),
  name: optionalTextSchema.pipe(z.string().max(120).optional()),
  note: optionalTextSchema.pipe(z.string().max(240).optional())
});

export type SavePendingCart = z.infer<typeof SavePendingCartSchema>;

export const EditPendingCartSchema = SavePendingCartSchema;
export type EditPendingCart = z.infer<typeof EditPendingCartSchema>;

export const DiscardPendingCartSchema = z.object({
  discardReason: optionalTextSchema.pipe(z.string().max(240).optional())
});

export type DiscardPendingCart = z.infer<typeof DiscardPendingCartSchema>;

export const ConvertPendingCartSchema = z.object({
  payment: CreateSalePaymentSchema
});

export type ConvertPendingCart = z.infer<typeof ConvertPendingCartSchema>;

export const PendingCartsQuerySchema = PageQuerySchema.extend({
  includeAll: z.coerce.boolean().optional(),
  search: optionalTextSchema,
  sellerUserId: optionalTextSchema,
  status: PendingCartStatusSchema.optional()
});

export type PendingCartsQuery = z.infer<typeof PendingCartsQuerySchema>;

export const PendingCartsListResponseSchema = createPaginatedResponseSchema(PendingCartSchema);
export type PendingCartsListResponse = z.infer<typeof PendingCartsListResponseSchema>;

export const PendingCartRevalidationSchema = z.object({
  cartId: z.string(),
  issues: z.array(PendingCartRevalidationIssueSchema),
  status: z.enum(["valid", "warning", "blocked", "expired"]),
  totals: z.object({
    currentTotalAmount: nonNegativeMoneySchema,
    referenceTotalAmount: nonNegativeMoneySchema
  })
});

export type PendingCartRevalidation = z.infer<typeof PendingCartRevalidationSchema>;
