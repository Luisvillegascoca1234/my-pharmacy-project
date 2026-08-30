import { Prisma } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { UpdateProductStockConfigurationSchema } from "@pharmacy-pos/shared";
import { captureHttpError, expectHttpError } from "../../tests/utils/http-error.js";
import { canAccessStockPlanning } from "./stock-planning.routes.js";
import {
  StockPlanningService,
  type StockPlanningRepositoryPort
} from "./stock-planning.service.js";
import type {
  ProductStockConfigurationUpdate,
  StockPlanningAuditContext,
  StockPlanningFilters,
  StockPlanningProductRecord
} from "./stock-planning.types.js";

describe("StockPlanningService cold-start references", () => {
  it("publishes a configured reference with no-history maturity and inherited coverage", async () => {
    const repository = new FakeStockPlanningRepository();
    repository.products = [makeProduct()];
    const service = new StockPlanningService(repository, () => new Date("2026-07-23T15:00:00.000Z"));

    const response = await service.listProducts({});

    expect(response.configuration).toEqual({
      coverageDays: 30,
      timezone: "America/La_Paz"
    });
    expect(response.data).toEqual([
      expect.objectContaining({
        maturity: "no_history",
        coverage: {
          days: 30,
          source: "global"
        },
        usableStock: 3,
        result: {
          kind: "configured_reference",
          quantityBase: 7,
          wasRounded: false,
          preferredPresentation: undefined
        },
        warnings: ["missing_preferred_presentation"]
      })
    ]);
    expect(repository.lastBusinessDate).toEqual(new Date("2026-07-23T00:00:00.000Z"));
  });

  it("inherits the latest persisted global coverage", async () => {
    const repository = new FakeStockPlanningRepository();
    repository.products = [makeProduct()];
    const service = new StockPlanningService(
      repository,
      () => new Date("2026-07-23T15:00:00.000Z"),
      { getCurrentConfiguration: async () => ({ coverageDays: 45 }) }
    );

    const response = await service.listProducts({});

    expect(response.configuration.coverageDays).toBe(45);
    expect(response.data[0].coverage).toEqual({ days: 45, source: "global" });
  });

  it("never returns a negative reference when usable stock reaches minimum stock", async () => {
    const repository = new FakeStockPlanningRepository();
    repository.products = [makeProduct({ minimumStock: decimal(10), availableQuantities: [6, 5] })];
    const service = new StockPlanningService(repository);

    const response = await service.listProducts({});

    expect(response.data[0].usableStock).toBe(11);
    expect(response.data[0].result.quantityBase).toBe(0);
  });

  it("rounds the reference upward to a full preferred presentation", async () => {
    const repository = new FakeStockPlanningRepository();
    repository.products = [
      makeProduct({
        availableQuantities: [3],
        stockCoverageDays: 45,
        preferredRestockUnit: {
          id: "presentation-1",
          productId: "product-1",
          unitId: "unit-box",
          conversionFactor: decimal(6),
          createdAt: new Date(),
          updatedAt: new Date(),
          unit: {
            id: "unit-box",
            name: "Caja",
            abbreviation: "caja"
          }
        }
      })
    ];
    const service = new StockPlanningService(repository);

    const response = await service.listProducts({});

    expect(response.data[0].coverage).toEqual({ days: 45, source: "product" });
    expect(response.data[0].result).toEqual({
      kind: "configured_reference",
      quantityBase: 12,
      wasRounded: true,
      preferredPresentation: {
        id: "presentation-1",
        unitId: "unit-box",
        name: "Caja",
        abbreviation: "caja",
        conversionFactor: 6
      }
    });
    expect(response.data[0].warnings).toEqual([]);
  });

  it("does not over-round an exact decimal presentation multiple", async () => {
    const repository = new FakeStockPlanningRepository();
    repository.products = [
      makeProduct({
        minimumStock: decimal("0.14"),
        availableQuantities: [0],
        preferredRestockUnit: {
          id: "presentation-1",
          productId: "product-1",
          unitId: "unit-dose",
          conversionFactor: decimal("0.01"),
          createdAt: new Date(),
          updatedAt: new Date(),
          unit: {
            id: "unit-dose",
            name: "Dosis",
            abbreviation: "dosis"
          }
        }
      })
    ];
    const service = new StockPlanningService(repository);

    const response = await service.listProducts({});

    expect(response.data[0].result.quantityBase).toBe(0.14);
    expect(response.data[0].result.wasRounded).toBe(false);
  });

  it("persists product parameters with audit context and without inventory operations", async () => {
    const repository = new FakeStockPlanningRepository();
    repository.products = [makeProduct()];
    repository.product = {
      id: "product-1",
      stockCriticality: "normal",
      stockCoverageDays: null,
      preferredRestockUnitId: null
    };
    repository.productUnit = { id: "presentation-1" };
    const service = new StockPlanningService(repository);
    const context = {
      actorUserId: "admin-1",
      ipAddress: "127.0.0.1",
      userAgent: "vitest"
    };

    await service.updateProductConfiguration(
      "product-1",
      {
        criticality: "critical",
        coverageDays: 45,
        preferredPresentationId: "presentation-1"
      },
      context
    );

    expect(repository.updateCalls).toEqual([
      {
        productId: "product-1",
        update: {
          stockCriticality: "critical",
          stockCoverageDays: 45,
          preferredRestockUnitId: "presentation-1"
        },
        previousConfiguration: {
          stockCriticality: "normal",
          stockCoverageDays: null,
          preferredRestockUnitId: null
        },
        context
      }
    ]);
    expect("createInventoryMovement" in repository).toBe(false);
  });

  it("rejects a preferred presentation from another product", async () => {
    const repository = new FakeStockPlanningRepository();
    repository.product = {
      id: "product-1",
      stockCriticality: "normal",
      stockCoverageDays: null,
      preferredRestockUnitId: null
    };
    const service = new StockPlanningService(repository);

    const error = await captureHttpError(() =>
      service.updateProductConfiguration(
        "product-1",
        { preferredPresentationId: "foreign-presentation" },
        { actorUserId: "admin-1" }
      )
    );

    expectHttpError(error, {
      code: "INVALID_PREFERRED_PRESENTATION",
      statusCode: 400
    });
  });

  it("publishes a FEFO recommendation with draft context, reliable cost, summary, grouping and deduplicated alerts", async () => {
    const repository = new FakeStockPlanningRepository();
    const product = makeProduct({
      minimumStock: decimal(10),
      availableQuantities: [3, 10],
      preferredRestockUnit: {
        id: "presentation-1",
        productId: "product-1",
        unitId: "unit-box",
        conversionFactor: decimal(6),
        createdAt: new Date(),
        updatedAt: new Date(),
        unit: { id: "unit-box", name: "Caja", abbreviation: "caja" }
      }
    });
    product.stockCriticality = "critical";
    product.inventoryBatches = product.inventoryBatches.map((batch) => ({
      ...batch,
      expirationDate: new Date("2026-07-24T00:00:00.000Z")
    }));
    product.purchaseContext = {
      draftQuantity: decimal(50),
      draftCount: 2,
      latestReliableBaseUnitCost: decimal(2)
    };
    product.stockPlanningForecasts = [{
      executionId: "execution-1",
      maturity: "operational",
      confidence: "high",
      model: "recent_naive",
      historyDays: 120,
      demandDays: 80,
      censoredDays: 0,
      parameters: {},
      metrics: {
        scaledError: 0.5,
        meanAbsoluteError: 1,
        bias: 0,
        evaluatedPoints: 20
      },
      fingerprint: "forecast-fingerprint",
      engineVersion: "engine-v1",
      rulesVersion: "rules-v1",
      warnings: [],
      recommendation: null,
      forecastPoints: [
        {
          localDate: new Date("2026-07-24T00:00:00.000Z"),
          central: decimal(5),
          lower80: decimal(5),
          upper80: decimal(5)
        },
        {
          localDate: new Date("2026-07-25T00:00:00.000Z"),
          central: decimal(5),
          lower80: decimal(5),
          upper80: decimal(5)
        }
      ]
    }];
    repository.products = [product];
    const service = new StockPlanningService(
      repository,
      () => new Date("2026-07-23T15:00:00.000Z"),
      {
        getCurrentConfiguration: async () => ({
          coverageDays: 30,
          normalServiceLevel: 0.9,
          highServiceLevel: 0.95,
          criticalServiceLevel: 0.99
        }),
        getEngineState: async () => ({ stale: true })
      }
    );

    const response = await service.listProducts({ groupBy: "supplier", risk: "expiry" });
    const recommendation = response.data[0]!.result;

    expect(recommendation).toEqual({
      kind: "demand_forecast",
      quantityBase: 6,
      wasRounded: true,
      preferredPresentation: expect.objectContaining({ conversionFactor: 6 }),
      serviceLevel: 0.99,
      centralDemand: 10,
      demandQuantile: 10,
      safetyStock: 0,
      targetStock: 10,
      estimatedCost: 12
    });
    expect(response.data[0]).toMatchObject({
      usableStock: 5,
      expiryRiskStock: 8,
      unusableStock: 0,
      draftPurchaseQuantity: 50,
      draftPurchaseCount: 2,
      risks: ["replenishment", "critical_stockout", "expiry", "stale"]
    });
    expect(response.data[0]!.warnings).toContain("draft_purchases_are_context_only");
    expect(response.summary).toEqual({
      productCount: 1,
      replenishmentCount: 1,
      criticalRiskCount: 1,
      expiryRiskCount: 1,
      staleCount: 1
    });
    expect(response.groups).toEqual([
      expect.objectContaining({
        supplierId: "supplier-1",
        productIds: ["product-1"]
      })
    ]);
    expect(new Set(response.alerts?.map((alert) => alert.id)).size).toBe(response.alerts?.length);
    expect(response.alerts?.map((alert) => alert.priority)).toEqual([
      "critical",
      "high",
      "high",
      "medium"
    ]);
  });

  it("omits estimated cost when no reliable purchase evidence exists", async () => {
    const repository = new FakeStockPlanningRepository();
    const product = makeProduct({
      preferredRestockUnit: {
        id: "presentation-current",
        productId: "product-1",
        unitId: "unit-box",
        conversionFactor: decimal(10),
        createdAt: new Date("2026-07-23T00:00:00.000Z"),
        updatedAt: new Date("2026-07-23T00:00:00.000Z"),
        unit: { id: "unit-box", name: "Caja", abbreviation: "caja" }
      }
    });
    product.purchaseContext.latestReliableBaseUnitCost = decimal(4);
    product.stockPlanningForecasts = [{
      executionId: "execution-1",
      maturity: "low_confidence",
      confidence: "low",
      model: "recent_naive",
      historyDays: 84,
      demandDays: 6,
      censoredDays: 0,
      parameters: {},
      metrics: { scaledError: 1, meanAbsoluteError: 1, bias: 0, evaluatedPoints: 10 },
      fingerprint: "forecast-fingerprint",
      engineVersion: "engine-v1",
      rulesVersion: "rules-v1",
      warnings: [],
      recommendation: {
        centralDemand: 8,
        demandQuantile: 8,
        safetyStock: 0,
        targetStock: 8,
        usableStock: 1,
        expiryRiskStock: 2,
        unusableStock: 3,
        unroundedSuggestion: 7,
        suggestedQuantity: 7,
        wasRounded: false,
        serviceLevel: 0.9,
        criticality: "normal",
        preferredPresentation: null,
        draftPurchaseQuantity: 4,
        draftPurchaseCount: 1,
        estimatedBaseUnitCost: null,
        estimatedCost: null
      },
      forecastPoints: [{
        localDate: new Date("2026-07-24T00:00:00.000Z"),
        central: decimal(2),
        lower80: decimal(1),
        upper80: decimal(3)
      }]
    }];
    repository.products = [product];

    const response = await new StockPlanningService(repository).listProducts({});

    expect(response.data[0]).toMatchObject({
      usableStock: 1,
      expiryRiskStock: 2,
      unusableStock: 3,
      draftPurchaseQuantity: 4,
      draftPurchaseCount: 1,
      result: {
        kind: "demand_forecast",
        quantityBase: 7,
        targetStock: 8
      }
    });
    expect(response.data[0]!.result).not.toHaveProperty("estimatedCost");
    expect(response.data[0]!.result).not.toHaveProperty("preferredPresentation");
    expect(response.data[0]!.warnings).toContain("missing_reliable_purchase_cost");
  });
});

