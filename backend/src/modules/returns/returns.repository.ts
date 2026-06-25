import type { Prisma } from "@prisma/client";
import { prisma } from "../../infrastructure/prisma/prisma.client.js";
import type {
  CreateReturnInventoryMovementData,
  CreateSaleReturnData,
  CreateSaleReturnItemData,
  ReturnableSaleListFilters,
  ReturnableSaleListResult,
  ReturnsAuditContext,
  ReturnsInventoryMovementRecord,
  ReturnsSaleReturnWithRelations,
  ReturnsSaleWithRelations,
  ReturnsTransactionClient,
  ReturnsUserRecord,
  SaleReturnListFilters,
  SaleReturnListResult
} from "./returns.types.js";

type PrismaClient = typeof prisma;
type Client = PrismaClient | ReturnsTransactionClient;

const returnsUserSelect = {
  id: true,
  fullName: true,
  email: true,
  status: true
} satisfies Prisma.UserSelect;

const returnsSaleItemBatchSelect = {
  id: true,
  saleItemId: true,
  batchId: true,
  quantity: true,
  unitCostBase: true,
  totalCost: true,
  inventoryMovementId: true,
  batch: {
    select: {
      id: true,
      availableQuantity: true,
      batchNumber: true,
      expirationDate: true,
      status: true
    }
  }
} satisfies Prisma.SaleItemBatchSelect;

const returnsSaleInclude = {
  sellerUser: {
    select: returnsUserSelect
  },
  cashSession: {
    select: {
      id: true,
      correlativeCode: true,
      openedByUserId: true,
      status: true,
      closedAt: true,
      expectedAmount: true
    }
  },
  payment: true,
  items: {
    include: {
      consumptions: {
        select: returnsSaleItemBatchSelect,
        orderBy: {
          createdAt: "asc"
        }
      }
    },
    orderBy: {
      createdAt: "asc"
    }
  },
  preparedInvoices: {
    where: {
      status: "prepared"
    },
    select: {
      id: true,
      status: true
    },
    orderBy: {
      preparedAt: "desc"
    }
  },
  saleReturn: {
    select: {
      id: true
    }
  }
} satisfies Prisma.SaleInclude;

const saleReturnInclude = {
  actorUser: {
    select: returnsUserSelect
  },
  sale: {
    select: {
      correlativeCode: true
    }
  },
  payment: {
    select: {
      id: true,
      method: true,
      status: true,
      refundAmount: true,
      reversedAt: true
    }
  },
  items: {
    include: {
      saleItem: {
        select: {
          id: true,
          internalCode: true,
          commercialName: true,
          genericName: true
        }
      }
    },
    orderBy: {
      createdAt: "asc"
    }
  }
} satisfies Prisma.SaleReturnInclude;

export class ReturnsRepository {
  runInTransaction<T>(callback: (client: ReturnsTransactionClient) => Promise<T>) {
    return prisma.$transaction(callback);
  }

  async listReturnableSales(
    filters: ReturnableSaleListFilters,
    client: Client = prisma
  ): Promise<ReturnableSaleListResult> {
    const where = buildReturnableSaleWhere(filters);
    const [data, total] = await Promise.all([
      client.sale.findMany({
        where,
        include: returnsSaleInclude,
        orderBy: [{ confirmedAt: "desc" }, { createdAt: "desc" }, { id: "asc" }],
        skip: (filters.page - 1) * filters.pageSize,
        take: filters.pageSize
      }),
      client.sale.count({ where })
    ]);

    return { data, total };
  }

  findSaleWithRelations(id: string, client: Client = prisma): Promise<ReturnsSaleWithRelations | null> {
    return client.sale.findUnique({
      where: { id },
      include: returnsSaleInclude
    });
  }

  async listSaleReturns(filters: SaleReturnListFilters, client: Client = prisma): Promise<SaleReturnListResult> {
    const where = buildSaleReturnWhere(filters);
    const [data, total] = await Promise.all([
      client.saleReturn.findMany({
        where,
        include: saleReturnInclude,
        orderBy: [{ returnedAt: "desc" }, { createdAt: "desc" }, { id: "asc" }],
        skip: (filters.page - 1) * filters.pageSize,
        take: filters.pageSize
      }),
      client.saleReturn.count({ where })
    ]);

    return { data, total };
  }

  findSaleReturnById(id: string, client: Client = prisma): Promise<ReturnsSaleReturnWithRelations | null> {
    return client.saleReturn.findUnique({
      where: { id },
      include: saleReturnInclude
    });
  }

