import { createHash } from "node:crypto";
import type {
  StockPlanningEngineState,
  StockPlanningExecution,
  StockPlanningGlobalConfiguration,
  UpdateStockPlanningGlobalConfiguration
} from "@pharmacy-pos/shared";
import { Prisma } from "@prisma/client";
import { env } from "../../config/env.js";
import { HttpError } from "../../common/http/http-error.js";
import type { StockPlanningAuditContext } from "./stock-planning.types.js";
import { STOCK_PLANNING_TIMEZONE } from "./stock-planning.service.js";
import { StockPlanningExecutionRepository } from "./stock-planning-execution.repository.js";
import type {
  SnapshotCreateInput,
  StockPlanningConfigurationRecord,
  StockPlanningExecutionRecord
} from "./stock-planning-execution.types.js";
import type { ForecastRunner } from "./forecasting/forecast.service.js";

export const STOCK_PLANNING_STALE_GRACE_HOURS = 6;

export interface StockPlanningExecutionRepositoryPort {
  getCurrentConfiguration(): Promise<StockPlanningConfigurationRecord | null>;
  createConfigurationVersion(
    data: Omit<StockPlanningConfigurationRecord, "id" | "version" | "createdAt" | "createdByUserId">,
    context: StockPlanningAuditContext
  ): Promise<StockPlanningConfigurationRecord>;
  listExecutions(limit?: number): Promise<StockPlanningExecutionRecord[]>;
  getLatestExecution(): Promise<StockPlanningExecutionRecord | null>;
  getLatestSuccessfulExecution(): Promise<StockPlanningExecutionRecord | null>;
  hasRunningExecution(): Promise<boolean>;
  findExecutionByIdempotencyKey(
    idempotencyKey: string,
    tx?: Prisma.TransactionClient
  ): Promise<StockPlanningExecutionRecord | null>;
  runWithExecutionLock<T>(
    work: (tx: Prisma.TransactionClient) => Promise<T>
  ): Promise<{ acquired: true; value: T } | { acquired: false }>;
  findSnapshot(localDate: Date, tx?: Prisma.TransactionClient): Promise<unknown | null>;
  listCurrentBatches(tx?: Prisma.TransactionClient): Promise<SnapshotCreateInput["batches"]>;
  createSnapshot(input: SnapshotCreateInput, tx?: Prisma.TransactionClient): Promise<unknown>;
  listBatchesForReconstruction(targetInstant: Date, tx?: Prisma.TransactionClient): Promise<Array<
    SnapshotCreateInput["batches"][number] & {
      createdAt: Date;
      movements: Array<{ quantityBase: Prisma.Decimal }>;
    }
  >>;
  createRunningExecution(
    input: {
      idempotencyKey: string;
      configuration: StockPlanningConfigurationRecord;
      configurationSnapshot: Prisma.InputJsonValue;
      trigger: "scheduled" | "manual" | "recovery";
      scheduledFor: Date | null;
      demandCutoffDate: Date;
      stockCapturedAt: Date;
      engineVersion: string;
      fingerprint: string;
      requestedByUserId?: string;
      startedAt: Date;
    },
    tx: Prisma.TransactionClient
  ): Promise<StockPlanningExecutionRecord>;
  completeExecution(
    executionId: string,
    completedAt: Date,
    startedAt: Date,
    tx: Prisma.TransactionClient,
    warnings?: string[]
  ): Promise<StockPlanningExecutionRecord>;
  createManualRecalculationAudit(
    executionId: string,
    context: StockPlanningAuditContext,
    tx: Prisma.TransactionClient
  ): Promise<unknown>;
}

export class StockPlanningExecutionService {
  constructor(
    private readonly repository: StockPlanningExecutionRepositoryPort = new StockPlanningExecutionRepository(),
    private readonly now: () => Date = () => new Date(),
    private readonly forecastRunner: ForecastRunner | null = null
  ) {}

