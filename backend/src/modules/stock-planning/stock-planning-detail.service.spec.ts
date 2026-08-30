import { Prisma } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { StockPlanningProductDetailResponseSchema } from "@pharmacy-pos/shared";
import {
  StockPlanningDetailService,
  type StockPlanningDetailRepositoryPort
} from "./stock-planning-detail.service.js";
import type {
  StockPlanningDetailForecastRecord,
  StockPlanningDetailProductRecord,
  StockPlanningDetailSnapshotRecord
} from "./stock-planning-detail.repository.js";

describe("StockPlanningDetailService", () => {
  it("publishes observations, forecast band, snapshots, lots, explanation and immutable execution metadata", async () => {
    const repository = new FakeDetailRepository(makeProduct());
    const detail = await new StockPlanningDetailService(repository).getProductDetail("product-1");

    expect(StockPlanningProductDetailResponseSchema.parse(detail)).toEqual(detail);
    expect(detail.latestSuccessfulExecutionId).toBe("execution-2");
    expect(detail.result.observations).toEqual([
      {
        date: "2026-07-21",
        grossDemand: 4,
        returnedQuantity: 1,
        netDemand: 3,
        censored: false
      }
    ]);
    expect(detail.result.forecast[0]).toMatchObject({
      date: "2026-07-23",
      central: 5,
      lower80: 3,
      upper80: 8
    });
    expect(detail.result).toMatchObject({
      model: "moving_average",
      maturity: "operational",
      confidence: "high",
      censoredDays: 2,
      metrics: { scaledError: 0.8, bias: -0.25 },
      formula: expect.stringContaining("máximo(stock mínimo, cuantil de demanda)")
    });
    expect(detail.snapshots[0]).toMatchObject({
      date: "2026-07-22",
      capturedAt: "2026-07-22T04:00:00.000Z",
      stock: 11,
      lots: [
        {
          batchId: "batch-1",
          expirationDate: "2027-01-31",
          availableQuantity: 11
        }
      ]
    });
    expect(detail.execution).toMatchObject({
      id: "execution-2",
      configurationVersion: 2,
      demandCutoffDate: "2026-07-22",
      stockCapturedAt: "2026-07-23T02:15:00.000Z",
      engineVersion: "forecast-engine-v1"
    });
    expect(detail.timezone).toBe("America/La_Paz");
    expect(detail.history[0]).toMatchObject({
      centralDemand: 5,
      targetStock: 15,
      suggestedQuantity: 5,
      scaledError: 0.8,
      bias: -0.25,
      evaluatedPoints: 20
    });
  });

  it("compares a selected execution only with its immediately previous product result", async () => {
    const repository = new FakeDetailRepository(makeProduct());
    const detail = await new StockPlanningDetailService(repository).getProductDetail(
      "product-1",
      "execution-2"
    );

    expect(detail.comparison).toEqual({
      previousExecutionId: "execution-1",
      demand: { previous: 4, current: 5, delta: 1 },
      targetStock: { previous: 12, current: 15, delta: 3 },
      suggestedQuantity: { previous: 2, current: 5, delta: 3 },
      confidence: { previous: "medium", current: "high", changed: true },
      model: { previous: "recent_naive", current: "moving_average", changed: true }
    });
  });

  it("keeps the latest successful result visible and reports a later failed execution", async () => {
    const repository = new FakeDetailRepository(makeProduct());
    repository.failedExecutions = [{
      id: "execution-3",
      status: "failed",
      startedAt: new Date("2026-07-24T06:00:00.000Z"),
      completedAt: new Date("2026-07-24T06:01:00.000Z"),
      globalError: "Synthetic failure",
      warnings: []
    }];

    const detail = await new StockPlanningDetailService(repository).getProductDetail("product-1");

    expect(detail.execution.id).toBe("execution-2");
    expect(detail.laterFailedExecutions).toEqual([{
      executionId: "execution-3",
      startedAt: "2026-07-24T06:00:00.000Z",
      completedAt: "2026-07-24T06:01:00.000Z",
      globalError: "Synthetic failure"
    }]);
    expect(repository.failedAfter).toEqual(new Date("2026-07-23T06:00:00.000Z"));
  });

  it("preserves history for an inactive product without publishing a new recommendation", async () => {
    const product = makeProduct();
    product.status = "inactive";
    const detail = await new StockPlanningDetailService(
      new FakeDetailRepository(product)
    ).getProductDetail("product-1");

    expect(detail.history).toHaveLength(2);
    expect(detail.result.recommendation?.suggestedQuantity).toBe(5);
    expect(detail.recommendationAvailable).toBe(false);
  });

  it("reports a later partial product failure while ignoring warnings from other products", async () => {
    const repository = new FakeDetailRepository(makeProduct());
    repository.failedExecutions = [
      {
        id: "execution-3",
        status: "succeeded_with_warnings",
        startedAt: new Date("2026-07-24T06:00:00.000Z"),
        completedAt: new Date("2026-07-24T06:01:00.000Z"),
        globalError: null,
        warnings: ["product:other-product:controlled failure"]
      },
      {
        id: "execution-4",
        status: "succeeded_with_warnings",
        startedAt: new Date("2026-07-25T06:00:00.000Z"),
        completedAt: new Date("2026-07-25T06:01:00.000Z"),
        globalError: null,
        warnings: ["product:product-1:controlled failure"]
      }
    ];

    const detail = await new StockPlanningDetailService(repository).getProductDetail("product-1");

    expect(detail.laterFailedExecutions.map((execution) => execution.executionId)).toEqual(["execution-4"]);
  });

  it("rejects malformed persisted history instead of publishing an invented fallback", async () => {
    const product = makeProduct();
    product.stockPlanningForecasts[0]!.parameters = ["invalid"] as unknown as Prisma.JsonValue;

    await expect(
      new StockPlanningDetailService(new FakeDetailRepository(product)).getProductDetail("product-1")
    ).rejects.toThrow("invalid parameters");
  });

  it("declares indefinite operational retention and at least 24 months for predictive results", async () => {
    const detail = await new StockPlanningDetailService(
      new FakeDetailRepository(makeProduct())
    ).getProductDetail("product-1");

    expect(detail.retention).toEqual({
      snapshots: "indefinite",
      operationalMovements: "indefinite",
      predictionMonthsMinimum: 24
    });
  });
});

