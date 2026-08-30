import type { Prisma } from "@prisma/client";
import { prisma } from "../../infrastructure/prisma/prisma.client.js";
import type {
  StockPlanningParquetAuditInput,
  StockPlanningParquetConfigurationRecord,
  StockPlanningParquetFilters,
  StockPlanningParquetProductRecord,
  StockPlanningPredictionExecutionRecord,
  StockPlanningPredictionForecastRecord,
  StockPlanningSeriesDemandRecord,
  StockPlanningSeriesSnapshotRecord
} from "./stock-planning-parquet.types.js";

const successfulExecutionStatuses = ["succeeded", "succeeded_with_warnings"] as const;

export class StockPlanningParquetRepository {
  countProducts(filters: StockPlanningParquetFilters) {
    return prisma.product.count({ where: buildProductWhere(filters) });
  }

  listProducts(filters: StockPlanningParquetFilters): Promise<StockPlanningParquetProductRecord[]> {
    return prisma.product.findMany({
      where: buildProductWhere(filters),
      select: {
        id: true,
        internalCode: true,
        commercialName: true,
        status: true,
        stockCriticality: true,
        stockCoverageDays: true,
        category: { select: { id: true, name: true } },
        supplier: { select: { id: true, businessName: true } }
      },
      orderBy: [{ commercialName: "asc" }, { id: "asc" }]
    });
  }

  async findCurrentConfiguration(): Promise<StockPlanningParquetConfigurationRecord> {
    return (await prisma.stockPlanningConfiguration.findFirst({
      select: { coverageDays: true },
      orderBy: [{ version: "desc" }, { createdAt: "desc" }]
    })) ?? { coverageDays: 30 };
  }

  async findLatestSuccessfulExecutionId(): Promise<string | null> {
    return (await prisma.stockPlanningExecution.findFirst({
      where: { status: { in: [...successfulExecutionStatuses] } },
      select: { id: true },
      orderBy: [{ startedAt: "desc" }, { id: "desc" }]
    }))?.id ?? null;
  }

  listSeriesDemand(
    executionId: string,
    productIds: string[],
    from: Date,
    through: Date
  ): Promise<StockPlanningSeriesDemandRecord[]> {
    return prisma.stockPlanningDemandPoint.findMany({
      where: {
        forecast: { executionId, productId: { in: productIds } },
        localDate: { gte: from, lte: through }
      },
      select: {
        localDate: true,
        grossDemand: true,
        returnedQuantity: true,
        netDemand: true,
        censored: true,
        forecast: {
          select: {
            productId: true,
            executionId: true,
            execution: { select: { startedAt: true } }
          }
        }
      },
      orderBy: [{ forecast: { productId: "asc" } }, { localDate: "asc" }]
    });
  }

  listSeriesSnapshots(
    productIds: string[],
    from: Date,
    through: Date
  ): Promise<StockPlanningSeriesSnapshotRecord[]> {
    return prisma.inventorySnapshot.findMany({
      where: {
        localDate: { gte: from, lte: through },
        lines: { some: { productId: { in: productIds } } }
      },
      select: {
        localDate: true,
        capturedAt: true,
        source: true,
        lines: {
          where: { productId: { in: productIds } },
          select: { productId: true, availableQuantity: true }
        }
      },
      orderBy: { localDate: "asc" }
    });
  }

  findPredictionExecution(executionId: string): Promise<StockPlanningPredictionExecutionRecord | null> {
    return prisma.stockPlanningExecution.findFirst({
      where: { id: executionId, status: { in: [...successfulExecutionStatuses] } },
      select: {
        id: true,
        startedAt: true,
        engineVersion: true,
        configuration: { select: { version: true, coverageDays: true } }
      }
    });
  }

  listPredictionForecasts(
    executionId: string,
    productIds: string[],
    from: Date,
    through: Date
  ): Promise<StockPlanningPredictionForecastRecord[]> {
    return prisma.stockPlanningForecast.findMany({
      where: { executionId, productId: { in: productIds } },
      select: {
        productId: true,
        maturity: true,
        confidence: true,
        model: true,
        bias: true,
        metrics: true,
        recommendation: true,
        engineVersion: true,
        rulesVersion: true,
        forecastPoints: {
          where: { localDate: { gte: from, lte: through } },
          select: {
            localDate: true,
            central: true,
            lower80: true,
            upper80: true
          },
          orderBy: { localDate: "asc" }
        }
      },
      orderBy: { productId: "asc" }
    });
  }

  createGeneratedFileAuditLog(input: StockPlanningParquetAuditInput) {
    return prisma.auditLog.create({
      data: {
        action: "STOCK_PLANNING_FILE_GENERATED",
        actorUserId: input.context.actorUserId,
        entityType: "stock_planning_export",
        entityId: input.fileName,
        metadata: {
          event: "archivo generado",
          dataset: input.dataset,
          fileName: input.fileName,
          filters: input.filters,
          rowCount: input.rowCount,
          schemaVersion: input.schemaVersion,
          compression: input.compression
        },
        ipAddress: input.context.ipAddress,
        userAgent: input.context.userAgent
      }
    });
  }
}

function buildProductWhere(filters: StockPlanningParquetFilters): Prisma.ProductWhereInput {
  return {
    id: filters.productId,
    categoryId: filters.categoryId,
    supplierId: filters.supplierId
  };
}
