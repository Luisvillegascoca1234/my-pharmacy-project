import { Prisma } from "@prisma/client";
import { prisma } from "../../infrastructure/prisma/prisma.client.js";
import type {
  PendingCartItemSnapshotData,
  PendingCartListFilters,
  PendingCartListResult,
  PendingCartProductRecord,
  PendingCartRecord,
  PendingCartsTransactionClient,
  SavePendingCartData,
  UpdatePendingCartData
} from "./pending-carts.types.js";

type PrismaClient = typeof prisma;
type Client = PrismaClient | PendingCartsTransactionClient;

const pendingCartInclude = {
  ownerUser: {
    select: {
      id: true,
      fullName: true,
      email: true,
      status: true
    }
  },
  items: {
    orderBy: {
      createdAt: "asc"
    }
  }
} satisfies Prisma.PendingCartInclude;

const pendingCartProductSelect = {
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
  },
  inventoryBatches: {
    select: {
      availableQuantity: true,
      expirationDate: true,
      createdAt: true
    },
    orderBy: [{ expirationDate: "asc" }, { createdAt: "asc" }, { id: "asc" }]
  }
} satisfies Prisma.ProductSelect;

export class PendingCartsRepository {
  runInTransaction<T>(callback: (client: PendingCartsTransactionClient) => Promise<T>) {
    return prisma.$transaction(callback);
  }

  expireActiveCarts(now: Date, client: Client = prisma) {
    return client.pendingCart.updateMany({
      where: {
        status: "active",
        expiresAt: {
          lte: now
        }
      },
      data: {
        status: "expired",
        expiredAt: now
      }
    });
  }

  async list(filters: PendingCartListFilters, client: Client = prisma): Promise<PendingCartListResult> {
    const where = buildPendingCartWhere(filters);
    const [data, total] = await Promise.all([
      client.pendingCart.findMany({
        where,
        include: pendingCartInclude,
        orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }, { id: "asc" }],
        skip: (filters.page - 1) * filters.pageSize,
        take: filters.pageSize
      }),
      client.pendingCart.count({ where })
    ]);

    return { data, total };
  }

  findById(id: string, client: Client = prisma): Promise<PendingCartRecord | null> {
    return client.pendingCart.findUnique({
      where: { id },
      include: pendingCartInclude
    });
  }

  findProductsByIds(productIds: string[], today: Date, client: Client = prisma): Promise<PendingCartProductRecord[]> {
    return client.product.findMany({
      where: {
        id: {
          in: productIds
        }
      },
      select: {
        ...pendingCartProductSelect,
        inventoryBatches: {
          where: buildSaleableBatchWhere(today),
          select: pendingCartProductSelect.inventoryBatches.select,
          orderBy: pendingCartProductSelect.inventoryBatches.orderBy
        }
      }
    });
  }

  createCart(
    data: SavePendingCartData,
    items: PendingCartItemSnapshotData[],
    client: Client = prisma
  ): Promise<PendingCartRecord> {
    return client.pendingCart.create({
      data: {
        ownerUserId: data.ownerUserId,
        name: data.name,
        note: data.note,
        referenceTotalAmount: data.referenceTotalAmount,
        expiresAt: data.expiresAt,
        items: {
          create: items
        }
      },
      include: pendingCartInclude
    });
  }

  async replaceCartItems(
    id: string,
    data: UpdatePendingCartData,
    items: PendingCartItemSnapshotData[],
    client: Client = prisma
  ): Promise<PendingCartRecord> {
    await client.pendingCartItem.deleteMany({
      where: {
        pendingCartId: id
      }
    });

    return client.pendingCart.update({
      where: { id },
      data: {
        name: data.name,
        note: data.note,
        referenceTotalAmount: data.referenceTotalAmount,
        items: {
          create: items
        }
      },
      include: pendingCartInclude
    });
  }

  markExpired(id: string, now: Date, client: Client = prisma): Promise<PendingCartRecord> {
    return client.pendingCart.update({
      where: { id },
      data: {
        status: "expired",
        expiredAt: now
      },
      include: pendingCartInclude
    });
  }

  discardCart(id: string, discardReason: string | undefined, discardedAt: Date, client: Client = prisma) {
    return client.pendingCart.update({
      where: { id },
      data: {
        discardReason,
        discardedAt,
        status: "discarded"
      },
      include: pendingCartInclude
    });
  }

  convertCart(id: string, convertedSaleId: string, convertedAt: Date, client: Client = prisma) {
    return client.pendingCart.update({
      where: { id },
      data: {
        convertedAt,
        convertedSaleId,
        status: "converted"
      },
      include: pendingCartInclude
    });
  }

  createAuditLog(
    action: string,
    entityId: string,
    actorUserId: string | undefined,
    metadata: unknown,
    context: { ipAddress?: string; userAgent?: string },
    client: Client = prisma
  ) {
    return client.auditLog.create({
      data: {
        action,
        actorUserId,
        entityType: "pending_cart",
        entityId,
        metadata: metadata as Prisma.InputJsonValue,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent
      },
      select: {
        id: true
      }
    });
  }
}

function buildPendingCartWhere(filters: PendingCartListFilters): Prisma.PendingCartWhereInput {
  const search = filters.search?.trim();

  return {
    ownerUserId: filters.includeAll ? filters.sellerUserId : filters.ownerUserId,
    status: filters.status,
    OR: search
      ? [
          { name: { contains: search, mode: "insensitive" } },
          { note: { contains: search, mode: "insensitive" } },
          { ownerUser: { fullName: { contains: search, mode: "insensitive" } } },
          { items: { some: { commercialName: { contains: search, mode: "insensitive" } } } },
          { items: { some: { internalCode: { contains: search, mode: "insensitive" } } } },
          { items: { some: { barcode: { contains: search, mode: "insensitive" } } } }
        ]
      : undefined
  };
}

function buildSaleableBatchWhere(today: Date): Prisma.InventoryBatchWhereInput {
  return {
    status: "active",
    availableQuantity: {
      gt: new Prisma.Decimal(0)
    },
    OR: [{ expirationDate: null }, { expirationDate: { gte: today } }]
  };
}
