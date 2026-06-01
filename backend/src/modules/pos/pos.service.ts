import { Prisma } from "@prisma/client";
import {
  PosProductSchema,
  PosProductsListResponseSchema,
  type PosProduct,
  type PosProductsListResponse,
  type PosProductSearchQuery
} from "@pharmacy-pos/shared";
import { PosProductsRepository } from "./pos.repository.js";
import type { PosProductRecord, PosProductSearchFilters, PosProductSearchResult } from "./pos.types.js";

export type PosProductsRepositoryPort = {
  searchProducts(filters: PosProductSearchFilters): Promise<PosProductSearchResult>;
};

export class PosProductsService {
  constructor(private readonly posProductsRepository: PosProductsRepositoryPort = new PosProductsRepository()) {}

  async searchProducts(query: PosProductSearchQuery): Promise<PosProductsListResponse> {
    const page = query.page;
    const pageSize = query.pageSize;
    const result = await this.posProductsRepository.searchProducts({
      code: query.code,
      page,
      pageSize,
      search: query.search,
      today: toDateOnlyStart(new Date())
    });

    return PosProductsListResponseSchema.parse({
      data: result.data.map(toPosProduct),
      pagination: {
        page,
        pageSize,
        total: result.total,
        totalPages: Math.ceil(result.total / pageSize)
      }
    });
  }
}

function toPosProduct(product: PosProductRecord): PosProduct {
  const saleableStock = product.inventoryBatches.reduce(
    (total, batch) => total.plus(batch.availableQuantity),
    new Prisma.Decimal(0)
  );
  const nextExpirationDate = product.inventoryBatches
    .map((batch) => batch.expirationDate)
    .filter((expirationDate): expirationDate is Date => Boolean(expirationDate))
    .sort((firstDate, secondDate) => firstDate.getTime() - secondDate.getTime())[0];

  return PosProductSchema.parse({
    id: product.id,
    internalCode: product.internalCode,
    barcode: product.barcode ?? undefined,
    commercialName: product.commercialName,
    genericName: product.genericName ?? undefined,
    salePrice: Number(product.salePrice),
    baseUnit: product.baseUnit,
    saleableStock: Number(saleableStock),
    nextExpirationDate: nextExpirationDate ? toDateOnly(nextExpirationDate) : undefined
  });
}

function toDateOnlyStart(value: Date) {
  return new Date(`${toDateOnly(value)}T00:00:00.000Z`);
}

function toDateOnly(value: Date) {
  return value.toISOString().slice(0, 10);
}
