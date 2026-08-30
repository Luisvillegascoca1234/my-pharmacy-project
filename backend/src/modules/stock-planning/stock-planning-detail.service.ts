import type {
  StockPlanningProductDetailResponse
} from "@pharmacy-pos/shared";
import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { HttpError } from "../../common/http/http-error.js";
import {
  StockPlanningDetailRepository,
  type StockPlanningDetailForecastRecord,
  type StockPlanningDetailProductRecord,
  type StockPlanningDetailSnapshotRecord,
  type StockPlanningFailedExecutionRecord
} from "./stock-planning-detail.repository.js";

export const STOCK_PLANNING_PREDICTION_RETENTION_MONTHS = 24;
export const STOCK_PLANNING_DETAIL_TIMEZONE = "America/La_Paz" as const;
export const STOCK_PLANNING_REPLENISHMENT_FORMULA =
  "cantidad sugerida = redondear hacia arriba(máximo(0, máximo(stock mínimo, cuantil de demanda) - stock utilizable), presentación preferida)";

const ForecastMetricsSchema = z.object({
  scaledError: z.number().nonnegative(),
  meanAbsoluteError: z.number().nonnegative(),
  bias: z.number(),
  evaluatedPoints: z.number().int().nonnegative()
});

const ForecastParametersSchema = z.record(z.union([z.string(), z.number(), z.boolean()]));
const ForecastWarningsSchema = z.array(z.string());

const DetailRecommendationSchema = z.object({
  centralDemand: z.number().nonnegative(),
  demandQuantile: z.number().nonnegative(),
  safetyStock: z.number().nonnegative(),
  targetStock: z.number().nonnegative(),
  usableStock: z.number().nonnegative(),
  expiryRiskStock: z.number().nonnegative(),
  unusableStock: z.number().nonnegative(),
  suggestedQuantity: z.number().nonnegative(),
  serviceLevel: z.number().gt(0).lt(1),
  criticality: z.enum(["normal", "high", "critical"])
}).passthrough();

export type StockPlanningDetailRepositoryPort = {
  findProductHistory(productId: string): Promise<StockPlanningDetailProductRecord | null>;
  listSnapshots(productId: string, from: Date, through: Date): Promise<StockPlanningDetailSnapshotRecord[]>;
  listExecutionsAfter(startedAt: Date): Promise<StockPlanningFailedExecutionRecord[]>;
};

export class StockPlanningDetailService {
  constructor(
    private readonly repository: StockPlanningDetailRepositoryPort = new StockPlanningDetailRepository()
  ) {}

  async getProductDetail(
    productId: string,
    executionId?: string
  ): Promise<StockPlanningProductDetailResponse> {
    const product = await this.repository.findProductHistory(productId);
    if (!product) {
      throw new HttpError(404, "Stock planning product was not found.", "STOCK_PLANNING_PRODUCT_NOT_FOUND");
    }

    const latest = product.stockPlanningForecasts[0];
    if (!latest) {
      throw new HttpError(
        404,
        "The product does not have a successful stock planning result.",
        "STOCK_PLANNING_RESULT_NOT_FOUND"
      );
    }

    const selectedIndex = executionId
      ? product.stockPlanningForecasts.findIndex((forecast) => forecast.executionId === executionId)
      : 0;
    if (selectedIndex < 0) {
      throw new HttpError(
        404,
        "The requested successful execution does not contain a result for this product.",
        "STOCK_PLANNING_EXECUTION_RESULT_NOT_FOUND"
      );
    }

    const selected = product.stockPlanningForecasts[selectedIndex]!;
    const previous = product.stockPlanningForecasts[selectedIndex + 1] ?? null;
    const [snapshots, laterFailures] = await Promise.all([
      this.repository.listSnapshots(
        product.id,
        selected.historyStartDate,
        selected.execution.demandCutoffDate
      ),
      this.repository.listExecutionsAfter(latest.execution.startedAt)
    ]);
    const productFailures = laterFailures.filter((execution) =>
      execution.status === "failed" ||
      parseExecutionWarnings(execution.warnings, execution.id).some((warning) =>
        warning.startsWith(`product:${product.id}:`)
      )
    );

    return {
      product: {
        id: product.id,
        internalCode: product.internalCode,
        commercialName: product.commercialName,
        status: product.status,
        baseUnitAbbreviation: product.baseUnit.abbreviation
      },
      execution: mapExecution(selected),
      result: mapResult(selected),
      snapshots: snapshots.map(mapSnapshot),
      history: product.stockPlanningForecasts.map(mapHistoryEntry),
      comparison: previous ? compare(selected, previous) : null,
      latestSuccessfulExecutionId: latest.executionId,
      laterFailedExecutions: productFailures.map((execution) => ({
        executionId: execution.id,
        startedAt: execution.startedAt.toISOString(),
        completedAt: execution.completedAt?.toISOString() ?? null,
        globalError: execution.globalError
      })),
      recommendationAvailable: product.status === "active",
      retention: {
        snapshots: "indefinite",
        operationalMovements: "indefinite",
        predictionMonthsMinimum: STOCK_PLANNING_PREDICTION_RETENTION_MONTHS
      },
      timezone: STOCK_PLANNING_DETAIL_TIMEZONE
    };
  }
}