describe("Stock planning shared contracts", () => {
  it("requires a valid product parameter and accepts null to inherit global coverage", () => {
    expect(UpdateProductStockConfigurationSchema.parse({ coverageDays: null })).toEqual({
      coverageDays: null
    });
    expect(() => UpdateProductStockConfigurationSchema.parse({})).toThrow();
    expect(() => UpdateProductStockConfigurationSchema.parse({ coverageDays: 0 })).toThrow();
  });
});

describe("Stock planning route permissions", () => {
  it.each(["admin", "superadmin"])("allows %s to access stock planning", (roleName) => {
    const next = createNextSpy();

    canAccessStockPlanning(makeRoleRequest(roleName), {} as never, next);

    expect(next.calls).toEqual([undefined]);
  });

  it("denies seller access before controller execution", () => {
    const next = createNextSpy();

    canAccessStockPlanning(makeRoleRequest("seller"), {} as never, next);

    expect(next.calls).toHaveLength(1);
    expectHttpError(next.calls[0], {
      code: "FORBIDDEN",
      statusCode: 403
    });
  });
});

class FakeStockPlanningRepository implements StockPlanningRepositoryPort {
  products: StockPlanningProductRecord[] = [];
  product: Awaited<ReturnType<StockPlanningRepositoryPort["findProductById"]>> = null;
  productUnit: { id: string } | null = null;
  lastBusinessDate?: Date;
  updateCalls: Array<{
    productId: string;
    update: ProductStockConfigurationUpdate;
    previousConfiguration: ProductStockConfigurationUpdate;
    context: StockPlanningAuditContext;
  }> = [];

