import type {
  CashSession,
  Payment,
  PreparedInvoice,
  PreparedInvoiceItem,
  Prisma,
  Sale,
  SaleItem,
  SaleReturn,
  User
} from "@prisma/client";

export type BillingTransactionClient = Prisma.TransactionClient;

export type BillingAuditContext = {
  actorUserId?: string;
  ipAddress?: string;
  userAgent?: string;
};

export type BillingUserRecord = Pick<User, "id" | "fullName" | "email" | "status"> & {
  role: {
    name: string;
  };
};

export type BillingSaleUserRecord = Pick<User, "id" | "fullName" | "email" | "status">;

export type BillingSaleCashSessionRecord = Pick<
  CashSession,
  "id" | "correlativeCode" | "openedByUserId" | "status" | "closedAt" | "expectedAmount"
>;

export type BillingPreparedInvoiceLink = Pick<PreparedInvoice, "id" | "status">;

export type BillingSaleItemRecord = Pick<
  SaleItem,
  | "id"
  | "productId"
  | "internalCode"
  | "barcode"
  | "commercialName"
  | "genericName"
  | "baseUnitId"
  | "baseUnitName"
  | "baseUnitAbbreviation"
  | "unitPrice"
  | "quantity"
  | "subtotal"
  | "createdAt"
  | "updatedAt"
>;

export type BillingSaleWithRelations = Sale & {
  sellerUser: BillingSaleUserRecord;
  cashSession: BillingSaleCashSessionRecord;
  payment: Payment | null;
  items: BillingSaleItemRecord[];
  preparedInvoices: BillingPreparedInvoiceLink[];
  saleReturn: Pick<SaleReturn, "id"> | null;
};

export type BillingInvoiceableSaleListFilters = {
  fromDate?: string;
  page: number;
  pageSize: number;
  search?: string;
  sellerUserId?: string;
  toDate?: string;
};

export type BillingInvoiceableSaleListResult = {
  data: BillingSaleWithRelations[];
  total: number;
};

export type BillingPreparedInvoiceItemRecord = PreparedInvoiceItem;

export type BillingPreparedInvoiceWithRelations = PreparedInvoice & {
  sellerUser: BillingSaleUserRecord;
  cancelledByUser: BillingSaleUserRecord | null;
  items: BillingPreparedInvoiceItemRecord[];
};

export type BillingPreparedInvoiceListFilters = {
  correlativeCode?: string;
  fromDate?: string;
  page: number;
  pageSize: number;
  saleId?: string;
  search?: string;
  status?: PreparedInvoice["status"];
  toDate?: string;
};

export type BillingPreparedInvoiceListResult = {
  data: BillingPreparedInvoiceWithRelations[];
  total: number;
};

export type CreatePreparedInvoiceData = {
  correlativeNumber: number;
  correlativeCode: string;
  saleId: string;
  sellerUserId: string;
  saleCorrelativeCode: string;
  cashSessionId: string;
  cashSessionCode: string;
  sellerName: string;
  sellerEmail: string;
  customerNit: string;
  customerBusinessName: string;
  fiscalNotes?: string;
  totalAmount: Prisma.Decimal;
  preparedAt: Date;
};

export type CreatePreparedInvoiceItemData = {
  saleItemId: string;
  productId: string;
  internalCode: string;
  barcode?: string | null;
  commercialName: string;
  genericName?: string | null;
  baseUnitId: string;
  baseUnitName: string;
  baseUnitAbbreviation: string;
  unitPrice: Prisma.Decimal;
  quantity: number;
  subtotal: Prisma.Decimal;
};

export type CancelPreparedInvoiceData = {
  cancelReason: string;
  cancelledAt: Date;
  cancelledByUserId: string;
};
