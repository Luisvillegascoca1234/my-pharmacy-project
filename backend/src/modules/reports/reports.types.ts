import type { InventoryBatch, Payment, Prisma, Sale, SaleReturn } from "@prisma/client";

export type DailyGrossSaleRecord = Pick<Sale, "id" | "confirmedAt" | "totalAmount">;

export type DailyCancelledSaleRecord = Pick<Sale, "id" | "cancelledAt" | "totalAmount"> & {
  cancelledAt: Date;
};

export type DailySaleReturnRecord = Pick<SaleReturn, "id" | "returnedAt" | "refundAmount">;

export type DailyRefundedPaymentRecord = Pick<Payment, "id" | "reversedAt" | "refundAmount" | "saleTotal"> & {
  reversedAt: Date;
  saleReturn: Pick<SaleReturn, "id"> | null;
};

export type ReportInventoryBatchRecord = Pick<
  InventoryBatch,
  "id" | "productId" | "availableQuantity" | "baseUnitCost" | "batchNumber" | "expirationDate" | "createdAt"
> & {
  product: {
    id: string;
    internalCode: string;
    commercialName: string;
    genericName: string | null;
    baseUnit: {
      id: string;
      name: string;
      abbreviation: string;
    };
  };
};