function mapExecution(forecast: StockPlanningDetailForecastRecord) {
  const execution = forecast.execution;
  const configuration = execution.configuration;
  if (!execution.completedAt) {
    throw new Error(`Successful stock planning execution ${execution.id} is missing its completion timestamp.`);
  }
  return {
    id: execution.id,
    status: successfulStatus(execution.status, execution.id),
    trigger: execution.trigger,
    demandCutoffDate: localDate(execution.demandCutoffDate),
    stockCapturedAt: execution.stockCapturedAt.toISOString(),
    startedAt: execution.startedAt.toISOString(),
    completedAt: execution.completedAt.toISOString(),
    configurationVersion: configuration.version,
    configuration: {
      id: configuration.id,
      version: configuration.version,
      engineEnabled: configuration.engineEnabled,
      frequency: configuration.frequency,
      weekday: configuration.weekday,
      localTime: configuration.localTime,
      coverageDays: configuration.coverageDays,
      timezone: STOCK_PLANNING_DETAIL_TIMEZONE,
      serviceLevels: {
        normal: configuration.normalServiceLevel.toNumber(),
        high: configuration.highServiceLevel.toNumber(),
        critical: configuration.criticalServiceLevel.toNumber()
      },
      maturityThresholds: {
        minimumHistoryWeeks: configuration.minimumHistoryWeeks,
        minimumDemandDays: configuration.minimumDemandDays,
        operationalDemandDays: configuration.operationalDemandDays
      },
      createdAt: configuration.createdAt.toISOString(),
      createdByUserId: configuration.createdByUserId
    },
    engineVersion: execution.engineVersion,
    fingerprint: execution.fingerprint
  };
}

function mapResult(forecast: StockPlanningDetailForecastRecord) {
  return {
    maturity: forecast.maturity,
    confidence: forecast.confidence,
    model: forecast.model,
    historyStartDate: localDate(forecast.historyStartDate),
    historyEndDate: localDate(forecast.historyEndDate),
    historyDays: forecast.historyDays,
    demandDays: forecast.demandDays,
    censoredDays: forecast.censoredDays,
    formula: STOCK_PLANNING_REPLENISHMENT_FORMULA,
    parameters: parseParameters(forecast.parameters, forecast.id),
    metrics: parseMetrics(forecast.metrics, forecast.id),
    recommendation: parseRecommendation(forecast.recommendation, forecast.id),
    observations: forecast.observedPoints.map((point) => ({
      date: localDate(point.localDate),
      grossDemand: point.grossDemand.toNumber(),
      returnedQuantity: point.returnedQuantity.toNumber(),
      netDemand: point.netDemand.toNumber(),
      censored: point.censored
    })),
    forecast: forecast.forecastPoints.map((point) => ({
      date: localDate(point.localDate),
      central: point.central.toNumber(),
      lower80: point.lower80.toNumber(),
      upper80: point.upper80.toNumber()
    })),
    warnings: parseWarnings(forecast.warnings, forecast.id)
  };
}

function mapSnapshot(snapshot: StockPlanningDetailSnapshotRecord) {
  const lots = snapshot.lines.map((line) => ({
    batchId: line.batchId,
    batchNumber: line.batchNumber,
    expirationDate: line.expirationDate ? localDate(line.expirationDate) : null,
    status: line.batchStatus,
    availableQuantity: line.availableQuantity.toNumber()
  }));
  return {
    date: localDate(snapshot.localDate),
    source: snapshot.source,
    capturedAt: snapshot.capturedAt.toISOString(),
    stock: lots.reduce((sum, lot) => sum + lot.availableQuantity, 0),
    lots
  };
}

