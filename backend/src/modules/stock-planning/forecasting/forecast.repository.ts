import type { Prisma } from "@prisma/client";
import { prisma } from "../../../infrastructure/prisma/prisma.client.js";
import {
  FORECAST_ENGINE_VERSION,
  FORECAST_RULES_VERSION,
  type ForecastResult
} from "./forecast-engine.js";

export type ForecastSourceProduct = {
  id: string;
  createdAt: Date;
  minimumStock: number;
  coverageDays: number | null;
  criticality: "normal" | "high" | "critical";
  preferredPresentation: {
    id: string;
    unitId: string;
    name: string;
    abbreviation: string;
    conversionFactor: number;
  } | null;
  batches: Array<{
    id: string;
    expirationDate: string | null;
    status: "active" | "depleted" | "blocked" | "cancelled";
    availableQuantity: number;
  }>;
  draftPurchaseQuantity: number;
  draftPurchaseCount: number;
  latestReliableBaseUnitCost: number | null;
  sales: Array<{ date: Date; quantity: number }>;
  returns: Array<{ date: Date; quantity: number }>;
  snapshots: Array<{ date: Date; availableQuantity: number }>;
  availabilityRestorations: Array<{ date: Date }>;
};

export class ForecastRepository {
  async listSourceProducts(
    historyStart: Date,
    cutoff: Date,
    tx: Prisma.TransactionClient = prisma
  ): Promise<ForecastSourceProduct[]> {
    const [products, snapshotDates] = await Promise.all([
      tx.product.findMany({
      where: { status: "active" },
      select: {
        id: true,
        createdAt: true,
        minimumStock: true,
        stockCoverageDays: true,
        stockCriticality: true,
        preferredRestockUnit: {
          select: {
            id: true,
            unitId: true,
            conversionFactor: true,
            unit: { select: { name: true, abbreviation: true } }
          }
        },
        inventoryBatches: {
          where: { availableQuantity: { gt: 0 } },
          select: {
            id: true,
            expirationDate: true,
            status: true,
            availableQuantity: true
          }
        },
        purchaseItems: {
          where: { purchase: { status: { in: ["draft", "received"] } } },
          select: {
            purchaseId: true,
            baseQuantity: true,
            baseUnitCost: true,
            isInventoryTracked: true,
            purchase: { select: { status: true, receivedAt: true } }
          },
          orderBy: [{ purchase: { receivedAt: "desc" } }, { createdAt: "desc" }, { id: "desc" }]
        },
        saleItems: {
          where: {
            sale: {
              status: { in: ["confirmed", "returned"] },
              confirmedAt: { gte: historyStart, lt: addUtcDays(cutoff, 1) }
            }
          },
          select: {
            sale: { select: { confirmedAt: true } },
            consumptions: { select: { quantity: true } }
          }
        },
        saleReturnItems: {
          where: {
            inventoryMovementId: { not: null },
            saleReturn: { returnedAt: { gte: historyStart, lt: addUtcDays(cutoff, 1) } }
          },
          select: {
            quantity: true,
            saleReturn: { select: { returnedAt: true } }
          }
        },
        inventorySnapshotLines: {
          where: { snapshot: { localDate: { gte: historyStart, lte: cutoff } } },
          select: {
            availableQuantity: true,
            batchStatus: true,
            expirationDate: true,
            snapshot: { select: { localDate: true } }
          }
        },
        inventoryMovements: {
          where: {
            quantityBase: { gt: 0 },
            createdAt: { gte: historyStart, lt: addUtcDays(cutoff, 1) }
          },
          select: {
            createdAt: true,
            batch: {
              select: {
                status: true,
                expirationDate: true
              }
            }
          }
        }
      },
      orderBy: { id: "asc" }
      }),
      tx.inventorySnapshot.findMany({
        where: { localDate: { gte: historyStart, lte: cutoff } },
        select: { localDate: true },
        orderBy: { localDate: "asc" }
      })
    ]);
    return products.map((product) => ({
      id: product.id,
      createdAt: product.createdAt,
      minimumStock: product.minimumStock.toNumber(),
      coverageDays: product.stockCoverageDays,
      criticality: product.stockCriticality,
      preferredPresentation: product.preferredRestockUnit
        ? {
            id: product.preferredRestockUnit.id,
            unitId: product.preferredRestockUnit.unitId,
            name: product.preferredRestockUnit.unit.name,
            abbreviation: product.preferredRestockUnit.unit.abbreviation,
            conversionFactor: product.preferredRestockUnit.conversionFactor.toNumber()
          }
        : null,
      batches: product.inventoryBatches.map((batch) => ({
        id: batch.id,
        expirationDate: batch.expirationDate?.toISOString().slice(0, 10) ?? null,
        status: batch.status,
        availableQuantity: batch.availableQuantity.toNumber()
      })),
      draftPurchaseQuantity: product.purchaseItems
        .filter((item) => item.purchase.status === "draft")
        .reduce((sum, item) => sum + item.baseQuantity.toNumber(), 0),
      draftPurchaseCount: new Set(
        product.purchaseItems
          .filter((item) => item.purchase.status === "draft")
          .map((item) => item.purchaseId)
      ).size,
      latestReliableBaseUnitCost: product.purchaseItems.find((item) =>
        item.purchase.status === "received" &&
        item.purchase.receivedAt &&
        item.isInventoryTracked &&
        item.baseUnitCost.greaterThan(0)
      )?.baseUnitCost.toNumber() ?? null,
      sales: product.saleItems.map((item) => ({
        date: item.sale.confirmedAt,
        quantity: item.consumptions.reduce((sum, consumption) => sum + consumption.quantity.toNumber(), 0)
      })),
      returns: product.saleReturnItems.map((item) => ({
        date: item.saleReturn.returnedAt,
        quantity: item.quantity.toNumber()
      })),
      snapshots: aggregateSnapshots(product.inventorySnapshotLines, snapshotDates.map((item) => item.localDate)),
      availabilityRestorations: product.inventoryMovements
        .filter((movement) =>
          movement.batch.status === "active" &&
          (!movement.batch.expirationDate ||
            movement.batch.expirationDate.getTime() >= businessDateUtc(movement.createdAt).getTime())
        )
        .map((movement) => ({ date: movement.createdAt }))
    }));
  }

