import type { Prisma, Product, ProductUnit, Purchase, PurchaseItem, Supplier, Unit, User } from "@prisma/client";

export type AuditContext = {
  actorUserId?: string;
  ipAddress?: string;
  userAgent?: string;
};

export type PurchasesListFilters = {
  search?: string;
  status?: Purchase["status"];
  supplierId?: string;
  fromDate?: string;
  toDate?: string;
  page: number;
  pageSize: number;
};

export type SupplierRecord = Supplier;
export type UserRecord = Pick<User, "id" | "fullName" | "email" | "status">;

export type ProductUnitWithUnit = ProductUnit & {
  unit: Unit;
};

export type ProductWithPurchaseRelations = Product & {
  units: ProductUnitWithUnit[];
};

export type PurchaseItemWithRelations = PurchaseItem & {
  product: Product;
  unit: Unit;
};

export type PurchaseWithRelations = Purchase & {
  supplier: Supplier;
  createdByUser: UserRecord;
  receivedByUser: UserRecord | null;
  items: PurchaseItemWithRelations[];
};

export type PurchaseSummaryRecord = Purchase & {
  supplier: Supplier;
};

export type PurchasesListResult = {
  data: PurchaseSummaryRecord[];
  total: number;
};

export type PurchaseDraftItemData = {
  productId: string;
  unitId: string;
  quantity: Prisma.Decimal;
  unitCost: Prisma.Decimal;
  conversionFactor: Prisma.Decimal;
  baseQuantity: Prisma.Decimal;
  baseUnitCost: Prisma.Decimal;
  lineTotal: Prisma.Decimal;
  isInventoryTracked: boolean;
  batchNumber: string | null;
  expirationDate: Date | null;
};

export type PurchaseDraftData = {
  supplierId: string;
  purchaseDate: Date;
  totalAmount: Prisma.Decimal;
  createdByUserId: string;
  notes: string | null;
};

export type PurchaseDraftUpdateData = Omit<PurchaseDraftData, "createdByUserId">;
