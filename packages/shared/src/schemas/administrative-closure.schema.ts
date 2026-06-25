import { z } from "zod";
import { PageQuerySchema, createPaginatedResponseSchema } from "./pagination.schema.js";
import { InventoryMovementTypeSchema } from "./inventory.schema.js";
import {
  PaymentStatusSchema,
  SaleStatusSchema,
  SaleUserSummarySchema
} from "./sales-pos.schema.js";
import {
  nonNegativeMoneySchema,
  optionalTextSchema,
  signedMoneySchema
} from "./shared-schema.helpers.js";

const pureDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const isoDateTime = z.string().datetime({ offset: true });
const quantity = z.number().finite().min(0);
const decimal4 = z.number().finite().min(0);
const positiveDays = z.coerce.number().int().positive().max(365);
const administrativeReason = z.string().trim().min(5).max(500);
const csvSeparator = z.literal(";").default(";");
const reportTimezone = z.literal("America/La_Paz").default("America/La_Paz");

const fiscalTextWithDefault = (fallback: string, maxLength: number) =>
  z.preprocess(
    (value) => {
      if (typeof value !== "string") {
        return undefined;
      }

      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : undefined;
    },
    z.string().max(maxLength).default(fallback)
  );

export const AdministrativeJsonValueSchema: z.ZodType<
  string | number | boolean | null | { [key: string]: unknown } | unknown[]
> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(AdministrativeJsonValueSchema),
    z.record(AdministrativeJsonValueSchema)
  ])
);

export type AdministrativeJsonValue = z.infer<typeof AdministrativeJsonValueSchema>;

export const AdministrativeUserSummarySchema = SaleUserSummarySchema;
export type AdministrativeUserSummary = z.infer<typeof AdministrativeUserSummarySchema>;

export const PreparedInvoiceStatusSchema = z.enum(["prepared", "cancelled"]);
export type PreparedInvoiceStatus = z.infer<typeof PreparedInvoiceStatusSchema>;

export const PreparedInvoiceEligibilityBlockReasonSchema = z.enum([
  "sale-not-found",
  "sale-cancelled",
  "sale-returned",
  "active-invoice-exists",
  "unknown"
]);

export type PreparedInvoiceEligibilityBlockReason = z.infer<
  typeof PreparedInvoiceEligibilityBlockReasonSchema
>;

export const PreparedInvoiceItemSchema = z.object({
  id: z.string(),
  preparedInvoiceId: z.string(),
  saleItemId: z.string(),
  productId: z.string(),
  internalCode: z.string(),
  barcode: z.string().optional(),
  commercialName: z.string(),
  genericName: z.string().optional(),
  baseUnit: z.object({
    id: z.string(),
    name: z.string(),
    abbreviation: z.string()
  }),
  unitPrice: nonNegativeMoneySchema,
  quantity: z.number().int().positive(),
  subtotal: nonNegativeMoneySchema,
  createdAt: z.string(),
  updatedAt: z.string()
});

export type PreparedInvoiceItem = z.infer<typeof PreparedInvoiceItemSchema>;

export const PreparedInvoiceSummarySchema = z.object({
  id: z.string(),
  correlativeCode: z.string(),
  saleId: z.string(),
  saleCorrelativeCode: z.string(),
  cashSessionId: z.string(),
  cashSessionCode: z.string(),
  sellerUserId: z.string(),
  sellerName: z.string(),
  sellerEmail: z.string().email(),
  status: PreparedInvoiceStatusSchema,
  customerNit: z.string(),
  customerBusinessName: z.string(),
  fiscalNotes: z.string().optional(),
  totalAmount: nonNegativeMoneySchema,
  preparedAt: z.string(),
  cancelledAt: z.string().optional(),
  cancelledByUserId: z.string().optional(),
  cancelledByUser: AdministrativeUserSummarySchema.optional(),
  cancelReason: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string()
});

export type PreparedInvoiceSummary = z.infer<typeof PreparedInvoiceSummarySchema>;

export const PreparedInvoiceSchema = PreparedInvoiceSummarySchema.extend({
  sellerUser: AdministrativeUserSummarySchema.optional(),
  items: z.array(PreparedInvoiceItemSchema)
});

export type PreparedInvoice = z.infer<typeof PreparedInvoiceSchema>;

