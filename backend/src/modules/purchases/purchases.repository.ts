import type { Prisma } from "@prisma/client";
import { prisma } from "../../infrastructure/prisma/prisma.client.js";
import type {
  AuditContext,
  ProductWithPurchaseRelations,
  PurchaseDraftData,
  PurchaseDraftItemData,
  PurchaseDraftUpdateData,
  PurchasesListFilters,
  PurchasesListResult,
  PurchaseWithRelations,
  SupplierRecord,
  UserRecord
} from "./purchases.types.js";

const purchaseSummaryInclude = {
  supplier: true
} satisfies Prisma.PurchaseInclude;

const purchaseInclude = {
  supplier: true,
  createdByUser: {
    select: {
      id: true,
      fullName: true,
      email: true,
      status: true
    }
  },
  receivedByUser: {
    select: {
      id: true,
      fullName: true,
      email: true,
      status: true
    }
  },
  items: {
    include: {
      product: true,
      unit: true
    },
    orderBy: {
      createdAt: "asc"
    }
  }
} satisfies Prisma.PurchaseInclude;

const productInclude = {
  units: {
    include: {
      unit: true
    }
  }
} satisfies Prisma.ProductInclude;

type PrismaClient = typeof prisma;
type PrismaTransaction = Prisma.TransactionClient;
type Client = PrismaClient | PrismaTransaction;

export class PurchasesRepository {
  runInTransaction<T>(callback: (client: PrismaTransaction) => Promise<T>) {
    return prisma.$transaction(callback);
  }

  async listPurchases(filters: PurchasesListFilters): Promise<PurchasesListResult> {
    const where = buildPurchaseWhere(filters);

    const [data, total] = await prisma.$transaction([
      prisma.purchase.findMany({
        where,
        include: purchaseSummaryInclude,
        orderBy: [{ purchaseDate: "desc" }, { createdAt: "desc" }, { id: "asc" }],
        skip: (filters.page - 1) * filters.pageSize,
        take: filters.pageSize
      }),
      prisma.purchase.count({ where })
    ]);

    return { data, total };
  }

  getPurchase(id: string, client: Client = prisma): Promise<PurchaseWithRelations | null> {
    return client.purchase.findUnique({
      where: { id },
      include: purchaseInclude
    });
  }

  findSupplierById(id: string, client: Client = prisma): Promise<SupplierRecord | null> {
    return client.supplier.findUnique({
      where: { id }
    });
  }

  findUserById(id: string, client: Client = prisma): Promise<UserRecord | null> {
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

  findProductById(id: string, client: Client = prisma): Promise<ProductWithPurchaseRelations | null> {
    return client.product.findUnique({
      where: { id },
      include: productInclude
    });
  }

  createDraftPurchase(input: PurchaseDraftData, items: PurchaseDraftItemData[], context: AuditContext) {
    return prisma.$transaction(async (tx) => {
      const purchase = await tx.purchase.create({
        data: {
          supplierId: input.supplierId,
          purchaseDate: input.purchaseDate,
          totalAmount: input.totalAmount,
          createdByUserId: input.createdByUserId,
          notes: input.notes,
          status: "draft",
          items: {
            create: items
          }
        },
        include: purchaseInclude
      });

      await this.createAuditLog("PURCHASE_CREATED", purchase.id, buildDraftAuditMetadata(purchase), context, tx);

      return purchase;
    });
  }

  replaceDraftPurchase(id: string, input: PurchaseDraftUpdateData, items: PurchaseDraftItemData[], context: AuditContext) {
    return prisma.$transaction(async (tx) => {
      await tx.purchaseItem.deleteMany({
        where: { purchaseId: id }
      });

      await tx.purchase.update({
        where: { id },
        data: {
          supplierId: input.supplierId,
          purchaseDate: input.purchaseDate,
          totalAmount: input.totalAmount,
          notes: input.notes,
          items: {
            create: items
          }
        }
      });

      const purchase = await this.getPurchase(id, tx);

      if (!purchase) {
        throw new Error("Purchase disappeared during draft replacement.");
      }

      await this.createAuditLog("PURCHASE_UPDATED", purchase.id, buildDraftAuditMetadata(purchase), context, tx);

      return purchase;
    });
  }

  markPurchaseReceived(
    id: string,
    input: {
      receivedByUserId: string;
      receivedAt: Date;
      receiveNotes: string | null;
    },
    client: Client = prisma
  ) {
    return client.purchase.update({
      where: { id },
      data: {
        status: "received",
        receivedByUserId: input.receivedByUserId,
        receivedAt: input.receivedAt,
        receiveNotes: input.receiveNotes
      },
      include: purchaseInclude
    });
  }

  markPurchaseCancelled(
    id: string,
    input: {
      cancelledAt: Date;
      cancelReason: string;
    },
    client: Client = prisma
  ) {
    return client.purchase.update({
      where: { id },
      data: {
        status: "cancelled",
        cancelledAt: input.cancelledAt,
        cancelReason: input.cancelReason
      },
      include: purchaseInclude
    });
  }

  createAuditLog(action: string, entityId: string, metadata: unknown, context: AuditContext, client: Client = prisma) {
    return client.auditLog.create({
      data: {
        action,
        actorUserId: context.actorUserId,
        entityType: "purchase",
        entityId,
        metadata: metadata as Prisma.InputJsonValue,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent
      }
    });
  }
}

function buildPurchaseWhere(filters: PurchasesListFilters): Prisma.PurchaseWhereInput {
  const normalizedSearch = filters.search?.trim();

  return {
    status: filters.status,
    supplierId: filters.supplierId,
    purchaseDate: buildDateFilter(filters.fromDate, filters.toDate),
    OR: normalizedSearch
      ? [
          { supplier: { is: { businessName: { contains: normalizedSearch, mode: "insensitive" } } } },
          { supplier: { is: { nit: { contains: normalizedSearch, mode: "insensitive" } } } },
          { notes: { contains: normalizedSearch, mode: "insensitive" } }
        ]
      : undefined
  };
}

function buildDateFilter(fromDate?: string, toDate?: string): Prisma.DateTimeFilter | undefined {
  if (!fromDate && !toDate) {
    return undefined;
  }

  return {
    gte: fromDate ? toPureDate(fromDate) : undefined,
    lte: toDate ? toPureDate(toDate) : undefined
  };
}

function toPureDate(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

function buildDraftAuditMetadata(purchase: PurchaseWithRelations) {
  return {
    supplierId: purchase.supplierId,
    purchaseDate: toDateOnly(purchase.purchaseDate),
    status: purchase.status,
    totalAmount: Number(purchase.totalAmount),
    itemCount: purchase.items.length
  };
}

function toDateOnly(value: Date) {
  return value.toISOString().slice(0, 10);
}