  async getConfiguration(): Promise<StockPlanningGlobalConfiguration> {
    return toConfiguration(await this.requireConfiguration());
  }

  async updateConfiguration(
    input: UpdateStockPlanningGlobalConfiguration,
    context: StockPlanningAuditContext
  ): Promise<StockPlanningGlobalConfiguration> {
    const created = await this.repository.createConfigurationVersion(
      {
        engineEnabled: input.engineEnabled,
        frequency: input.frequency,
        weekday: input.weekday,
        localTime: input.localTime,
        timezone: STOCK_PLANNING_TIMEZONE,
        coverageDays: input.coverageDays,
        normalServiceLevel: new Prisma.Decimal(input.serviceLevels.normal),
        highServiceLevel: new Prisma.Decimal(input.serviceLevels.high),
        criticalServiceLevel: new Prisma.Decimal(input.serviceLevels.critical),
        minimumHistoryWeeks: input.maturityThresholds.minimumHistoryWeeks,
        minimumDemandDays: input.maturityThresholds.minimumDemandDays,
        operationalDemandDays: input.maturityThresholds.operationalDemandDays
      },
      context
    );
    return toConfiguration(created);
  }

  async listExecutions(): Promise<StockPlanningExecution[]> {
    return (await this.repository.listExecutions()).map(toExecution);
  }

  async getEngineState(): Promise<StockPlanningEngineState> {
    const now = this.now();
    const configuration = await this.requireConfiguration();
    const [latest, latestSuccessful, executionInProgress] = await Promise.all([
      this.repository.getLatestExecution(),
      this.repository.getLatestSuccessfulExecution(),
      this.repository.hasRunningExecution()
    ]);
    const staleReasons: StockPlanningEngineState["staleReasons"] = [];

    if (latestSuccessful && latestSuccessful.configuration.version !== configuration.version) {
      staleReasons.push("configuration_changed");
    }
    if (latestSuccessful) {
      const nextAfterLatest = nextScheduledAt(
        configuration,
        latestSuccessful.scheduledFor ?? latestSuccessful.startedAt
      );
      if (now.getTime() > addHours(nextAfterLatest, STOCK_PLANNING_STALE_GRACE_HOURS).getTime()) {
        staleReasons.push("schedule_overdue");
      }
    }

    return {
      configuration: toConfiguration(configuration),
      latestExecution: latest ? toExecution(latest) : null,
      nextExpectedAt: nextScheduledAt(configuration, now).toISOString(),
      stale: staleReasons.length > 0,
      staleReasons,
      executionInProgress
    };
  }

  runManual(context: StockPlanningAuditContext, requestKey: string) {
    return this.runExecution({
      trigger: "manual",
      idempotencyKey: `manual:${context.actorUserId}:${requestKey}`,
      scheduledFor: null,
      context
    });
  }

  runScheduled(scheduledFor: Date, trigger: "scheduled" | "recovery" = "scheduled") {
    return this.runExecution({
      trigger,
      idempotencyKey: `scheduled:${scheduledFor.toISOString()}`,
      scheduledFor,
      context: {}
    });
  }

  async captureDailySnapshot(): Promise<void> {
    const now = this.now();
    const localDate = businessDate(now);
    await this.repository.runWithExecutionLock(async (tx) => {
      if (await this.repository.findSnapshot(localDate, tx)) {
        return;
      }
      const batches = await this.repository.listCurrentBatches(tx);
      await this.repository.createSnapshot({ localDate, source: "captured", capturedAt: now, batches }, tx);
    });
  }