function compare(
  current: StockPlanningDetailForecastRecord,
  previous: StockPlanningDetailForecastRecord
) {
  const currentRecommendation = parseRecommendation(current.recommendation, current.id);
  const previousRecommendation = parseRecommendation(previous.recommendation, previous.id);
  return {
    previousExecutionId: previous.executionId,
    demand: numericChange(totalForecast(previous), totalForecast(current)),
    targetStock: currentRecommendation && previousRecommendation
      ? numericChange(previousRecommendation.targetStock, currentRecommendation.targetStock)
      : null,
    suggestedQuantity: currentRecommendation && previousRecommendation
      ? numericChange(previousRecommendation.suggestedQuantity, currentRecommendation.suggestedQuantity)
      : null,
    confidence: {
      previous: previous.confidence,
      current: current.confidence,
      changed: previous.confidence !== current.confidence
    },
    model: {
      previous: previous.model,
      current: current.model,
      changed: previous.model !== current.model
    }
  };
}

function mapHistoryEntry(forecast: StockPlanningDetailForecastRecord) {
  const metrics = parseMetrics(forecast.metrics, forecast.id);
  const recommendation = parseRecommendation(forecast.recommendation, forecast.id);
  return {
    executionId: forecast.executionId,
    status: successfulStatus(forecast.execution.status, forecast.executionId),
    startedAt: forecast.execution.startedAt.toISOString(),
    demandCutoffDate: localDate(forecast.execution.demandCutoffDate),
    model: forecast.model,
    maturity: forecast.maturity,
    confidence: forecast.confidence,
    centralDemand: totalForecast(forecast),
    targetStock: recommendation?.targetStock ?? null,
    suggestedQuantity: recommendation?.suggestedQuantity ?? null,
    scaledError: metrics.scaledError,
    bias: metrics.bias,
    evaluatedPoints: metrics.evaluatedPoints
  };
}

function numericChange(previous: number, current: number) {
  return { previous, current, delta: current - previous };
}

function totalForecast(forecast: StockPlanningDetailForecastRecord) {
  return forecast.forecastPoints.reduce((sum, point) => sum + point.central.toNumber(), 0);
}

function parseMetrics(value: Prisma.JsonValue, forecastId: string) {
  const parsed = ForecastMetricsSchema.safeParse(value);
  if (!parsed.success) throw new Error(`Stock planning forecast ${forecastId} has invalid metrics.`);
  return parsed.data;
}

function parseParameters(value: Prisma.JsonValue, forecastId: string) {
  const parsed = ForecastParametersSchema.safeParse(value);
  if (!parsed.success) throw new Error(`Stock planning forecast ${forecastId} has invalid parameters.`);
  return parsed.data;
}

function parseRecommendation(value: Prisma.JsonValue | null, forecastId: string) {
  if (value === null) return null;
  const parsed = DetailRecommendationSchema.safeParse(value);
  if (!parsed.success) throw new Error(`Stock planning forecast ${forecastId} has an invalid recommendation.`);
  return parsed.data;
}

function parseWarnings(value: Prisma.JsonValue, forecastId: string) {
  const parsed = ForecastWarningsSchema.safeParse(value);
  if (!parsed.success) throw new Error(`Stock planning forecast ${forecastId} has invalid warnings.`);
  return parsed.data;
}

function parseExecutionWarnings(value: Prisma.JsonValue | null, executionId: string) {
  if (value === null) return [];
  const parsed = ForecastWarningsSchema.safeParse(value);
  if (!parsed.success) throw new Error(`Stock planning execution ${executionId} has invalid warnings.`);
  return parsed.data;
}

function localDate(value: Date) {
  return value.toISOString().slice(0, 10);
}

function successfulStatus(
  status: string,
  executionId: string
): "succeeded" | "succeeded_with_warnings" {
  if (status !== "succeeded" && status !== "succeeded_with_warnings") {
    throw new Error(`Stock planning execution ${executionId} is not successful.`);
  }
  return status;
}
