import type {
  CashSession,
  InventoryBatch,
  InventoryMovement,
  Payment,
  PreparedInvoice,
  Prisma,
  Sale,
  SaleItem,
  SaleItemBatch,
  SaleReturn,
  SaleReturnItem,
  User
} from "@prisma/client";

export type ReturnsTransactionClient = Prisma.TransactionClient;

export type ReturnsAuditContext = {
  actorUserId?: string;
  ipAddress?: string;
  userAgent?: string;
};

export type ReturnsUserRecord = Pick<User, "id" | "fullName" | "email" | "status">;

export type ReturnsSaleUserRecord = Pick<User, "id" | "fullName" | "email" | "status">;

export type ReturnsCashSessionRecord = Pick<
  CashSession,
  "id" | "correlativeCode" | "openedByUserId" | "status" | "closedAt" | "expectedAmount"
>;

export type ReturnsPreparedInvoiceLink = Pick<PreparedInvoice, "id" | "status">;

export type ReturnsSaleItemBatchRecord = Pick<
  SaleItemBatch,
  "id" | "saleItemId" | "batchId" | "quantity" | "unitCostBase" | "totalCost" | "inventoryMovementId"
> & {
  batch: Pick<InventoryBatch, "id" | "availableQuantity" | "batchNumber" | "expirationDate" | "status">;
};

export type ReturnsSaleItemRecord = SaleItem & {
  consumptions: ReturnsSaleItemBatchRecord[];
};

export type ReturnsSaleWithRelations = Sale & {
  sellerUser: ReturnsSaleUserRecord;
  cashSession: ReturnsCashSessionRecord;
  payment: Payment | null;
  items: ReturnsSaleItemRecord[];
  preparedInvoices: ReturnsPreparedInvoiceLink[];
  saleReturn: Pick<SaleReturn, "id"> | null;
};

export type ReturnsSaleReturnItemRecord = SaleReturnItem & {
  saleItem: Pick<SaleItem, "id" | "internalCode" | "commercialName" | "genericName">;
};

export type ReturnsSaleReturnWithRelations = SaleReturn & {
  actorUser: ReturnsSaleUserRecord;
  payment: Pick<Payment, "id" | "method" | "status" | "refundAmount" | "reversedAt">;
  sale: Pick<Sale, "correlativeCode">;
  items: ReturnsSaleReturnItemRecord[];
};

export type ReturnableSaleListFilters = {
  fromDate?: string;
  page: number;
  pageSize: number;
  search?: string;
  sellerUserId?: string;
  toDate?: string;
};

export type ReturnableSaleListResult = {
  data: ReturnsSaleWithRelations[];
  total: number;
};

export type SaleReturnListFilters = {
  actorUserId?: string;
  fromDate?: string;
  page: number;
  pageSize: number;
  saleId?: string;
  search?: string;
  toDate?: string;
};

export type SaleReturnListResult = {
  data: ReturnsSaleReturnWithRelations[];
  total: number;
};

export type CreateSaleReturnData = {
  saleId: string;
  paymentId: string;
  actorUserId: string;
  reason: string;
  refundAmount: Prisma.Decimal;
  returnedAt: Date;
};

export type CreateSaleReturnItemData = {
  saleReturnId: string;
  saleItemId: string;
  saleItemBatchId: string;
  batchId: string;
  productId: string;
  inventoryMovementId: string;
  quantity: Prisma.Decimal;
  unitCostBase: Prisma.Decimal;
  refundUnitPrice: Prisma.Decimal;
  refundSubtotal: Prisma.Decimal;
  batchNumber?: string | null;
  expirationDate?: Date | null;
};

export type CreateReturnInventoryMovementData = {
  batchId: string;
  productId: string;
  quantityBase: Prisma.Decimal;
  unitCostBase: Prisma.Decimal;
  referenceId: string;
  referenceItemId: string;
  actorUserId?: string;
  reason: string;
};

export type ReturnsInventoryMovementRecord = Pick<InventoryMovement, "id">;