  listActiveProducts(_filters: StockPlanningFilters, businessDate: Date) {
    this.lastBusinessDate = businessDate;
    return Promise.resolve(this.products);
  }

  findProductById() {
    return Promise.resolve(this.product);
  }

  findProductUnit() {
    return Promise.resolve(this.productUnit);
  }

  updateProductConfiguration(
    productId: string,
    update: ProductStockConfigurationUpdate,
    previousConfiguration: ProductStockConfigurationUpdate,
    context: StockPlanningAuditContext
  ) {
    this.updateCalls.push({ productId, update, previousConfiguration, context });
    return Promise.resolve();
  }
}

function makeProduct(
  overrides: {
    minimumStock?: Prisma.Decimal;
    availableQuantities?: number[];
    stockCoverageDays?: number | null;
    preferredRestockUnit?: StockPlanningProductRecord["preferredRestockUnit"];
  } = {}
): StockPlanningProductRecord {
  return {
    id: "product-1",
    internalCode: "MED-000001",
    commercialName: "Paracetamol 500 mg",
    genericName: "Paracetamol",
    categoryId: "category-1",
    category: { id: "category-1", name: "Analgésicos" },
    supplierId: "supplier-1",
    supplier: { id: "supplier-1", businessName: "Distribuidora farmacéutica" },
    baseUnitId: "unit-tablet",
    baseUnit: { id: "unit-tablet", abbreviation: "comp" },
    stockCriticality: "normal",
    stockCoverageDays: overrides.stockCoverageDays ?? null,
    preferredRestockUnitId: overrides.preferredRestockUnit?.id ?? null,
    preferredRestockUnit: overrides.preferredRestockUnit ?? null,
    minimumStock: overrides.minimumStock ?? decimal(10),
    inventoryBatches: (overrides.availableQuantities ?? [3]).map((availableQuantity) => ({
      id: `batch-${availableQuantity}`,
      availableQuantity: decimal(availableQuantity),
      expirationDate: new Date("2027-07-23T00:00:00.000Z"),
      status: "active"
    })),
    purchaseContext: {
      draftQuantity: decimal(0),
      draftCount: 0,
      latestReliableBaseUnitCost: null
    },
    stockPlanningForecasts: []
  } as unknown as StockPlanningProductRecord;
}

function decimal(value: Prisma.Decimal.Value) {
  return new Prisma.Decimal(value);
}

function makeRoleRequest(roleName: string) {
  return {
    authenticatedUser: {
      role: { name: roleName }
    }
  } as never;
}

function createNextSpy() {
  const next = ((error?: unknown) => {
    next.calls.push(error);
  }) as ((error?: unknown) => void) & { calls: unknown[] };

  next.calls = [];

  return next;
}
