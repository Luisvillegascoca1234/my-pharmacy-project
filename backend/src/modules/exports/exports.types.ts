import type { InventoryMovementType, Prisma, SaleStatus } from "@prisma/client";

export type ExportAuditContext = {
  actorUserId?: string;
  ipAddress?: string;
  userAgent?: string;
};

export type CsvExportFilters = {
  fromDate?: string;
  toDate?: string;
};

export type SalesCsvExportRecord = {
  id: string;
  correlativeCode: string;
  status: SaleStatus;
  totalAmount: Prisma.Decimal;
  totalCost: Prisma.Decimal;
  totalMargin: Prisma.Decimal;
  confirmedAt: Date;
  cancelledAt: Date | null;
  sellerUser: {
    fullName: string;
  };
  cashSession: {
    correlativeCode: string;
  };
  saleReturn: {
    returnedAt: Date;
  } | null;
};

export type InventoryMovementCsvExportRecord = {
  id: string;
  type: InventoryMovementType;
  batchId: string;
  productId: string;
  quantityBase: Prisma.Decimal;
  unitCostBase: Prisma.Decimal;
  referenceType: string;
  referenceId: string;
  actorUser: {
    fullName: string;
  } | null;
  reason: string | null;
  createdAt: Date;
  product: {
    internalCode: string;
    commercialName: string;
  };
  batch: {
    batchNumber: string | null;
  };
};

export type CsvExportResult = {
  fileName: "sales.csv" | "inventory-movements.csv";
  contentType: "text/csv; charset=utf-8";
  rowCount: number;
  csv: string;
};
