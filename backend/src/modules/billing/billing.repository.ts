import type { Prisma } from "@prisma/client";
import { prisma } from "../../infrastructure/prisma/prisma.client.js";
import type {
  BillingAuditContext,
  BillingInvoiceableSaleListFilters,
  BillingInvoiceableSaleListResult,
  BillingPreparedInvoiceListFilters,
  BillingPreparedInvoiceListResult,
  BillingPreparedInvoiceWithRelations,
  BillingSaleWithRelations,
  BillingTransactionClient,
  BillingUserRecord,
  CancelPreparedInvoiceData,
  CreatePreparedInvoiceData,
  CreatePreparedInvoiceItemData
} from "./billing.types.js";

type PrismaClient = typeof prisma;
type Client = PrismaClient | BillingTransactionClient;

const billingUserSelect = {
  id: true,
  fullName: true,
  email: true,
  status: true
} satisfies Prisma.UserSelect;

const billingSaleInclude = {
  sellerUser: {
    select: billingUserSelect
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
    select: {
      id: true,
      productId: true,
      internalCode: true,
      barcode: true,
      commercialName: true,
      genericName: true,
      baseUnitId: true,
      baseUnitName: true,
      baseUnitAbbreviation: true,
      unitPrice: true,
      quantity: true,
      subtotal: true,
      createdAt: true,
      updatedAt: true
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

const preparedInvoiceInclude = {
  sellerUser: {
    select: billingUserSelect
  },
  cancelledByUser: {
    select: billingUserSelect
  },
  items: {
    orderBy: {
      createdAt: "asc"
    }
  }
} satisfies Prisma.PreparedInvoiceInclude;

export class BillingRepository {
  runInTransaction<T>(callback: (client: BillingTransactionClient) => Promise<T>) {
    return prisma.$transaction(callback);
  }

  async listInvoiceableSales(
    filters: BillingInvoiceableSaleListFilters,
    client: Client = prisma
  ): Promise<BillingInvoiceableSaleListResult> {
    const where = buildInvoiceableSaleWhere(filters);
    const [data, total] = await Promise.all([
      client.sale.findMany({
        where,
        include: billingSaleInclude,
        orderBy: [{ confirmedAt: "desc" }, { createdAt: "desc" }, { id: "asc" }],
        skip: (filters.page - 1) * filters.pageSize,
        take: filters.pageSize
      }),
      client.sale.count({ where })
    ]);

    return { data, total };
  }

  findSaleWithRelations(id: string, client: Client = prisma): Promise<BillingSaleWithRelations | null> {
    return client.sale.findUnique({
      where: { id },
      include: billingSaleInclude
    });
  }

  async listPreparedInvoices(
    filters: BillingPreparedInvoiceListFilters,
    client: Client = prisma
  ): Promise<BillingPreparedInvoiceListResult> {
    const where = buildPreparedInvoiceWhere(filters);
    const [data, total] = await Promise.all([
      client.preparedInvoice.findMany({
        where,
        include: preparedInvoiceInclude,
        orderBy: [{ preparedAt: "desc" }, { createdAt: "desc" }, { id: "asc" }],
        skip: (filters.page - 1) * filters.pageSize,
        take: filters.pageSize
      }),
      client.preparedInvoice.count({ where })
    ]);

    return { data, total };
  }

  findPreparedInvoiceById(id: string, client: Client = prisma): Promise<BillingPreparedInvoiceWithRelations | null> {
    return client.preparedInvoice.findUnique({
      where: { id },
      include: preparedInvoiceInclude
    });
  }

  async markPreparedInvoiceCancelled(
    id: string,
    input: CancelPreparedInvoiceData,
    client: Client = prisma
  ): Promise<number> {
    const result = await client.preparedInvoice.updateMany({
      where: {
        id,
        status: "prepared"
      },
      data: {
        status: "cancelled",
        cancelledAt: input.cancelledAt,
        cancelledByUserId: input.cancelledByUserId,
        cancelReason: input.cancelReason
      }
    });

    return result.count;
  }

  async getNextPreparedInvoiceCorrelativeNumber(client: Client = prisma) {
    const lastPreparedInvoice = await client.preparedInvoice.findFirst({
      orderBy: {
        correlativeNumber: "desc"
      },
      select: {
        correlativeNumber: true
      }
    });

    return (lastPreparedInvoice?.correlativeNumber ?? 0) + 1;
  }

  createPreparedInvoice(
    input: CreatePreparedInvoiceData,
    items: CreatePreparedInvoiceItemData[],
    client: Client = prisma
  ): Promise<BillingPreparedInvoiceWithRelations> {
    return client.preparedInvoice.create({
      data: {
        correlativeNumber: input.correlativeNumber,
        correlativeCode: input.correlativeCode,
        saleId: input.saleId,
        sellerUserId: input.sellerUserId,
        status: "prepared",
        saleCorrelativeCode: input.saleCorrelativeCode,
        cashSessionId: input.cashSessionId,
        cashSessionCode: input.cashSessionCode,
        sellerName: input.sellerName,
        sellerEmail: input.sellerEmail,
        customerNit: input.customerNit,
        customerBusinessName: input.customerBusinessName,
        fiscalNotes: input.fiscalNotes,
        totalAmount: input.totalAmount,
        preparedAt: input.preparedAt,
        items: {
          create: items
        }
      },
      include: preparedInvoiceInclude
    });
  }

  findUserById(id: string, client: Client = prisma): Promise<BillingUserRecord | null> {
    return client.user.findUnique({
      where: { id },
      select: {
        id: true,
        fullName: true,
        email: true,
        status: true,
        role: {
          select: {
            name: true
          }
        }
      }
    });
  }

  createAuditLog(action: string, entityId: string, metadata: unknown, context: BillingAuditContext, client: Client = prisma) {
    return client.auditLog.create({
      data: {
        action,
        actorUserId: context.actorUserId,
        entityType: "prepared_invoice",
        entityId,
        metadata: metadata as Prisma.InputJsonValue,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent
      }
    });
  }
}

function buildInvoiceableSaleWhere(filters: BillingInvoiceableSaleListFilters): Prisma.SaleWhereInput {
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

function buildPreparedInvoiceWhere(filters: BillingPreparedInvoiceListFilters): Prisma.PreparedInvoiceWhereInput {
  const normalizedSearch = filters.search?.trim();
  const normalizedCorrelativeCode = filters.correlativeCode?.trim();

  return {
    correlativeCode: normalizedCorrelativeCode
      ? { contains: normalizedCorrelativeCode, mode: "insensitive" }
      : undefined,
    preparedAt: buildDateTimeRangeFilter(filters.fromDate, filters.toDate),
    saleId: filters.saleId,
    status: filters.status,
    OR: normalizedSearch
      ? [
          { correlativeCode: { contains: normalizedSearch, mode: "insensitive" } },
          { saleCorrelativeCode: { contains: normalizedSearch, mode: "insensitive" } },
          { customerNit: { contains: normalizedSearch, mode: "insensitive" } },
          { customerBusinessName: { contains: normalizedSearch, mode: "insensitive" } },
          { sellerName: { contains: normalizedSearch, mode: "insensitive" } },
          { sellerEmail: { contains: normalizedSearch, mode: "insensitive" } },
          { cashSessionCode: { contains: normalizedSearch, mode: "insensitive" } }
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
