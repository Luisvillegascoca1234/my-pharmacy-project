import type {
  Prisma,
  StockPlanningExecutionTrigger
} from "@prisma/client";
import { prisma } from "../../infrastructure/prisma/prisma.client.js";
import type { StockPlanningAuditContext } from "./stock-planning.types.js";
import type {
  SnapshotCreateInput,
  StockPlanningConfigurationRecord,
  StockPlanningExecutionRecord
} from "./stock-planning-execution.types.js";

const configurationSelect = {
  id: true,
  version: true,
  engineEnabled: true,
  frequency: true,
  weekday: true,
  localTime: true,
  timezone: true,
  coverageDays: true,
  normalServiceLevel: true,
  highServiceLevel: true,
  criticalServiceLevel: true,
  minimumHistoryWeeks: true,
  minimumDemandDays: true,
  operationalDemandDays: true,
  createdByUserId: true,
  createdAt: true
} satisfies Prisma.StockPlanningConfigurationSelect;

const executionInclude = {
  configuration: { select: configurationSelect }
} satisfies Prisma.StockPlanningExecutionInclude;

const EXECUTION_LOCK_ID = 7_301_202_607_23n;
const CONFIGURATION_LOCK_ID = 7_302_202_607_23n;

export class StockPlanningExecutionRepository {
  getCurrentConfiguration(): Promise<StockPlanningConfigurationRecord | null> {
    return prisma.stockPlanningConfiguration.findFirst({
      select: configurationSelect,
      orderBy: { version: "desc" }
    });
  }

