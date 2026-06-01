import { Prisma } from "@prisma/client";
import { prisma } from "../../infrastructure/prisma/prisma.client.js";
import type {
  AuditContext,
  CreateCashPaymentData,
  CreateConfirmedSaleData,
  CreateConfirmedSaleItemData,
  CreateSaleInventoryMovementData,
  CreateSaleItemBatchData,
  SaleActorRecord,
  SaleCashSessionRecord,
  SaleFefoBatchRecord,
  SaleInventoryConsumptionRecord,
  SaleInventoryMovementRecord,
  SaleProductRecord,
  SalesListFilters,
  SalesListResult,
  SaleWithRelations,
  SalesTransactionClient
} from "./sales.types.js";

type PrismaClient = typeof prisma;
type Client = PrismaClient | SalesTransactionClient;

const saleFefoBatchSelect = {
  id: true,
  productId: true,
  availableQuantity: true,
  baseUnitCost: true,
  batchNumber: true,
  expirationDate: true,
  status: true,
  createdAt: true
} satisfies Prisma.InventoryBatchSelect;

const saleItemBatchSelect = {
  id: true,
  saleItemId: true,
  batchId: true,
  quantity: true,
  unitCostBase: true,
  totalCost: true,
  inventoryMovementId: true,
  batch: {
    select: {
      availableQuantity: true,
      batchNumber: true,
      expirationDate: true,
      status: true
    }
  }
} satisfies Prisma.SaleItemBatchSelect;

