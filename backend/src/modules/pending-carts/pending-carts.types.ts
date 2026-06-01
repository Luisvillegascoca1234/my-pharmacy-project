import type { PendingCart, PendingCartItem, Prisma, Product, Unit, User } from "@prisma/client";

export type PendingCartsTransactionClient = Prisma.TransactionClient;

export type PendingCartOwnerRecord = Pick<User, "id" | "fullName" | "email" | "status">;

export type PendingCartItemRecord = PendingCartItem;

export type PendingCartRecord = PendingCart & {
  ownerUser: PendingCartOwnerRecord;
  items: PendingCartItemRecord[];
};

export type PendingCartProductRecord = Pick<
  Product,
  "id" | "internalCode" | "barcode" | "commercialName" | "genericName" | "baseUnitId" | "salePrice" | "status"
> & {
  baseUnit: Pick<Unit, "id" | "name" | "abbreviation">;
  inventoryBatches: Array<{
    availableQuantity: Prisma.Decimal;
    expirationDate: Date | null;
    createdAt: Date;
  }>;
};

export type PendingCartListFilters = {
  includeAll?: boolean;
  ownerUserId: string;
  page: number;
  pageSize: number;
  search?: string;
  sellerUserId?: string;
  status?: PendingCart["status"];
};

export type PendingCartListResult = {
  data: PendingCartRecord[];
  total: number;
};

export type PendingCartItemSnapshotData = {
  productId: string;
  internalCode: string;
  barcode: string | null;
  commercialName: string;
  genericName: string | null;
  baseUnitId: string;
  baseUnitName: string;
  baseUnitAbbreviation: string;
  referenceUnitPrice: Prisma.Decimal;
  quantity: number;
  referenceSubtotal: Prisma.Decimal;
};

export type SavePendingCartData = {
  ownerUserId: string;
  name?: string;
  note?: string;
  referenceTotalAmount: Prisma.Decimal;
  expiresAt: Date;
};

export type UpdatePendingCartData = {
  name?: string | null;
  note?: string | null;
  referenceTotalAmount: Prisma.Decimal;
};
