import type { Prisma } from "@prisma/client";
import { prisma } from "../../infrastructure/prisma/prisma.client.js";

const detailForecastInclude = {
  execution: {
    include: {
      configuration: true
    }
  },
  observedPoints: {
    orderBy: { localDate: "asc" }
  },
  forecastPoints: {
    orderBy: { localDate: "asc" }
  }
} satisfies Prisma.StockPlanningForecastInclude;

export class StockPlanningDetailRepository {
  findProductHistory(productId: string) {
    return prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        internalCode: true,
        commercialName: true,
        status: true,
        baseUnit: { select: { abbreviation: true } },
        stockPlanningForecasts: {
          where: {
            execution: {
              status: { in: ["succeeded", "succeeded_with_warnings"] }
            }
          },
          include: detailForecastInclude,
          orderBy: [
            { execution: { startedAt: "desc" } },
            { executionId: "desc" }
          ]
        }
      }
    });
  }

  listSnapshots(productId: string, from: Date, through: Date) {
    return prisma.inventorySnapshot.findMany({
      where: {
        localDate: { gte: from, lte: through },
        lines: { some: { productId } }
      },
      select: {
        localDate: true,
        source: true,
        capturedAt: true,
        lines: {
          where: { productId },
          select: {
            batchId: true,
            batchNumber: true,
            expirationDate: true,
            batchStatus: true,
            availableQuantity: true
          },
          orderBy: [{ expirationDate: "asc" }, { batchId: "asc" }]
        }
      },
      orderBy: { localDate: "asc" }
    });
  }

  listExecutionsAfter(startedAt: Date) {
    return prisma.stockPlanningExecution.findMany({
      where: {
        status: { in: ["failed", "succeeded_with_warnings"] },
        startedAt: { gt: startedAt }
      },
      select: {
        id: true,
        status: true,
        startedAt: true,
        completedAt: true,
        globalError: true,
        warnings: true
      },
      orderBy: [{ startedAt: "asc" }, { id: "asc" }]
    });
  }
}

export type StockPlanningDetailProductRecord = NonNullable<
  Awaited<ReturnType<StockPlanningDetailRepository["findProductHistory"]>>
>;
export type StockPlanningDetailForecastRecord =
  StockPlanningDetailProductRecord["stockPlanningForecasts"][number];
export type StockPlanningDetailSnapshotRecord =
  Awaited<ReturnType<StockPlanningDetailRepository["listSnapshots"]>>[number];
export type StockPlanningFailedExecutionRecord =
  Awaited<ReturnType<StockPlanningDetailRepository["listExecutionsAfter"]>>[number];
