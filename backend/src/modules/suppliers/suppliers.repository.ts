import type { Prisma } from "@prisma/client";
import { prisma } from "../../infrastructure/prisma/prisma.client.js";
import type {
  AuditContext,
  SupplierCreateData,
  SuppliersListFilters,
  SuppliersListResult,
  SupplierRecord,
  SupplierUpdateData
} from "./suppliers.types.js";

export class SuppliersRepository {
  async listSuppliers(filters: SuppliersListFilters): Promise<SuppliersListResult> {
    const normalizedSearch = filters.search?.trim();
    const where: Prisma.SupplierWhereInput = {
      status: filters.status,
      OR: normalizedSearch
        ? [
            { businessName: { contains: normalizedSearch, mode: "insensitive" } },
            { nit: { contains: normalizedSearch, mode: "insensitive" } },
            { contactName: { contains: normalizedSearch, mode: "insensitive" } },
            { phone: { contains: normalizedSearch, mode: "insensitive" } }
          ]
        : undefined
    };

    const [data, total] = await prisma.$transaction([
      prisma.supplier.findMany({
        where,
        orderBy: [{ businessName: "asc" }, { id: "asc" }],
        skip: (filters.page - 1) * filters.pageSize,
        take: filters.pageSize
      }),
      prisma.supplier.count({ where })
    ]);

    return { data, total };
  }

  findSupplierById(id: string): Promise<SupplierRecord | null> {
    return prisma.supplier.findUnique({
      where: { id }
    });
  }

  findSupplierByNit(nit: string, exceptId?: string): Promise<SupplierRecord | null> {
    return prisma.supplier.findFirst({
      where: {
        nit,
        id: exceptId ? { not: exceptId } : undefined
      }
    });
  }

  createSupplier(input: SupplierCreateData): Promise<SupplierRecord> {
    return prisma.supplier.create({
      data: input
    });
  }

  updateSupplier(id: string, input: SupplierUpdateData): Promise<SupplierRecord> {
    return prisma.supplier.update({
      where: { id },
      data: input
    });
  }

  createAuditLog(action: string, entityId: string, metadata: unknown, context: AuditContext) {
    return prisma.auditLog.create({
      data: {
        action,
        actorUserId: context.actorUserId,
        entityType: "supplier",
        entityId,
        metadata: metadata as Prisma.InputJsonValue,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent
      }
    });
  }
}
