import type { Prisma } from "@prisma/client";
import type { StockPlanningConfigurationRecord } from "../stock-planning-execution.types.js";
import { buildDailyDemand, forecastDemand, MAX_HISTORY_DAYS } from "./forecast-engine.js";
import { ForecastRepository } from "./forecast.repository.js";
import { calculateReplenishment } from "../replenishment-engine.js";

export type ForecastRunOutcome = {
  processedProducts: number;
  warnings: string[];
};

export interface ForecastRunner {
  run(
    executionId: string,
    cutoff: Date,
    configuration: StockPlanningConfigurationRecord,
    tx: Prisma.TransactionClient
  ): Promise<ForecastRunOutcome>;
}

export class ForecastService implements ForecastRunner {
  constructor(private readonly repository = new ForecastRepository()) {}

  async run(
    executionId: string,
    cutoff: Date,
    configuration: StockPlanningConfigurationRecord,
    tx: Prisma.TransactionClient
  ): Promise<ForecastRunOutcome> {
    const historyStart = addUtcDays(cutoff, -(MAX_HISTORY_DAYS - 1));
    const products = await this.repository.listSourceProducts(historyStart, cutoff, tx);
    const warnings: string[] = [];
    let processedProducts = 0;
    for (const product of products) {
      const supportsSavepoints = typeof tx.$executeRawUnsafe === "function";
      try {
        if (supportsSavepoints) await tx.$executeRawUnsafe("SAVEPOINT stock_planning_product");
        const start = new Date(Math.min(
          cutoff.getTime(),
          Math.max(historyStart.getTime(), businessDate(product.createdAt).getTime())
        ));
        const restorationDates = new Set(
          product.availabilityRestorations.map((restoration) => formatBusinessDate(restoration.date))
        );
        const unavailableDates = new Set(
          product.snapshots
            .filter((snapshot) =>
              snapshot.availableQuantity <= 0 && !restorationDates.has(formatDate(snapshot.date))
            )
            .map((snapshot) => formatDate(snapshot.date))
        );
        const points = buildDailyDemand({
          historyStartDate: formatDate(start),
          historyEndDate: formatDate(cutoff),
          sales: product.sales.map((sale) => ({
            date: formatBusinessDate(sale.date),
            quantity: sale.quantity
          })),
          returns: product.returns.map((returned) => ({
            date: formatBusinessDate(returned.date),
            quantity: returned.quantity
          })),
          unavailableDates
        });
        const result = forecastDemand(points, product.coverageDays ?? configuration.coverageDays, {
          minimumHistoryWeeks: configuration.minimumHistoryWeeks,
          minimumDemandDays: configuration.minimumDemandDays,
          operationalDemandDays: configuration.operationalDemandDays
        });
        assertPublishedValues(result);
        const serviceLevel = {
          normal: configuration.normalServiceLevel.toNumber(),
          high: configuration.highServiceLevel.toNumber(),
          critical: configuration.criticalServiceLevel.toNumber()
        }[product.criticality];
        const recommendation = result.maturity === "no_history"
          ? undefined
          : calculateReplenishment({
              businessDate: result.forecast[0]?.date ?? formatDate(addUtcDays(cutoff, 1)),
              minimumStock: result.maturity === "no_observed_demand" ? 0 : product.minimumStock,
              serviceLevel,
              forecast: result.forecast,
              batches: product.batches,
              presentationFactor: product.preferredPresentation?.conversionFactor
            });
        await this.repository.persist(
          executionId,
          product.id,
          result,
          recommendation
            ? {
                ...recommendation,
                serviceLevel,
                criticality: product.criticality,
                preferredPresentation: product.preferredPresentation,
                draftPurchaseQuantity: product.draftPurchaseQuantity,
                draftPurchaseCount: product.draftPurchaseCount,
                estimatedBaseUnitCost: product.latestReliableBaseUnitCost,
                estimatedCost: product.latestReliableBaseUnitCost === null
                  ? null
                  : money(recommendation.suggestedQuantity * product.latestReliableBaseUnitCost)
              }
            : undefined,
          tx
        );
        if (supportsSavepoints) await tx.$executeRawUnsafe("RELEASE SAVEPOINT stock_planning_product");
        processedProducts += 1;
      } catch (error) {
        if (supportsSavepoints) {
          await tx.$executeRawUnsafe("ROLLBACK TO SAVEPOINT stock_planning_product");
          await tx.$executeRawUnsafe("RELEASE SAVEPOINT stock_planning_product");
        }
        warnings.push(`product:${product.id}:${error instanceof Error ? error.message : "unknown_error"}`);
      }
    }
    return { processedProducts, warnings };
  }
}

function money(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function assertPublishedValues(result: ReturnType<typeof forecastDemand>) {
  for (const point of result.observed) {
    if (point.netDemand < 0 || point.grossDemand < 0 || point.returnedQuantity < 0) {
      throw new Error("Negative observed demand invariant violated.");
    }
  }
  for (const point of result.forecast) {
    if (point.central < 0 || point.lower80 < 0 || point.upper80 < 0 || point.lower80 > point.upper80) {
      throw new Error("Forecast interval invariant violated.");
    }
  }
}

function businessDate(value: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/La_Paz", year: "numeric", month: "2-digit", day: "2-digit"
  }).formatToParts(value);
  const mapped = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return new Date(`${mapped.year}-${mapped.month}-${mapped.day}T00:00:00.000Z`);
}

function formatDate(value: Date) {
  return value.toISOString().slice(0, 10);
}

function formatBusinessDate(value: Date) {
  return businessDate(value).toISOString().slice(0, 10);
}

function addUtcDays(value: Date, days: number) {
  const result = new Date(value);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}