export const PrepareInvoiceFromSaleSchema = z.object({
  saleId: z.string().min(1),
  customerNit: fiscalTextWithDefault("0", 32),
  customerBusinessName: fiscalTextWithDefault("Consumidor final", 180),
  fiscalNotes: optionalTextSchema.pipe(z.string().max(500).optional())
});

export type PrepareInvoiceFromSale = z.infer<typeof PrepareInvoiceFromSaleSchema>;

export const CancelPreparedInvoiceSchema = z.object({
  cancelReason: administrativeReason
});

export type CancelPreparedInvoice = z.infer<typeof CancelPreparedInvoiceSchema>;

export const PreparedInvoicesQuerySchema = PageQuerySchema.extend({
  correlativeCode: optionalTextSchema,
  saleId: optionalTextSchema,
  search: optionalTextSchema,
  status: PreparedInvoiceStatusSchema.optional(),
  fromDate: pureDate.optional(),
  toDate: pureDate.optional()
});

export type PreparedInvoicesQuery = z.infer<typeof PreparedInvoicesQuerySchema>;

export const PreparedInvoicesListResponseSchema = createPaginatedResponseSchema(PreparedInvoiceSummarySchema);
export type PreparedInvoicesListResponse = z.infer<typeof PreparedInvoicesListResponseSchema>;

export const InvoiceableSaleSummarySchema = z.object({
  id: z.string(),
  correlativeCode: z.string(),
  cashSessionId: z.string(),
  cashSessionCorrelativeCode: z.string(),
  sellerUserId: z.string(),
  sellerUser: AdministrativeUserSummarySchema,
  status: SaleStatusSchema,
  totalAmount: nonNegativeMoneySchema,
  confirmedAt: z.string(),
  activePreparedInvoiceId: z.string().optional(),
  canPrepareInvoice: z.boolean(),
  invoiceBlockedReason: PreparedInvoiceEligibilityBlockReasonSchema.optional()
});

export type InvoiceableSaleSummary = z.infer<typeof InvoiceableSaleSummarySchema>;

export const InvoiceableSalesQuerySchema = PageQuerySchema.extend({
  search: optionalTextSchema,
  sellerUserId: optionalTextSchema,
  fromDate: pureDate.optional(),
  toDate: pureDate.optional()
});

export type InvoiceableSalesQuery = z.infer<typeof InvoiceableSalesQuerySchema>;

export const InvoiceableSalesListResponseSchema = createPaginatedResponseSchema(InvoiceableSaleSummarySchema);
export type InvoiceableSalesListResponse = z.infer<typeof InvoiceableSalesListResponseSchema>;

export const ReturnableSaleBlockReasonSchema = z.enum([
  "sale-not-found",
  "sale-cancelled",
  "already-returned",
  "cash-session-open",
  "active-invoice-exists",
  "payment-not-refundable",
  "unknown"
]);

export type ReturnableSaleBlockReason = z.infer<typeof ReturnableSaleBlockReasonSchema>;

export const ReturnableSaleSummarySchema = z.object({
  id: z.string(),
  correlativeCode: z.string(),
  cashSessionId: z.string(),
  cashSessionCorrelativeCode: z.string(),
  sellerUserId: z.string(),
  sellerUser: AdministrativeUserSummarySchema,
  status: SaleStatusSchema,
  paymentStatus: PaymentStatusSchema,
  totalAmount: nonNegativeMoneySchema,
  confirmedAt: z.string(),
  canReturn: z.boolean(),
  returnBlockedReason: ReturnableSaleBlockReasonSchema.optional(),
  activePreparedInvoiceId: z.string().optional()
});

export type ReturnableSaleSummary = z.infer<typeof ReturnableSaleSummarySchema>;

export const ReturnableSalesQuerySchema = PageQuerySchema.extend({
  search: optionalTextSchema,
  sellerUserId: optionalTextSchema,
  fromDate: pureDate.optional(),
  toDate: pureDate.optional()
});

export type ReturnableSalesQuery = z.infer<typeof ReturnableSalesQuerySchema>;

export const ReturnableSalesListResponseSchema = createPaginatedResponseSchema(ReturnableSaleSummarySchema);
export type ReturnableSalesListResponse = z.infer<typeof ReturnableSalesListResponseSchema>;

export const CreateTotalSaleReturnSchema = z.object({
  saleId: z.string().min(1),
  reason: administrativeReason
});

export type CreateTotalSaleReturn = z.infer<typeof CreateTotalSaleReturnSchema>;