  async reconstructPreviousSnapshotIfMissing(): Promise<void> {
    const now = this.now();
    const localDate = addUtcDays(businessDate(now), -1);
    const targetInstant = localDateStartInstant(localDate);
    await this.repository.runWithExecutionLock(async (tx) => {
      if (await this.repository.findSnapshot(localDate, tx)) {
        return;
      }
      const batches = await this.repository.listBatchesForReconstruction(targetInstant, tx);
      const reconstructed = batches.map((batch) => {
        const movementsAfterCutoff = batch.movements.reduce(
          (total, movement) => total.plus(movement.quantityBase),
          new Prisma.Decimal(0)
        );
        const availableQuantity = Prisma.Decimal.max(
          new Prisma.Decimal(0),
          batch.availableQuantity.minus(movementsAfterCutoff)
        );
        return { ...batch, availableQuantity };
      }).filter((batch) =>
        batch.createdAt.getTime() <= targetInstant.getTime() || batch.availableQuantity.greaterThan(0)
      );
      await this.repository.createSnapshot({
        localDate,
        source: "reconstructed",
        capturedAt: now,
        batches: reconstructed
      }, tx);
    });
  }

  async recoverOneMissedExecution(): Promise<void> {
    const now = this.now();
    const configuration = await this.requireConfiguration();
    if (!configuration.engineEnabled) {
      return;
    }
    const due = latestScheduledAt(configuration, now);
    if (!due) {
      return;
    }
    const existing = await this.repository.findExecutionByIdempotencyKey(`scheduled:${due.toISOString()}`);
    if (!existing) {
      await this.runScheduled(due, "recovery");
    }
  }

  async runDueScheduledExecution(): Promise<void> {
    const now = this.now();
    const configuration = await this.requireConfiguration();
    if (!configuration.engineEnabled) {
      return;
    }
    const due = latestScheduledAt(configuration, now);
    if (!due) {
      return;
    }
    const existing = await this.repository.findExecutionByIdempotencyKey(`scheduled:${due.toISOString()}`);
    if (!existing) {
      await this.runScheduled(due);
    }
  }

  private async runExecution(input: {
    trigger: "scheduled" | "manual" | "recovery";
    idempotencyKey: string;
    scheduledFor: Date | null;
    context: StockPlanningAuditContext;
  }): Promise<StockPlanningExecution> {
    const configuration = await this.requireConfiguration();
    const startedAt = this.now();
    const stockCapturedAt = startedAt;
    const demandCutoffDate = addUtcDays(businessDate(startedAt), -1);
    const configurationSnapshot = toConfiguration(configuration);
    const fingerprint = createHash("sha256")
      .update(JSON.stringify({ configuration: configurationSnapshot, demandCutoffDate, stockCapturedAt }))
      .digest("hex");

    const locked = await this.repository.runWithExecutionLock(async (tx) => {
      const existing = await this.repository.findExecutionByIdempotencyKey(input.idempotencyKey, tx);
      if (existing) {
        return existing;
      }
      const localDate = businessDate(stockCapturedAt);
      if (!(await this.repository.findSnapshot(localDate, tx))) {
        const batches = await this.repository.listCurrentBatches(tx);
        await this.repository.createSnapshot({
          localDate,
          source: "captured",
          capturedAt: stockCapturedAt,
          batches
        }, tx);
      }
      const running = await this.repository.createRunningExecution({
        idempotencyKey: input.idempotencyKey,
        configuration,
        configurationSnapshot: configurationSnapshot as Prisma.InputJsonValue,
        trigger: input.trigger,
        scheduledFor: input.scheduledFor,
        demandCutoffDate,
        stockCapturedAt,
        engineVersion: env.APP_VERSION,
        fingerprint,
        requestedByUserId: input.context.actorUserId,
        startedAt
      }, tx);
      if (input.trigger === "manual") {
        await this.repository.createManualRecalculationAudit(running.id, input.context, tx);
      }
      const forecastOutcome = this.forecastRunner
        ? await this.forecastRunner.run(running.id, demandCutoffDate, configuration, tx)
        : { warnings: [] };
      return this.repository.completeExecution(
        running.id,
        this.now(),
        startedAt,
        tx,
        forecastOutcome.warnings
      );
    });

    if (!locked.acquired) {
      throw new HttpError(409, "An equivalent stock planning execution is already running.", "STOCK_PLANNING_EXECUTION_CONFLICT");
    }
    return toExecution(locked.value);
  }

