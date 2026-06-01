import type { InventoryBatch, Prisma } from "@prisma/client";

export type PosProductSearchFilters = {
  code?: string;
  page: number;
  pageSize: number;
  search?: string;
  today: Date;
};

export type PosProductBatchRecord = Pick<InventoryBatch, "availableQuantity" | "expirationDate" | "createdAt">;

export type PosProductRecord = {
  id: string;
  internalCode: string;
  barcode: string | null;
  commercialName: string;
  genericName: string | null;
  salePrice: Prisma.Decimal;
  baseUnit: {
    id: string;
    name: string;
    abbreviation: string;
  };
  inventoryBatches: PosProductBatchRecord[];
};

export type PosProductSearchResult = {
  data: PosProductRecord[];
  total: number;
};
