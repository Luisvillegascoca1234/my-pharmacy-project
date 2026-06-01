import type {
  CashSession,
  InventoryBatch,
  InventoryMovement,
  Payment,
  Prisma,
  Product,
  Sale,
  SaleItem,
  SaleItemBatch,
  Unit,
  User
} from "@prisma/client";

export type SalesTransactionClient = Prisma.TransactionClient;

export type AuditContext = {
  actorUserId?: string;
  ipAddress?: string;
  userAgent?: string;
};

export type SaleActorRecord = Pick<User, "id" | "fullName" | "email" | "status">;

export type SaleCashSessionRecord = Pick<
  CashSession,
  "id" | "correlativeCode" | "openedByUserId" | "status" | "closedAt" | "expectedAmount"
>;

export type SaleProductRecord = Pick<
  Product,
  | "id"
  | "internalCode"
  | "barcode"
  | "commercialName"
  | "genericName"
  | "baseUnitId"
  | "salePrice"
  | "status"
> & {
  baseUnit: Pick<Unit, "id" | "name" | "abbreviation">;
};

export type CreateConfirmedSaleItemData = {
  productId: string;
  internalCode: string;
  barcode: string | null;
  commercialName: string;
  genericName: string | null;
  baseUnitId: string;
  baseUnitName: string;
  baseUnitAbbreviation: string;
  unitPrice: Prisma.Decimal;
  quantity: number;
  subtotal: Prisma.Decimal;
  totalCost: Prisma.Decimal;
  margin: Prisma.Decimal;
};

export type CreateConfirmedSaleData = {
  correlativeNumber: number;
  correlativeCode: string;
  sellerUserId: string;
  cashSessionId: string;
  totalAmount: Prisma.Decimal;
  totalCost: Prisma.Decimal;
  totalMargin: Prisma.Decimal;
  confirmedAt: Date;
};

export type CreateCashPaymentData = {
  saleId: string;
  cashSessionId: string;
  saleTotal: Prisma.Decimal;
  receivedAmount: Prisma.Decimal;
  changeAmount: Prisma.Decimal;
  paidAt: Date;
};

export type SaleInventoryAllocationItemInput = {
  saleItemId: string;
  productId: string;
  quantity: Prisma.Decimal.Value;
};

export type AllocateSaleInventoryInput = {
  saleId: string;
  actorUserId?: string;
  items: SaleInventoryAllocationItemInput[];
};

export type SaleFefoBatchRecord = Pick<
  InventoryBatch,
  | "id"
  | "productId"
  | "availableQuantity"
  | "baseUnitCost"
  | "batchNumber"
  | "expirationDate"
  | "status"
  | "createdAt"
>;

export type CreateSaleItemBatchData = {
  saleItemId: string;
  batchId: string;
  quantity: Prisma.Decimal;
  unitCostBase: Prisma.Decimal;
  totalCost: Prisma.Decimal;
  inventoryMovementId: string;
};

export type CreateSaleInventoryMovementData = {
  batchId: string;
  productId: string;
  quantityBase: Prisma.Decimal;
  unitCostBase: Prisma.Decimal;
  referenceId: string;
  referenceItemId: string;
  actorUserId?: string;
  reason: string;
};

export type SaleInventoryConsumptionRecord = Pick<
  SaleItemBatch,
  "id" | "saleItemId" | "batchId" | "quantity" | "unitCostBase" | "totalCost" | "inventoryMovementId"
> & {
  batch: Pick<InventoryBatch, "availableQuantity" | "batchNumber" | "expirationDate" | "status">;
};

export type SaleInventoryMovementRecord = Pick<InventoryMovement, "id">;

export type SaleItemWithRelations = SaleItem & {
  consumptions: SaleInventoryConsumptionRecord[];
};

export type SaleWithRelations = Sale & {
  sellerUser: SaleActorRecord;
  cancelledByUser: SaleActorRecord | null;
  cashSession: Pick<CashSession, "id" | "correlativeCode" | "openedByUserId" | "status" | "closedAt" | "expectedAmount">;
  items: SaleItemWithRelations[];
  payment: Payment | null;
};

export type SalesListFilters = {
  cashSessionId?: string;
  fromDate?: string;
  page: number;
  pageSize: number;
  search?: string;
  sellerUserId?: string;
  status?: Sale["status"];
  toDate?: string;
};

export type SalesListResult = {
  data: SaleWithRelations[];
  total: number;
};

export type SaleInventoryAllocationItemResult = {
  saleItemId: string;
  productId: string;
  requestedQuantity: Prisma.Decimal;
  totalCost: Prisma.Decimal;
  consumptions: SaleInventoryConsumptionRecord[];
};

export type SaleInventoryAllocationResult = {
  saleId: string;
  totalCost: Prisma.Decimal;
  items: SaleInventoryAllocationItemResult[];
};
