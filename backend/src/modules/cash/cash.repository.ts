import type { Prisma } from "@prisma/client";
import { prisma } from "../../infrastructure/prisma/prisma.client.js";
import type {
  AuditContext,
  CashSessionActorRecord,
  CashSessionCloseData,
  CashSessionCreateData,
  CashSessionListFilters,
  CashSessionListResult,
  CashSessionWithUsers
} from "./cash.types.js";

const cashSessionInclude = {
  openedByUser: {
    select: {
      id: true,
      fullName: true,
      email: true,
      status: true
    }
  },
  closedByUser: {
    select: {
      id: true,
      fullName: true,
      email: true,
      status: true
    }
  }
} satisfies Prisma.CashSessionInclude;

type PrismaClient = typeof prisma;
type PrismaTransaction = Prisma.TransactionClient;
type Client = PrismaClient | PrismaTransaction;

export class CashSessionsRepository {
  runInTransaction<T>(callback: (client: PrismaTransaction) => Promise<T>) {
    return prisma.$transaction(callback);
  }

  async listCashSessions(filters: CashSessionListFilters, client: Client = prisma): Promise<CashSessionListResult> {
    const where = buildCashSessionWhere(filters);
    const [data, total] = await Promise.all([
      client.cashSession.findMany({
        where,
        include: cashSessionInclude,
        orderBy: [{ openedAt: "desc" }, { createdAt: "desc" }, { id: "asc" }],
        skip: (filters.page - 1) * filters.pageSize,
        take: filters.pageSize
      }),
      client.cashSession.count({ where })
    ]);

    return { data, total };
  }

  findUserById(id: string, client: Client = prisma): Promise<CashSessionActorRecord | null> {
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

  findCashSessionById(id: string, client: Client = prisma): Promise<CashSessionWithUsers | null> {
    return client.cashSession.findUnique({
      where: { id },
      include: cashSessionInclude
    });
  }

  findOpenCashSessionByUserId(userId: string, client: Client = prisma): Promise<CashSessionWithUsers | null> {
    return client.cashSession.findFirst({
      where: {
        openedByUserId: userId,
        status: "open",
        closedAt: null
      },
      include: cashSessionInclude,
      orderBy: {
        openedAt: "desc"
      }
    });
  }

  async getNextCashSessionCorrelativeNumber(client: Client = prisma) {
    const lastCashSession = await client.cashSession.findFirst({
      orderBy: {
        correlativeNumber: "desc"
      },
      select: {
        correlativeNumber: true
      }
    });

    return (lastCashSession?.correlativeNumber ?? 0) + 1;
  }

  createOpenCashSession(input: CashSessionCreateData, client: Client = prisma): Promise<CashSessionWithUsers> {
    return client.cashSession.create({
      data: {
        correlativeNumber: input.correlativeNumber,
        correlativeCode: input.correlativeCode,
        openedByUserId: input.openedByUserId,
        initialAmount: input.initialAmount,
        expectedAmount: input.expectedAmount,
        openingNote: input.openingNote,
        status: "open"
      },
      include: cashSessionInclude
    });
  }

  closeCashSession(id: string, input: CashSessionCloseData, client: Client = prisma): Promise<CashSessionWithUsers> {
    return client.cashSession.update({
      where: { id },
      data: {
        closedByUserId: input.closedByUserId,
        countedAmount: input.countedAmount,
        expectedAmount: input.expectedAmount,
        differenceAmount: input.differenceAmount,
        closingNote: input.closingNote,
        closedAt: input.closedAt,
        status: "closed"
      },
      include: cashSessionInclude
    });
  }

  createAuditLog(action: string, entityId: string, metadata: unknown, context: AuditContext, client: Client = prisma) {
    return client.auditLog.create({
      data: {
        action,
        actorUserId: context.actorUserId,
        entityType: "cash_session",
        entityId,
        metadata: metadata as Prisma.InputJsonValue,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent
      }
    });
  }
}

function buildCashSessionWhere(filters: CashSessionListFilters): Prisma.CashSessionWhereInput {
  return {
    openedAt: buildDateTimeRangeFilter(filters.fromDate, filters.toDate),
    openedByUserId: filters.openedByUserId,
    status: filters.status
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