  private async requireConfiguration() {
    const configuration = await this.repository.getCurrentConfiguration();
    if (!configuration) {
      throw new HttpError(503, "Stock planning configuration is unavailable.", "STOCK_PLANNING_CONFIGURATION_UNAVAILABLE");
    }
    return configuration;
  }
}

export function toConfiguration(configuration: StockPlanningConfigurationRecord): StockPlanningGlobalConfiguration {
  return {
    id: configuration.id,
    version: configuration.version,
    engineEnabled: configuration.engineEnabled,
    frequency: configuration.frequency,
    weekday: configuration.weekday,
    localTime: configuration.localTime,
    timezone: "America/La_Paz",
    coverageDays: configuration.coverageDays,
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
  };
}

function toExecution(execution: StockPlanningExecutionRecord): StockPlanningExecution {
  return {
    id: execution.id,
    configurationVersion: execution.configuration.version,
    configuration: toConfiguration(execution.configuration),
    trigger: execution.trigger,
    status: execution.status,
    scheduledFor: execution.scheduledFor?.toISOString() ?? null,
    demandCutoffDate: execution.demandCutoffDate.toISOString().slice(0, 10),
    stockCapturedAt: execution.stockCapturedAt.toISOString(),
    engineVersion: execution.engineVersion,
    fingerprint: execution.fingerprint,
    startedAt: execution.startedAt.toISOString(),
    completedAt: execution.completedAt?.toISOString() ?? null,
    durationMs: execution.durationMs,
    globalError: execution.globalError,
    warnings: Array.isArray(execution.warnings)
      ? execution.warnings.filter((warning): warning is string => typeof warning === "string")
      : []
  };
}

export function businessDate(now: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: STOCK_PLANNING_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(now);
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return new Date(`${value.year}-${value.month}-${value.day}T00:00:00.000Z`);
}

export function nextScheduledAt(configuration: StockPlanningConfigurationRecord, after: Date) {
  let date = businessDate(after);
  for (let offset = 0; offset <= 7; offset += 1) {
    const candidateDate = addUtcDays(date, offset);
    if (configuration.frequency === "weekly" && candidateDate.getUTCDay() !== configuration.weekday) {
      continue;
    }
    const candidate = localScheduleInstant(candidateDate, configuration.localTime);
    if (candidate.getTime() > after.getTime()) {
      return candidate;
    }
  }
  return localScheduleInstant(addUtcDays(date, 7), configuration.localTime);
}

export function latestScheduledAt(configuration: StockPlanningConfigurationRecord, at: Date) {
  for (let offset = 0; offset <= 7; offset += 1) {
    const candidateDate = addUtcDays(businessDate(at), -offset);
    if (configuration.frequency === "weekly" && candidateDate.getUTCDay() !== configuration.weekday) {
      continue;
    }
    const candidate = localScheduleInstant(candidateDate, configuration.localTime);
    if (candidate.getTime() <= at.getTime()) {
      return candidate;
    }
  }
  return null;
}

function localScheduleInstant(localDate: Date, localTime: string) {
  const [hours, minutes] = localTime.split(":").map(Number);
  return new Date(Date.UTC(
    localDate.getUTCFullYear(),
    localDate.getUTCMonth(),
    localDate.getUTCDate(),
    hours + 4,
    minutes
  ));
}

function localDateStartInstant(localDate: Date) {
  return new Date(Date.UTC(localDate.getUTCFullYear(), localDate.getUTCMonth(), localDate.getUTCDate(), 4));
}

function addUtcDays(value: Date, days: number) {
  const result = new Date(value);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

function addHours(value: Date, hours: number) {
  return new Date(value.getTime() + hours * 60 * 60 * 1000);
}