  createSaleReturn(input: CreateSaleReturnData, client: Client = prisma): Promise<ReturnsSaleReturnWithRelations> {
    return client.saleReturn.create({
      data: input,
      include: saleReturnInclude
    });
  }

  createSaleReturnItem(input: CreateSaleReturnItemData, client: Client = prisma) {
    return client.saleReturnItem.create({
      data: input,
      select: {
        id: true
      }
    });
  }

  async markSaleReturned(id: string, client: Client = prisma) {
    const result = await client.sale.updateMany({
      where: {
        id,
        status: "confirmed"
      },
      data: {
        status: "returned"
      }
    });

    return result.count;
  }

  async markPaymentRefunded(id: string, refundAmount: Prisma.Decimal, refundedAt: Date, client: Client = prisma) {
    const result = await client.payment.updateMany({
      where: {
        id,
        status: "paid"
      },
      data: {
        status: "refunded",
        refundAmount,
        reversedAt: refundedAt
      }
    });

    return result.count;
  }

  updateBatchQuantity(id: string, availableQuantity: Prisma.Decimal, client: Client = prisma) {
    return client.inventoryBatch.update({
      where: { id },
      data: {
        availableQuantity,
        status: availableQuantity.equals(0) ? "depleted" : "active"
      },
      select: {
        id: true
      }
    });
  }

  createReturnInventoryMovement(
    data: CreateReturnInventoryMovementData,
    client: Client = prisma
  ): Promise<ReturnsInventoryMovementRecord> {
    return client.inventoryMovement.create({
      data: {
        batchId: data.batchId,
        productId: data.productId,
        type: "sale_returned",
        quantityBase: data.quantityBase,
        unitCostBase: data.unitCostBase,
        referenceType: "sale_return",
        referenceId: data.referenceId,
        referenceItemId: data.referenceItemId,
        actorUserId: data.actorUserId,
        reason: data.reason
      },
      select: {
        id: true
      }
    });
  }

  findUserById(id: string, client: Client = prisma): Promise<ReturnsUserRecord | null> {
    return client.user.findUnique({
      where: { id },
      select: {
        id: true,
        fullName: true,
        email: true,
        status: true
      }
    });
  }

  createAuditLog(action: string, entityId: string, metadata: unknown, context: ReturnsAuditContext, client: Client = prisma) {
    return client.auditLog.create({
      data: {
        action,
        actorUserId: context.actorUserId,
        entityType: "sale_return",
        entityId,
        metadata: metadata as Prisma.InputJsonValue,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent
      }
    });
  }
}

function buildReturnableSaleWhere(filters: ReturnableSaleListFilters): Prisma.SaleWhereInput {
  const normalizedSearch = filters.search?.trim();

  return {
    confirmedAt: buildDateTimeRangeFilter(filters.fromDate, filters.toDate),
    sellerUserId: filters.sellerUserId,
    OR: normalizedSearch
      ? [
          { correlativeCode: { contains: normalizedSearch, mode: "insensitive" } },
          { sellerUser: { fullName: { contains: normalizedSearch, mode: "insensitive" } } },
          { sellerUser: { email: { contains: normalizedSearch, mode: "insensitive" } } },
          { cashSession: { correlativeCode: { contains: normalizedSearch, mode: "insensitive" } } },
          { items: { some: { commercialName: { contains: normalizedSearch, mode: "insensitive" } } } },
          { items: { some: { internalCode: { contains: normalizedSearch, mode: "insensitive" } } } },
          { items: { some: { barcode: { contains: normalizedSearch, mode: "insensitive" } } } }
        ]
      : undefined
  };
}

function buildSaleReturnWhere(filters: SaleReturnListFilters): Prisma.SaleReturnWhereInput {
  const normalizedSearch = filters.search?.trim();

  return {
    actorUserId: filters.actorUserId,
    returnedAt: buildDateTimeRangeFilter(filters.fromDate, filters.toDate),
    saleId: filters.saleId,
    OR: normalizedSearch
      ? [
          { sale: { correlativeCode: { contains: normalizedSearch, mode: "insensitive" } } },
          { actorUser: { fullName: { contains: normalizedSearch, mode: "insensitive" } } },
          { actorUser: { email: { contains: normalizedSearch, mode: "insensitive" } } },
          { reason: { contains: normalizedSearch, mode: "insensitive" } },
          { items: { some: { saleItem: { commercialName: { contains: normalizedSearch, mode: "insensitive" } } } } },
          { items: { some: { saleItem: { internalCode: { contains: normalizedSearch, mode: "insensitive" } } } } }
        ]
      : undefined
  };
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