export const SaleReturnItemSchema = z.object({
  id: z.string(),
  saleReturnId: z.string(),
  saleItemId: z.string(),
  saleItemBatchId: z.string(),
  batchId: z.string(),
  productId: z.string(),
  inventoryMovementId: z.string().optional(),
  internalCode: z.string(),
  commercialName: z.string(),
  genericName: z.string().optional(),
  batchNumber: z.string().optional(),
  expirationDate: pureDate.optional(),
  quantity: quantity,
  unitCostBase: decimal4,
  refundUnitPrice: nonNegativeMoneySchema,
  refundSubtotal: nonNegativeMoneySchema,
  createdAt: z.string(),
  updatedAt: z.string()
});

export type SaleReturnItem = z.infer<typeof SaleReturnItemSchema>;

export const SaleReturnSummarySchema = z.object({
  id: z.string(),
  saleId: z.string(),
  saleCorrelativeCode: z.string(),
  paymentId: z.string(),
  actorUserId: z.string(),
  actorUser: AdministrativeUserSummarySchema,
  reason: z.string(),
  refundAmount: nonNegativeMoneySchema,
  returnedAt: z.string(),
  createdAt: z.string(),
  updatedAt: z.string()
});

export type SaleReturnSummary = z.infer<typeof SaleReturnSummarySchema>;

export const SaleReturnSchema = SaleReturnSummarySchema.extend({
  items: z.array(SaleReturnItemSchema)
});

export type SaleReturn = z.infer<typeof SaleReturnSchema>;

export const SaleReturnsQuerySchema = PageQuerySchema.extend({
  saleId: optionalTextSchema,
  search: optionalTextSchema,
  actorUserId: optionalTextSchema,
  fromDate: pureDate.optional(),
  toDate: pureDate.optional()
});

export type SaleReturnsQuery = z.infer<typeof SaleReturnsQuerySchema>;

export const SaleReturnsListResponseSchema = createPaginatedResponseSchema(SaleReturnSummarySchema);
export type SaleReturnsListResponse = z.infer<typeof SaleReturnsListResponseSchema>;