  persist(
    executionId: string,
    productId: string,
    result: ForecastResult,
    recommendation: Prisma.InputJsonValue | undefined,
    tx: Prisma.TransactionClient = prisma
  ) {
    const first = result.observed[0]!;
    const last = result.observed.at(-1)!;
    return tx.stockPlanningForecast.create({
      data: {
        executionId,
        productId,
        maturity: result.maturity,
        confidence: result.confidence,
        model: result.model,
        historyStartDate: new Date(`${first.date}T00:00:00.000Z`),
        historyEndDate: new Date(`${last.date}T00:00:00.000Z`),
        historyDays: result.observed.length,
        demandDays: result.observed.filter((point) => !point.censored && point.netDemand > 0).length,
        censoredDays: result.observed.filter((point) => point.censored).length,
        forecastDays: result.forecast.length,
        parameters: result.parameters as Prisma.InputJsonValue,
        metrics: result.metrics,
        bias: result.metrics.bias,
        fingerprint: result.fingerprint,
        engineVersion: FORECAST_ENGINE_VERSION,
        rulesVersion: FORECAST_RULES_VERSION,
        warnings: result.warnings,
        recommendation,
        observedPoints: {
          create: result.observed.map((point) => ({
            localDate: new Date(`${point.date}T00:00:00.000Z`),
            grossDemand: point.grossDemand,
            returnedQuantity: point.returnedQuantity,
            netDemand: point.netDemand,
            censored: point.censored
          }))
        },
        forecastPoints: {
          create: result.forecast.map((point) => ({
            localDate: new Date(`${point.date}T00:00:00.000Z`),
            central: point.central,
            lower80: point.lower80,
            upper80: point.upper80
          }))
        }
      }
    });
  }
}

function aggregateSnapshots(lines: Array<{
  availableQuantity: { toNumber(): number };
  batchStatus: string;
  expirationDate: Date | null;
  snapshot: { localDate: Date };
}>, snapshotDates: Date[]) {
  const totals = new Map(
    snapshotDates.map((date) => [
      date.toISOString().slice(0, 10),
      { date, availableQuantity: 0 }
    ])
  );
  for (const line of lines) {
    const key = line.snapshot.localDate.toISOString().slice(0, 10);
    const current = totals.get(key) ?? { date: line.snapshot.localDate, availableQuantity: 0 };
    const usableOnSnapshotDate =
      line.batchStatus === "active" &&
      (!line.expirationDate || line.expirationDate.getTime() >= line.snapshot.localDate.getTime());
    if (usableOnSnapshotDate) current.availableQuantity += line.availableQuantity.toNumber();
    totals.set(key, current);
  }
  return [...totals.values()];
}

function businessDateUtc(value: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/La_Paz",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(value);
  const mapped = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return new Date(`${mapped.year}-${mapped.month}-${mapped.day}T00:00:00.000Z`);
}

function addUtcDays(value: Date, days: number) {
  const result = new Date(value);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}
