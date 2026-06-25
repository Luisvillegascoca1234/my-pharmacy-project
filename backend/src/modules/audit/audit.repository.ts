import type { Prisma } from "@prisma/client";
import { prisma } from "../../infrastructure/prisma/prisma.client.js";
import type { AuditLogListFilters, AuditLogListResult } from "./audit.types.js";

const auditUserSelect = {
  id: true,
  fullName: true,
  email: true,
  status: true
} satisfies Prisma.UserSelect;

const auditLogInclude = {
  actorUser: {
    select: auditUserSelect
  }
} satisfies Prisma.AuditLogInclude;

export class AuditRepository {
  async listAuditLogs(filters: AuditLogListFilters): Promise<AuditLogListResult> {
    const where = buildAuditLogWhere(filters);
    const [data, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: auditLogInclude,
        orderBy: [{ createdAt: "desc" }, { id: "asc" }],
        skip: (filters.page - 1) * filters.pageSize,
        take: filters.pageSize
      }),
      prisma.auditLog.count({ where })
    ]);

    return { data, total };
  }
}

function buildAuditLogWhere(filters: AuditLogListFilters): Prisma.AuditLogWhereInput {
  return {
    action: buildTextFilter(filters.action),
    actorUserId: filters.actorUserId,
    entityType: buildTextFilter(filters.entityType),
    entityId: filters.entityId,
    createdAt: buildDateTimeRangeFilter(filters.fromDate, filters.toDate)
  };
}

function buildTextFilter(value?: string): Prisma.StringFilter | undefined {
  const normalizedValue = value?.trim();

  if (!normalizedValue) {
    return undefined;
  }

  return {
    contains: normalizedValue,
    mode: "insensitive"
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