export const AuditLogSchema = z.object({
  id: z.string(),
  action: z.string(),
  actorUserId: z.string().optional(),
  actorUser: AdministrativeUserSummarySchema.optional(),
  entityType: z.string().optional(),
  entityId: z.string().optional(),
  metadata: AdministrativeJsonValueSchema.optional(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  createdAt: z.string()
});

export type AuditLog = z.infer<typeof AuditLogSchema>;

export const AuditLogsQuerySchema = PageQuerySchema.extend({
  action: optionalTextSchema,
  actorUserId: optionalTextSchema,
  entityType: optionalTextSchema,
  entityId: optionalTextSchema,
  fromDate: pureDate.optional(),
  toDate: pureDate.optional()
});

export type AuditLogsQuery = z.infer<typeof AuditLogsQuerySchema>;

export const AuditLogsListResponseSchema = createPaginatedResponseSchema(AuditLogSchema);
export type AuditLogsListResponse = z.infer<typeof AuditLogsListResponseSchema>;

export const DailySalesReportQuerySchema = z.object({
  fromDate: pureDate,
  toDate: pureDate,
  timezone: reportTimezone
});

export type DailySalesReportQuery = z.infer<typeof DailySalesReportQuerySchema>;

export const DailySalesReportRowSchema = z.object({
  date: pureDate,
  grossSalesAmount: nonNegativeMoneySchema,
  cancelledAmount: nonNegativeMoneySchema,
  returnedAmount: nonNegativeMoneySchema,
  netSalesAmount: signedMoneySchema,
  saleCount: z.number().int().min(0),
  cancelledCount: z.number().int().min(0),
  returnedCount: z.number().int().min(0)
});

export type DailySalesReportRow = z.infer<typeof DailySalesReportRowSchema>;

export const DailySalesReportResponseSchema = z.object({
  range: DailySalesReportQuerySchema,
  generatedAt: isoDateTime,
  audited: z.literal(false),
  data: z.array(DailySalesReportRowSchema)
});

export type DailySalesReportResponse = z.infer<typeof DailySalesReportResponseSchema>;

export const InventoryValuationReportQuerySchema = z.object({
  search: optionalTextSchema,
  productId: optionalTextSchema,
  timezone: reportTimezone
});

export type InventoryValuationReportQuery = z.infer<typeof InventoryValuationReportQuerySchema>;

export const InventoryValuationLotSchema = z.object({
  batchId: z.string(),
  batchNumber: z.string().optional(),
  expirationDate: pureDate.optional(),
  availableQuantity: quantity,
  unitCostBase: decimal4,
  totalValue: nonNegativeMoneySchema
});

export type InventoryValuationLot = z.infer<typeof InventoryValuationLotSchema>;

export const InventoryValuationProductSchema = z.object({
  productId: z.string(),
  internalCode: z.string(),
  commercialName: z.string(),
  genericName: z.string().optional(),
  baseUnit: z.object({
    id: z.string(),
    name: z.string(),
    abbreviation: z.string()
  }),
  totalAvailableQuantity: quantity,
  totalValue: nonNegativeMoneySchema,
  lots: z.array(InventoryValuationLotSchema)
});

export type InventoryValuationProduct = z.infer<typeof InventoryValuationProductSchema>;

export const InventoryValuationReportResponseSchema = z.object({
  generatedAt: isoDateTime,
  timezone: reportTimezone,
  audited: z.literal(false),
  totalValue: nonNegativeMoneySchema,
  data: z.array(InventoryValuationProductSchema)
});

export type InventoryValuationReportResponse = z.infer<typeof InventoryValuationReportResponseSchema>;

export const ExpiringProductsReportQuerySchema = z.object({
  days: positiveDays.default(30),
  search: optionalTextSchema,
  productId: optionalTextSchema,
  timezone: reportTimezone
});

export type ExpiringProductsReportQuery = z.infer<typeof ExpiringProductsReportQuerySchema>;

export const ExpiringProductSchema = z.object({
  productId: z.string(),
  internalCode: z.string(),
  commercialName: z.string(),
  genericName: z.string().optional(),
  batchId: z.string(),
  batchNumber: z.string().optional(),
  expirationDate: pureDate,
  daysUntilExpiration: z.number().int(),
  availableQuantity: quantity,
  unitCostBase: decimal4,
  totalValue: nonNegativeMoneySchema
});

export type ExpiringProduct = z.infer<typeof ExpiringProductSchema>;

export const ExpiringProductsReportResponseSchema = z.object({
  range: ExpiringProductsReportQuerySchema,
  generatedAt: isoDateTime,
  audited: z.literal(false),
  data: z.array(ExpiringProductSchema)
});

export type ExpiringProductsReportResponse = z.infer<typeof ExpiringProductsReportResponseSchema>;

export const SalesCsvExportQuerySchema = z.object({
  fromDate: pureDate.optional(),
  toDate: pureDate.optional(),
  separator: csvSeparator
});

export type SalesCsvExportQuery = z.infer<typeof SalesCsvExportQuerySchema>;

export const SalesCsvRowSchema = z.object({
  saleId: z.string(),
  correlativeCode: z.string(),
  status: SaleStatusSchema,
  sellerName: z.string(),
  cashSessionCorrelativeCode: z.string(),
  totalAmount: nonNegativeMoneySchema,
  totalCost: nonNegativeMoneySchema,
  totalMargin: signedMoneySchema,
  confirmedAt: isoDateTime,
  cancelledAt: isoDateTime.optional(),
  returnedAt: isoDateTime.optional()
});

export type SalesCsvRow = z.infer<typeof SalesCsvRowSchema>;

export const InventoryMovementsCsvExportQuerySchema = z.object({
  fromDate: pureDate.optional(),
  toDate: pureDate.optional(),
  separator: csvSeparator
});

export type InventoryMovementsCsvExportQuery = z.infer<typeof InventoryMovementsCsvExportQuerySchema>;

export const InventoryMovementsCsvRowSchema = z.object({
  movementId: z.string(),
  type: InventoryMovementTypeSchema,
  productId: z.string(),
  internalCode: z.string(),
  commercialName: z.string(),
  batchId: z.string(),
  batchNumber: z.string().optional(),
  quantityBase: z.number().finite(),
  unitCostBase: decimal4,
  referenceType: z.string(),
  referenceId: z.string(),
  actorUserName: z.string().optional(),
  reason: z.string().optional(),
  createdAt: isoDateTime
});

export type InventoryMovementsCsvRow = z.infer<typeof InventoryMovementsCsvRowSchema>;