class FakeDetailRepository implements StockPlanningDetailRepositoryPort {
  failedExecutions: Array<{
    id: string;
    status: "failed" | "succeeded_with_warnings";
    startedAt: Date;
    completedAt: Date | null;
    globalError: string | null;
    warnings: Prisma.JsonValue | null;
  }> = [];
  failedAfter: Date | null = null;

  constructor(private readonly product: StockPlanningDetailProductRecord) {}

  async findProductHistory(productId: string) {
    return productId === this.product.id ? this.product : null;
  }

  async listSnapshots(_productId: string, _from: Date, _through: Date) {
    return [{
      localDate: new Date("2026-07-22T00:00:00.000Z"),
      source: "captured",
      capturedAt: new Date("2026-07-22T04:00:00.000Z"),
      lines: [{
        batchId: "batch-1",
        batchNumber: "LOT-001",
        expirationDate: new Date("2027-01-31T00:00:00.000Z"),
        batchStatus: "active",
        availableQuantity: decimal(11)
      }]
    }] as StockPlanningDetailSnapshotRecord[];
  }

  async listExecutionsAfter(startedAt: Date) {
    this.failedAfter = startedAt;
    return this.failedExecutions;
  }
}

function makeProduct(): StockPlanningDetailProductRecord {
  return {
    id: "product-1",
    internalCode: "MED-001",
    commercialName: "Producto de prueba",
    status: "active",
    baseUnit: { abbreviation: "tab" },
    stockPlanningForecasts: [
      makeForecast({
        id: "forecast-2",
        executionId: "execution-2",
        startedAt: "2026-07-23T06:00:00.000Z",
        configurationVersion: 2,
        confidence: "high",
        model: "moving_average",
        central: 5,
        targetStock: 15,
        suggestedQuantity: 5
      }),
      makeForecast({
        id: "forecast-1",
        executionId: "execution-1",
        startedAt: "2026-07-22T06:00:00.000Z",
        configurationVersion: 1,
        confidence: "medium",
        model: "recent_naive",
        central: 4,
        targetStock: 12,
        suggestedQuantity: 2
      })
    ]
  } as unknown as StockPlanningDetailProductRecord;
}

