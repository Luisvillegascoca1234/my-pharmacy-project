import { Prisma } from "@prisma/client";
import { describe, expect, it } from "vitest";
import type { StockPlanningConfigurationRecord } from "../stock-planning-execution.types.js";
import type { ForecastSourceProduct } from "./forecast.repository.js";
import { ForecastService } from "./forecast.service.js";

describe("ForecastService", () => {
  it("isolates a product failure and preserves valid products", async () => {
    const persisted: string[] = [];
    const repository = {
      listSourceProducts: async () => [
        sourceProduct("valid-product"),
        sourceProduct("broken-product"),
        sourceProduct("another-valid-product")
      ],
      persist: async (_executionId: string, productId: string) => {
        if (productId === "broken-product") throw new Error("controlled failure");
        persisted.push(productId);
      }
    };
    const service = new ForecastService(repository as never);
    const outcome = await service.run(
      "execution-1",
      new Date("2026-06-30T00:00:00.000Z"),
      configuration(),
      {} as Prisma.TransactionClient
    );

    expect(persisted).toEqual(["valid-product", "another-valid-product"]);
    expect(outcome.processedProducts).toBe(2);
    expect(outcome.warnings).toEqual(["product:broken-product:controlled failure"]);
  });

  it("uses the product coverage override for its forecast and recommendation horizon", async () => {
    let forecastDays = 0;
    const product = sourceProduct("specific-coverage");
    product.coverageDays = 7;
    const repository = {
      listSourceProducts: async () => [product],
      persist: async (_executionId: string, _productId: string, result: { forecast: unknown[] }) => {
        forecastDays = result.forecast.length;
      }
    };

    const outcome = await new ForecastService(repository as never).run(
      "execution-1",
      new Date("2026-06-30T00:00:00.000Z"),
      configuration(),
      {} as Prisma.TransactionClient
    );

    expect(outcome.processedProducts).toBe(1);
    expect(forecastDays).toBe(7);
  });
});

function sourceProduct(id: string): ForecastSourceProduct {
  return {
    id,
    createdAt: new Date("2025-01-01T00:00:00.000Z"),
    minimumStock: 10,
    coverageDays: null,
    criticality: "normal",
    preferredPresentation: null,
    batches: [],
    draftPurchaseQuantity: 0,
    draftPurchaseCount: 0,
    latestReliableBaseUnitCost: null,
    sales: Array.from({ length: 20 }, (_, index) => ({
      date: new Date(Date.UTC(2026, 0, index + 1)),
      quantity: 2
    })),
    returns: [],
    snapshots: [],
    availabilityRestorations: []
  };
}

function configuration(): StockPlanningConfigurationRecord {
  return {
    id: "configuration-1",
    version: 1,
    engineEnabled: true,
    frequency: "daily",
    weekday: null,
    localTime: "02:00",
    timezone: "America/La_Paz",
    coverageDays: 30,
    normalServiceLevel: new Prisma.Decimal(0.9),
    highServiceLevel: new Prisma.Decimal(0.95),
    criticalServiceLevel: new Prisma.Decimal(0.99),
    minimumHistoryWeeks: 12,
    minimumDemandDays: 4,
    operationalDemandDays: 12,
    createdByUserId: null,
    createdAt: new Date()
  };
}
