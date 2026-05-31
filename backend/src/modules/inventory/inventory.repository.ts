import { Prisma } from "@prisma/client";
import { prisma } from "../../infrastructure/prisma/prisma.client.js";
import type {
  AuditContext,
  CreateInventoryAdjustmentData,
  CreateInventoryBatchData,
  CreateInventoryMovementData,
  InventoryBatchRecord,
  InventoryBatchWithPurchaseItem,
  InventoryMovementFilters,
  InventoryMovementListResult,
  InventoryMovementRecord,
  InventoryTransactionClient
} from "./inventory.types.js";

type PrismaClient = typeof prisma;
type Client = PrismaClient | InventoryTransactionClient;

const productSummarySelect = {
  id: true,
  internalCode: true,
  commercialName: true,
  genericName: true,
  minimumStock: true,
  baseUnit: {
    select: {
      id: true,
      name: true,
      abbreviation: true
    }
  }
} satisfies Prisma.ProductSelect;

const batchInclude = {
  product: {
    select: productSummarySelect
  },
  purchaseItem: {
    select: {
      id: true,
      purchaseId: true,
      purchase: {
        select: {
          supplier: {
            select: {
              businessName: true
            }
          }
        }
      }
    }
  }
} satisfies Prisma.InventoryBatchInclude;

const movementInclude = {
  product: {
    select: productSummarySelect
  },
  batch: {
    select: {
      batchNumber: true,
      expirationDate: true
    }
  },
  actorUser: {
    select: {
      id: true,
      fullName: true,
      email: true
    }
  }
} satisfies Prisma.InventoryMovementInclude;

export class InventoryRepository {
  runInTransaction<T>(callback: (client: InventoryTransactionClient) => Promise<T>) {
    return prisma.$transaction(callback);
  }

  createBatch(data: CreateInventoryBatchData, client: InventoryTransactionClient) {
    return client.inventoryBatch.create({
      data: {
        ...data,
        status: "active"
      }
    });
  }

  createMovement(data: CreateInventoryMovementData, client: InventoryTransactionClient) {
    return client.inventoryMovement.create({
      data
    });
  }

  createAdjustment(data: CreateInventoryAdjustmentData, client: InventoryTransactionClient) {
    return client.inventoryAdjustment.create({
      data
    });
  }

  createAuditLog(action: string, entityId: string, metadata: unknown, context: AuditContext, client: Client = prisma) {
    return client.auditLog.create({
      data: {
        action,
        actorUserId: context.actorUserId,
        entityType: "inventory",
        entityId,
        metadata: metadata as Prisma.InputJsonValue,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent
      }
    });
  }

  findBatchById(id: string, client: Client = prisma): Promise<InventoryBatchRecord | null> {
    return client.inventoryBatch.findUnique({
      where: { id },
      include: batchInclude
    });
  }

  findBatchesByPurchaseId(
    purchaseId: string,
    client: InventoryTransactionClient
  ): Promise<InventoryBatchWithPurchaseItem[]> {
    return client.inventoryBatch.findMany({
      where: {
        purchaseItem: {
          purchaseId
        }
      },
      include: {
        purchaseItem: {
          select: {
            id: true,
            productId: true,
            baseQuantity: true,
            baseUnitCost: true,
            isInventoryTracked: true,
            batchNumber: true,
            expirationDate: true
          }
        }
      },
      orderBy: {
        createdAt: "asc"
      }
    });
  }

  listBatches(filters: { productId?: string; search?: string } = {}): Promise<InventoryBatchRecord[]> {
    const search = filters.search?.trim();

    return prisma.inventoryBatch.findMany({
      where: {
        productId: filters.productId,
        status: {
          not: "cancelled"
        },
        OR: search
          ? [
              { batchNumber: { contains: search, mode: "insensitive" } },
              { product: { commercialName: { contains: search, mode: "insensitive" } } },
              { product: { genericName: { contains: search, mode: "insensitive" } } },
              { product: { internalCode: { contains: search, mode: "insensitive" } } }
            ]
          : undefined
      },
      include: batchInclude,
      orderBy: [{ product: { commercialName: "asc" } }, { expirationDate: "asc" }, { createdAt: "asc" }]
    });
  }

  listFefoBatches(productId: string, today: Date): Promise<InventoryBatchRecord[]> {
    return prisma.inventoryBatch.findMany({
      where: {
        productId,
        status: "active",
        availableQuantity: {
          gt: new Prisma.Decimal(0)
        },
        OR: [{ expirationDate: null }, { expirationDate: { gte: today } }]
      },
      include: batchInclude,
      orderBy: [{ expirationDate: "asc" }, { createdAt: "asc" }]
    });
  }

  listMovements(filters: InventoryMovementFilters): Promise<InventoryMovementListResult> {
    const where = buildMovementWhere(filters);

    return prisma.$transaction(async (tx) => {
      const [data, total] = await Promise.all([
        tx.inventoryMovement.findMany({
          where,
          include: movementInclude,
          orderBy: [{ createdAt: "desc" }, { id: "asc" }],
          skip: (filters.page - 1) * filters.pageSize,
          take: filters.pageSize
        }),
        tx.inventoryMovement.count({ where })
      ]);

      return { data: data as InventoryMovementRecord[], total };
    });
  }

  updateBatchQuantity(id: string, availableQuantity: Prisma.Decimal, client: InventoryTransactionClient) {
    return client.inventoryBatch.update({
      where: { id },
      data: {
        availableQuantity,
        status: availableQuantity.equals(0) ? "depleted" : "active"
      }
    });
  }

  cancelBatch(id: string, client: InventoryTransactionClient) {
    return client.inventoryBatch.update({
      where: { id },
      data: {
        availableQuantity: new Prisma.Decimal(0),
        status: "cancelled"
      }
    });
  }
}

function buildMovementWhere(filters: InventoryMovementFilters): Prisma.InventoryMovementWhereInput {
  const search = filters.search?.trim();

  return {
    productId: filters.productId,
    type: filters.type,
    createdAt: buildDateFilter(filters.fromDate, filters.toDate),
    OR: search
      ? [
          { product: { commercialName: { contains: search, mode: "insensitive" } } },
          { product: { genericName: { contains: search, mode: "insensitive" } } },
          { product: { internalCode: { contains: search, mode: "insensitive" } } },
          { batch: { batchNumber: { contains: search, mode: "insensitive" } } },
          { reason: { contains: search, mode: "insensitive" } }
        ]
      : undefined
  };
}

function buildDateFilter(fromDate?: string, toDate?: string): Prisma.DateTimeFilter | undefined {
  if (!fromDate && !toDate) {
    return undefined;
  }

  return {
    gte: fromDate ? new Date(`${fromDate}T00:00:00.000Z`) : undefined,
    lte: toDate ? new Date(`${toDate}T23:59:59.999Z`) : undefined
  };
}
