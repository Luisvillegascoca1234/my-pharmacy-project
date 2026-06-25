import { Prisma } from "@prisma/client";
import { prisma } from "../../infrastructure/prisma/prisma.client.js";
import type {
  CsvExportFilters,
  ExportAuditContext,
  InventoryMovementCsvExportRecord,
  SalesCsvExportRecord
} from "./exports.types.js";

const salesCsvSelect = {
  id: true,
  correlativeCode: true,
  status: true,
  totalAmount: true,
  totalCost: true,
  totalMargin: true,
  confirmedAt: true,
  cancelledAt: true,
  sellerUser: {
    select: {
      fullName: true
    }
  },
  cashSession: {
    select: {
      correlativeCode: true
    }
  },
  saleReturn: {
    select: {
      returnedAt: true
    }
  }
} satisfies Prisma.SaleSelect;

const inventoryMovementCsvSelect = {
  id: true,
  type: true,
  batchId: true,
  productId: true,
  quantityBase: true,
  unitCostBase: true,
  referenceType: true,
  referenceId: true,
  actorUser: {
    select: {
      fullName: true
    }
  },
  reason: true,
  createdAt: true,
  product: {
    select: {
      internalCode: true,
      commercialName: true
    }
  },
  batch: {
    select: {
      batchNumber: true
    }
  }
} satisfies Prisma.InventoryMovementSelect;

export class ExportsRepository {
  listSalesForCsv(filters: CsvExportFilters): Promise<SalesCsvExportRecord[]> {
    return prisma.sale.findMany({
      where: {
        confirmedAt: buildDateTimeRangeFilter(filters.fromDate, filters.toDate)
      },
      select: salesCsvSelect,
      orderBy: [{ confirmedAt: "asc" }, { correlativeNumber: "asc" }, { id: "asc" }]
    });
  }

  listInventoryMovementsForCsv(filters: CsvExportFilters): Promise<InventoryMovementCsvExportRecord[]> {
    return prisma.inventoryMovement.findMany({
      where: {
        createdAt: buildDateTimeRangeFilter(filters.fromDate, filters.toDate)
      },
      select: inventoryMovementCsvSelect,
      orderBy: [{ createdAt: "asc" }, { id: "asc" }]
    });
  }

  createCsvDownloadAuditLog(input: {
    fileName: string;
    filters: CsvExportFilters;
    rowCount: number;
    context: ExportAuditContext;
  }) {
    return prisma.auditLog.create({
      data: {
        action: "CSV_EXPORT_DOWNLOADED",
        actorUserId: input.context.actorUserId,
        entityType: "export",
        entityId: input.fileName,
        metadata: {
          fileName: input.fileName,
          filters: input.filters,
          rowCount: input.rowCount
        },
        ipAddress: input.context.ipAddress,
        userAgent: input.context.userAgent
      }
    });
  }
}

function buildDateTimeRangeFilter(fromDate?: string, toDate?: string): Prisma.DateTimeFilter | undefined {
  if (!fromDate && !toDate) {
    return undefined;
  }

  return {
    gte: fromDate ? toDateOnlyStart(fromDate) : undefined,
    lt: toDate ? addDays(toDateOnlyStart(toDate), 1) : undefined
  };
}

function toDateOnlyStart(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

function addDays(value: Date, days: number) {
  const nextDate = new Date(value);
  nextDate.setUTCDate(nextDate.getUTCDate() + days);

  return nextDate;
}
