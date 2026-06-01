import { Prisma } from "@prisma/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PosProductsService, type PosProductsRepositoryPort } from "./pos.service.js";
import type { PosProductRecord, PosProductSearchFilters, PosProductSearchResult } from "./pos.types.js";

describe("PosProductsService", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("maps saleable POS products with stock and next expiration", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-31T12:00:00.000Z"));
    const repository = new FakePosProductsRepository({
      data: [
        makePosProductRecord({
          barcode: null,
          inventoryBatches: [
            makeBatch({ availableQuantity: 5, expirationDate: new Date("2026-08-10T00:00:00.000Z") }),
            makeBatch({ availableQuantity: 3, expirationDate: new Date("2026-07-01T00:00:00.000Z") })
          ]
        })
      ],
      total: 5
    });
    const service = new PosProductsService(repository);

    const result = await service.searchProducts({
      code: "MED-001",
      page: 2,
      pageSize: 2,
      search: "para"
    });

    expect(repository.searchProductsCalls).toEqual([
      {
        code: "MED-001",
        page: 2,
        pageSize: 2,
        search: "para",
        today: new Date("2026-05-31T00:00:00.000Z")
      }
    ]);
    expect(result).toEqual({
      data: [
        {
          id: "product-1",
          internalCode: "MED-001",
          barcode: undefined,
          commercialName: "Paracetamol 500 mg",
          genericName: "Paracetamol",
          salePrice: 12.5,
          baseUnit: {
            id: "unit-1",
            name: "Unidad",
            abbreviation: "u"
          },
          saleableStock: 8,
          nextExpirationDate: "2026-07-01"
        }
      ],
      pagination: {
        page: 2,
        pageSize: 2,
        total: 5,
        totalPages: 3
      }
    });
  });

  it("omits next expiration when available stock has no expiration date", async () => {
    const service = new PosProductsService(
      new FakePosProductsRepository({
        data: [
          makePosProductRecord({
            barcode: "779000000001",
            genericName: null,
            inventoryBatches: [makeBatch({ availableQuantity: 10, expirationDate: null })]
          })
        ],
        total: 1
      })
    );

    const result = await service.searchProducts({ page: 1, pageSize: 20 });

    expect(result.data[0]).toMatchObject({
      barcode: "779000000001",
      genericName: undefined,
      nextExpirationDate: undefined,
      saleableStock: 10
    });
  });
});

class FakePosProductsRepository implements PosProductsRepositoryPort {
  readonly searchProductsCalls: PosProductSearchFilters[] = [];

  constructor(private readonly result: PosProductSearchResult) {}

  async searchProducts(filters: PosProductSearchFilters) {
    this.searchProductsCalls.push(filters);

    return this.result;
  }
}

function makePosProductRecord(overrides: Partial<PosProductRecord> = {}): PosProductRecord {
  return {
    id: "product-1",
    internalCode: "MED-001",
    barcode: "779000000001",
    commercialName: "Paracetamol 500 mg",
    genericName: "Paracetamol",
    salePrice: new Prisma.Decimal(12.5),
    baseUnit: {
      id: "unit-1",
      name: "Unidad",
      abbreviation: "u"
    },
    inventoryBatches: [makeBatch()],
    ...overrides
  };
}

function makeBatch(overrides: Omit<Partial<PosProductRecord["inventoryBatches"][number]>, "availableQuantity"> & {
  availableQuantity?: Prisma.Decimal.Value;
} = {}) {
  const { availableQuantity = 1, ...rest } = overrides;

  return {
    expirationDate: new Date("2026-07-01T00:00:00.000Z"),
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    ...rest,
    availableQuantity: new Prisma.Decimal(availableQuantity)
  };
}
