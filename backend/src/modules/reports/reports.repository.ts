import { Prisma } from "@prisma/client";
import { prisma } from "../../infrastructure/prisma/prisma.client.js";
import type {
  DailyCancelledSaleRecord,
  DailyGrossSaleRecord,
  DailyRefundedPaymentRecord,
  DailySaleReturnRecord,
  ReportInventoryBatchRecord
} from "./reports.types.js";

type InventoryReportFilters = {
  productId?: string;
  search?: string;
};

const reportInventoryBatchInclude = {
  product: {
    select: {
      id: true,
      internalCode: true,
      commercialName: true,
      genericName: true,
      baseUnit: {
        select: {
          id: true,
          name: true,
          abbreviation: true
        }
      }
    }
  }
} satisfies Prisma.InventoryBatchInclude;

export class ReportsRepository {
  listGrossSalesBetween(start: Date, end: Date): Promise<DailyGrossSaleRecord[]> {
    return prisma.sale.findMany({
      where: {
        confirmedAt: {
          gte: start,
          lt: end
        }
      },
      select: {
        id: true,
        confirmedAt: true,
        totalAmount: true
      },
      orderBy: [{ confirmedAt: "asc" }, { id: "asc" }]
    });
  }

  listCancelledSalesBetween(start: Date, end: Date): Promise<DailyCancelledSaleRecord[]> {
    return prisma.sale.findMany({
      where: {
        status: "cancelled",
        cancelledAt: {
          gte: start,
          lt: end
        }
      },
      select: {
        id: true,
        cancelledAt: true,
        totalAmount: true
      },
      orderBy: [{ cancelledAt: "asc" }, { id: "asc" }]
    }) as Promise<DailyCancelledSaleRecord[]>;
  }

  listSaleReturnsBetween(start: Date, end: Date): Promise<DailySaleReturnRecord[]> {
    return prisma.saleReturn.findMany({
      where: {
        returnedAt: {
          gte: start,
          lt: end
        }
      },
      select: {
        id: true,
        returnedAt: true,
        refundAmount: true
      },
      orderBy: [{ returnedAt: "asc" }, { id: "asc" }]
    });
  }

  listRefundedPaymentsBetween(start: Date, end: Date): Promise<DailyRefundedPaymentRecord[]> {
    return prisma.payment.findMany({
      where: {
        status: "refunded",
        reversedAt: {
          gte: start,
          lt: end
        }
      },
      select: {
        id: true,
        reversedAt: true,
        refundAmount: true,
        saleTotal: true,
        saleReturn: {
          select: {
            id: true
          }
        }
      },
      orderBy: [{ reversedAt: "asc" }, { id: "asc" }]
    }) as Promise<DailyRefundedPaymentRecord[]>;
  }

  listAvailableInventoryBatches(filters: InventoryReportFilters = {}): Promise<ReportInventoryBatchRecord[]> {
    return prisma.inventoryBatch.findMany({
      where: {
        ...buildAvailableBatchWhere(filters)
      },
      include: reportInventoryBatchInclude,
      orderBy: [
        { product: { commercialName: "asc" } },
        { product: { internalCode: "asc" } },
        { expirationDate: "asc" },
        { createdAt: "asc" },
        { id: "asc" }
      ]
    });
  }

  listExpiringInventoryBatches(
    startDate: Date,
    endDate: Date,
    filters: InventoryReportFilters = {}
  ): Promise<ReportInventoryBatchRecord[]> {
    return prisma.inventoryBatch.findMany({
      where: {
        ...buildAvailableBatchWhere(filters),
        expirationDate: {
          gte: startDate,
          lt: endDate
        }
      },
      include: reportInventoryBatchInclude,
      orderBy: [
        { expirationDate: "asc" },
        { product: { commercialName: "asc" } },
        { product: { internalCode: "asc" } },
        { createdAt: "asc" },
        { id: "asc" }
      ]
    });
  }
}

function buildAvailableBatchWhere(filters: InventoryReportFilters): Prisma.InventoryBatchWhereInput {
  const search = filters.search?.trim();

  return {
    productId: filters.productId,
    status: "active",
    availableQuantity: {
      gt: new Prisma.Decimal(0)
    },
    OR: search
      ? [
          { batchNumber: { contains: search, mode: "insensitive" } },
          { product: { commercialName: { contains: search, mode: "insensitive" } } },
          { product: { genericName: { contains: search, mode: "insensitive" } } },
          { product: { internalCode: { contains: search, mode: "insensitive" } } }
        ]
      : undefined
  };
}