  async createConfigurationVersion(
    data: Omit<StockPlanningConfigurationRecord, "id" | "version" | "createdAt" | "createdByUserId">,
    context: StockPlanningAuditContext
  ): Promise<StockPlanningConfigurationRecord> {
    return prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(${CONFIGURATION_LOCK_ID})`;
      const previous = await tx.stockPlanningConfiguration.findFirst({
        select: configurationSelect,
        orderBy: { version: "desc" }
      });
      const created = await tx.stockPlanningConfiguration.create({
        data: {
          ...data,
          version: (previous?.version ?? 0) + 1,
          createdByUserId: context.actorUserId
        },
        select: configurationSelect
      });
      await tx.auditLog.create({
        data: {
          action: "STOCK_PLANNING_GLOBAL_CONFIGURATION_UPDATED",
          actorUserId: context.actorUserId,
          entityType: "stock_planning_configuration",
          entityId: created.id,
          metadata: {
            previousVersion: previous?.version ?? null,
            newVersion: created.version
          },
          ipAddress: context.ipAddress,
          userAgent: context.userAgent
        }
      });
      return created;
    });
  }

  listExecutions(limit = 50): Promise<StockPlanningExecutionRecord[]> {
    return prisma.stockPlanningExecution.findMany({
      include: executionInclude,
      orderBy: [{ startedAt: "desc" }, { id: "desc" }],
      take: limit
    });
  }

  getLatestExecution(): Promise<StockPlanningExecutionRecord | null> {
    return prisma.stockPlanningExecution.findFirst({
      include: executionInclude,
      orderBy: [{ startedAt: "desc" }, { id: "desc" }]
    });
  }

  getLatestSuccessfulExecution(): Promise<StockPlanningExecutionRecord | null> {
    return prisma.stockPlanningExecution.findFirst({
      where: { status: { in: ["succeeded", "succeeded_with_warnings"] } },
      include: executionInclude,
      orderBy: [{ startedAt: "desc" }, { id: "desc" }]
    });
  }

  async hasRunningExecution(): Promise<boolean> {
    return (await prisma.stockPlanningExecution.count({
      where: { status: "running" }
    })) > 0;
  }

  findExecutionByIdempotencyKey(
    idempotencyKey: string,
    tx: Prisma.TransactionClient = prisma
  ): Promise<StockPlanningExecutionRecord | null> {
    return tx.stockPlanningExecution.findUnique({
      where: { idempotencyKey },
      include: executionInclude
    });
  }

  async runWithExecutionLock<T>(
    work: (tx: Prisma.TransactionClient) => Promise<T>
  ): Promise<{ acquired: true; value: T } | { acquired: false }> {
    return prisma.$transaction(async (tx) => {
      const rows = await tx.$queryRaw<Array<{ acquired: boolean }>>`
        SELECT pg_try_advisory_xact_lock(${EXECUTION_LOCK_ID}) AS acquired
      `;
      if (!rows[0]?.acquired) {
        return { acquired: false } as const;
      }
      return { acquired: true, value: await work(tx) } as const;
    });
  }

  findSnapshot(localDate: Date, tx: Prisma.TransactionClient = prisma) {
    return tx.inventorySnapshot.findUnique({ where: { localDate } });
  }

  listCurrentBatches(tx: Prisma.TransactionClient = prisma) {
    return tx.inventoryBatch.findMany({
      select: {
        id: true,
        productId: true,
        batchNumber: true,
        expirationDate: true,
        status: true,
        availableQuantity: true
      },
      orderBy: { id: "asc" }
    });
  }

  createSnapshot(input: SnapshotCreateInput, tx: Prisma.TransactionClient = prisma) {
    return tx.inventorySnapshot.create({
      data: {
        localDate: input.localDate,
        source: input.source,
        capturedAt: input.capturedAt,
        lines: {
          create: input.batches.map((batch) => ({
            productId: batch.productId,
            batchId: batch.id,
            batchNumber: batch.batchNumber,
            expirationDate: batch.expirationDate,
            batchStatus: batch.status,
            availableQuantity: batch.availableQuantity
          }))
        }
      }
    });
  }

  async listBatchesForReconstruction(targetInstant: Date, tx: Prisma.TransactionClient = prisma) {
    return tx.inventoryBatch.findMany({
      select: {
        id: true,
        productId: true,
        batchNumber: true,
        expirationDate: true,
        status: true,
        availableQuantity: true,
        createdAt: true,
        movements: {
          where: { createdAt: { gte: targetInstant } },
          select: { quantityBase: true }
        }
      },
      orderBy: { id: "asc" }
    });
  }

  createRunningExecution(
    input: {
      idempotencyKey: string;
      configuration: StockPlanningConfigurationRecord;
      configurationSnapshot: Prisma.InputJsonValue;
      trigger: StockPlanningExecutionTrigger;
      scheduledFor: Date | null;
      demandCutoffDate: Date;
      stockCapturedAt: Date;
      engineVersion: string;
      fingerprint: string;
      requestedByUserId?: string;
      startedAt: Date;
    },
    tx: Prisma.TransactionClient
  ) {
    return tx.stockPlanningExecution.create({
      data: {
        idempotencyKey: input.idempotencyKey,
        configuration: { connect: { id: input.configuration.id } },
        configurationSnapshot: input.configurationSnapshot,
        trigger: input.trigger,
        status: "running",
        scheduledFor: input.scheduledFor,
        demandCutoffDate: input.demandCutoffDate,
        stockCapturedAt: input.stockCapturedAt,
        engineVersion: input.engineVersion,
        fingerprint: input.fingerprint,
        requestedByUser: input.requestedByUserId
          ? { connect: { id: input.requestedByUserId } }
          : undefined,
        startedAt: input.startedAt
      },
      include: executionInclude
    });
  }

  completeExecution(
    executionId: string,
    completedAt: Date,
    startedAt: Date,
    tx: Prisma.TransactionClient,
    warnings: string[] = []
  ) {
    return tx.stockPlanningExecution.update({
      where: { id: executionId },
      data: {
        status: warnings.length > 0 ? "succeeded_with_warnings" : "succeeded",
        completedAt,
        durationMs: Math.max(0, completedAt.getTime() - startedAt.getTime()),
        warnings
      },
      include: executionInclude
    });
  }

  createManualRecalculationAudit(
    executionId: string,
    context: StockPlanningAuditContext,
    tx: Prisma.TransactionClient
  ) {
    return tx.auditLog.create({
      data: {
        action: "STOCK_PLANNING_MANUAL_RECALCULATION_REQUESTED",
        actorUserId: context.actorUserId,
        entityType: "stock_planning_execution",
        entityId: executionId,
        metadata: { executionId },
        ipAddress: context.ipAddress,
        userAgent: context.userAgent
      }
    });
  }
}