function makeForecast(input: {
  id: string;
  executionId: string;
  startedAt: string;
  configurationVersion: number;
  confidence: "medium" | "high";
  model: "recent_naive" | "moving_average";
  central: number;
  targetStock: number;
  suggestedQuantity: number;
}): StockPlanningDetailForecastRecord {
  return {
    id: input.id,
    executionId: input.executionId,
    productId: "product-1",
    maturity: "operational",
    confidence: input.confidence,
    model: input.model,
    historyStartDate: new Date("2026-01-01T00:00:00.000Z"),
    historyEndDate: new Date("2026-07-22T00:00:00.000Z"),
    historyDays: 203,
    demandDays: 40,
    censoredDays: 2,
    forecastDays: 1,
    parameters: { window: 7 },
    metrics: {
      scaledError: 0.8,
      meanAbsoluteError: 1.2,
      bias: -0.25,
      evaluatedPoints: 20
    },
    bias: decimal(-0.25),
    fingerprint: `forecast-${input.executionId}`,
    engineVersion: "forecast-engine-v1",
    rulesVersion: "forecast-rules-v1",
    warnings: ["two_censored_days"],
    recommendation: {
      centralDemand: input.central,
      demandQuantile: input.targetStock,
      safetyStock: input.targetStock - input.central,
      targetStock: input.targetStock,
      usableStock: 10,
      expiryRiskStock: 1,
      unusableStock: 0,
      suggestedQuantity: input.suggestedQuantity,
      serviceLevel: 0.95,
      criticality: "high"
    },
    createdAt: new Date(input.startedAt),
    observedPoints: [{
      id: `observed-${input.executionId}`,
      forecastId: input.id,
      localDate: new Date("2026-07-21T00:00:00.000Z"),
      grossDemand: decimal(4),
      returnedQuantity: decimal(1),
      netDemand: decimal(3),
      censored: false
    }],
    forecastPoints: [{
      id: `point-${input.executionId}`,
      forecastId: input.id,
      localDate: new Date("2026-07-23T00:00:00.000Z"),
      central: decimal(input.central),
      lower80: decimal(3),
      upper80: decimal(8)
    }],
    execution: {
      id: input.executionId,
      idempotencyKey: `key-${input.executionId}`,
      configurationId: `configuration-${input.configurationVersion}`,
      configurationSnapshot: {},
      trigger: "scheduled",
      status: "succeeded",
      scheduledFor: new Date(input.startedAt),
      demandCutoffDate: new Date("2026-07-22T00:00:00.000Z"),
      stockCapturedAt: new Date("2026-07-23T02:15:00.000Z"),
      engineVersion: "forecast-engine-v1",
      fingerprint: `execution-${input.executionId}`,
      requestedByUserId: null,
      startedAt: new Date(input.startedAt),
      completedAt: new Date(new Date(input.startedAt).getTime() + 60_000),
      durationMs: 60_000,
      globalError: null,
      warnings: [],
      createdAt: new Date(input.startedAt),
      configuration: {
        id: `configuration-${input.configurationVersion}`,
        version: input.configurationVersion,
        engineEnabled: true,
        frequency: "daily",
        weekday: null,
        localTime: "02:00",
        timezone: "America/La_Paz",
        coverageDays: 30,
        normalServiceLevel: decimal(0.9),
        highServiceLevel: decimal(0.95),
        criticalServiceLevel: decimal(0.99),
        minimumHistoryWeeks: 12,
        minimumDemandDays: 4,
        operationalDemandDays: 12,
        createdByUserId: null,
        createdAt: new Date("2026-07-01T12:00:00.000Z")
      }
    }
  } as unknown as StockPlanningDetailForecastRecord;
}

function decimal(value: number) {
  return new Prisma.Decimal(value);
}
