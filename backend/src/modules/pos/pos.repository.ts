import { Prisma } from "@prisma/client";
import { prisma } from "../../infrastructure/prisma/prisma.client.js";
import type { PosProductSearchFilters, PosProductSearchResult } from "./pos.types.js";

export class PosProductsRepository {
  async searchProducts(filters: PosProductSearchFilters): Promise<PosProductSearchResult> {
    const where = buildProductWhere(filters);

    const [data, total] = await prisma.$transaction([
      prisma.product.findMany({
        where,
        select: buildProductSelect(filters.today),
        orderBy: [{ commercialName: "asc" }, { internalCode: "asc" }, { id: "asc" }],
        skip: (filters.page - 1) * filters.pageSize,
        take: filters.pageSize
      }),
      prisma.product.count({ where })
    ]);

    return { data, total };
  }
}

function buildProductSelect(today: Date) {
  return {
    id: true,
    internalCode: true,
    barcode: true,
    commercialName: true,
    genericName: true,
    salePrice: true,
    baseUnit: {
      select: {
        id: true,
        name: true,
        abbreviation: true
      }
    },
    inventoryBatches: {
      where: buildSaleableBatchWhere(today),
      select: {
        availableQuantity: true,
        expirationDate: true,
        createdAt: true
      },
      orderBy: [{ expirationDate: "asc" }, { createdAt: "asc" }, { id: "asc" }]
    }
  } satisfies Prisma.ProductSelect;
}

function buildProductWhere(filters: PosProductSearchFilters): Prisma.ProductWhereInput {
  const search = filters.search?.trim();
  const code = filters.code?.trim();
  const textFilters: Prisma.ProductWhereInput[] = [];

  if (search) {
    textFilters.push({
      OR: [
        { commercialName: { contains: search, mode: "insensitive" } },
        { genericName: { contains: search, mode: "insensitive" } },
        { internalCode: { contains: search, mode: "insensitive" } },
        { barcode: { contains: search, mode: "insensitive" } }
      ]
    });
  }

  if (code) {
    textFilters.push({
      OR: [
        { internalCode: { equals: code, mode: "insensitive" } },
        { barcode: { equals: code, mode: "insensitive" } }
      ]
    });
  }

  return {
    status: "active",
    inventoryBatches: {
      some: buildSaleableBatchWhere(filters.today)
    },
    AND: textFilters.length > 0 ? textFilters : undefined
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