const saleInclude = {
  sellerUser: {
    select: {
      id: true,
      fullName: true,
      email: true,
      status: true
    }
  },
  cancelledByUser: {
    select: {
      id: true,
      fullName: true,
      email: true,
      status: true
    }
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
  items: {
    include: {
      consumptions: {
        select: saleItemBatchSelect,
        orderBy: {
          createdAt: "asc"
        }
      }
    },
    orderBy: {
      createdAt: "asc"
    }
  },
  payment: true
} satisfies Prisma.SaleInclude;

export class SalesRepository {
  runInTransaction<T>(callback: (client: SalesTransactionClient) => Promise<T>) {
    return prisma.$transaction(callback);
  }

  async listSales(filters: SalesListFilters, client: Client = prisma): Promise<SalesListResult> {
    const where = buildSaleWhere(filters);
    const [data, total] = await Promise.all([
      client.sale.findMany({
        where,
        include: saleInclude,
        orderBy: [{ confirmedAt: "desc" }, { createdAt: "desc" }, { id: "asc" }],
        skip: (filters.page - 1) * filters.pageSize,
        take: filters.pageSize
      }),
      client.sale.count({ where })
    ]);

    return { data, total };
  }

  findUserById(id: string, client: Client = prisma): Promise<SaleActorRecord | null> {
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

  findOpenCashSessionByUserId(userId: string, client: Client = prisma): Promise<SaleCashSessionRecord | null> {
    return client.cashSession.findFirst({
      where: {
        openedByUserId: userId,
        status: "open",
        closedAt: null
      },
      select: {
        id: true,
        correlativeCode: true,
        openedByUserId: true,
        status: true,
        closedAt: true,
        expectedAmount: true
      },
      orderBy: {
        openedAt: "desc"
      }
    });
  }

  findProductsByIds(productIds: string[], client: Client = prisma): Promise<SaleProductRecord[]> {
    return client.product.findMany({
      where: {
        id: {
          in: productIds
        }
      },
      select: {
        id: true,
        internalCode: true,
        barcode: true,
        commercialName: true,
        genericName: true,
        baseUnitId: true,
        salePrice: true,
        status: true,
        baseUnit: {
          select: {
            id: true,
            name: true,
            abbreviation: true
          }
        }
      }
    });
  }

  async getNextSaleCorrelativeNumber(client: Client = prisma) {
    const lastSale = await client.sale.findFirst({
      orderBy: {
        correlativeNumber: "desc"
      },
      select: {
        correlativeNumber: true
      }
    });

    return (lastSale?.correlativeNumber ?? 0) + 1;
  }

  createConfirmedSale(
    input: CreateConfirmedSaleData,
    items: CreateConfirmedSaleItemData[],
    client: Client = prisma
  ): Promise<SaleWithRelations> {
    return client.sale.create({
      data: {
        correlativeNumber: input.correlativeNumber,
        correlativeCode: input.correlativeCode,
        sellerUserId: input.sellerUserId,
        cashSessionId: input.cashSessionId,
        status: "confirmed",
        totalAmount: input.totalAmount,
        totalCost: input.totalCost,
        totalMargin: input.totalMargin,
        confirmedAt: input.confirmedAt,
        items: {
          create: items
        }
      },
      include: saleInclude
    });
  }

  updateSaleItemFinancials(
    id: string,
    input: {
      totalCost: Prisma.Decimal;
      margin: Prisma.Decimal;
    },
    client: Client = prisma
  ) {
    return client.saleItem.update({
      where: { id },
      data: input,
      select: {
        id: true
      }
    });
  }

  updateSaleTotals(
    id: string,
    input: {
      totalCost: Prisma.Decimal;
      totalMargin: Prisma.Decimal;
    },
    client: Client = prisma
  ) {
    return client.sale.update({
      where: { id },
      data: input,
      select: {
        id: true
      }
    });
  }

  createCashPayment(data: CreateCashPaymentData, client: Client = prisma) {
    return client.payment.create({
      data: {
        saleId: data.saleId,
        cashSessionId: data.cashSessionId,
        method: "cash",
        saleTotal: data.saleTotal,
        receivedAmount: data.receivedAmount,
        changeAmount: data.changeAmount,
        status: "paid",
        paidAt: data.paidAt
      },
      select: {
        id: true
      }
    });
  }

  incrementCashSessionExpectedAmount(id: string, amount: Prisma.Decimal, client: Client = prisma) {
    return client.cashSession.update({
      where: { id },
      data: {
        expectedAmount: {
          increment: amount
        }
      },
      select: {
        id: true
      }
    });
  }

  getSaleById(id: string, client: Client = prisma): Promise<SaleWithRelations | null> {
    return client.sale.findUnique({
      where: { id },
      include: saleInclude
    });
  }

  async markSaleCancelled(
    id: string,
    input: {
      cancelReason: string;
      cancelledAt: Date;
      cancelledByUserId: string;
    },
    client: Client = prisma
  ) {
    const result = await client.sale.updateMany({
      where: {
        id,
        status: "confirmed"
      },
      data: {
        status: "cancelled",
        cancelReason: input.cancelReason,
        cancelledAt: input.cancelledAt,
        cancelledByUserId: input.cancelledByUserId
      }
    });

    return result.count;
  }

  markPaymentReverted(id: string, reversedAt: Date, client: Client = prisma) {
    return client.payment.update({
      where: { id },
      data: {
        status: "reverted",
        reversedAt
      },
      select: {
        id: true
      }
    });
  }

  async listSaleableBatchesByProductIds(
    productIds: string[],
    today: Date,
    client: Client = prisma
  ): Promise<SaleFefoBatchRecord[]> {
    const batches = await client.inventoryBatch.findMany({
      where: {
        productId: {
          in: productIds
        },
        status: "active",
        availableQuantity: {
          gt: new Prisma.Decimal(0)
        },
        OR: [{ expirationDate: null }, { expirationDate: { gte: today } }]
      },
      select: saleFefoBatchSelect,
      orderBy: [{ productId: "asc" }, { createdAt: "asc" }, { id: "asc" }]
    });

    return batches.sort(compareFefoBatches);
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

  createSaleInventoryMovement(
    data: CreateSaleInventoryMovementData,
    client: Client = prisma
  ): Promise<SaleInventoryMovementRecord> {
    return client.inventoryMovement.create({
      data: {
        batchId: data.batchId,
        productId: data.productId,
        type: "sale_confirmed",
        quantityBase: data.quantityBase,
        unitCostBase: data.unitCostBase,
        referenceType: "sale",
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

  createSaleCancellationInventoryMovement(
    data: CreateSaleInventoryMovementData,
    client: Client = prisma
  ): Promise<SaleInventoryMovementRecord> {
    return client.inventoryMovement.create({
      data: {
        batchId: data.batchId,
        productId: data.productId,
        type: "sale_cancelled",
        quantityBase: data.quantityBase,
        unitCostBase: data.unitCostBase,
        referenceType: "sale",
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

  createSaleItemBatch(
    data: CreateSaleItemBatchData,
    client: Client = prisma
  ): Promise<SaleInventoryConsumptionRecord> {
    return client.saleItemBatch.create({
      data,
      select: saleItemBatchSelect
    });
  }

  createAuditLog(action: string, entityId: string, metadata: unknown, context: AuditContext, client: Client = prisma) {
    return client.auditLog.create({
      data: {
        action,
        actorUserId: context.actorUserId,
        entityType: "sale",
        entityId,
        metadata: metadata as Prisma.InputJsonValue,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent
      }
    });
  }
}

function compareFefoBatches(firstBatch: SaleFefoBatchRecord, secondBatch: SaleFefoBatchRecord) {
  const productComparison = firstBatch.productId.localeCompare(secondBatch.productId);

  if (productComparison !== 0) {
    return productComparison;
  }

  const firstExpirationTime = firstBatch.expirationDate?.getTime() ?? Number.POSITIVE_INFINITY;
  const secondExpirationTime = secondBatch.expirationDate?.getTime() ?? Number.POSITIVE_INFINITY;

  if (firstExpirationTime !== secondExpirationTime) {
    return firstExpirationTime - secondExpirationTime;
  }

  const createdAtComparison = firstBatch.createdAt.getTime() - secondBatch.createdAt.getTime();

  if (createdAtComparison !== 0) {
    return createdAtComparison;
  }

  return firstBatch.id.localeCompare(secondBatch.id);
}

function buildSaleWhere(filters: SalesListFilters): Prisma.SaleWhereInput {
  const normalizedSearch = filters.search?.trim();

  return {
    cashSessionId: filters.cashSessionId,
    confirmedAt: buildDateTimeRangeFilter(filters.fromDate, filters.toDate),
    sellerUserId: filters.sellerUserId,
    status: filters.status,
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
