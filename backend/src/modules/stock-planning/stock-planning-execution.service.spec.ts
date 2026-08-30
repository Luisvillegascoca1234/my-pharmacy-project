import { Prisma } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { UpdateStockPlanningGlobalConfigurationSchema } from "@pharmacy-pos/shared";
import { captureHttpError, expectHttpError } from "../../tests/utils/http-error.js";
import { canGovernStockPlanning } from "./stock-planning.routes.js";
import {
  businessDate,
  latestScheduledAt,
  nextScheduledAt,
  StockPlanningExecutionService,
  type StockPlanningExecutionRepositoryPort
} from "./stock-planning-execution.service.js";
import type {
  SnapshotCreateInput,
  StockPlanningConfigurationRecord,
  StockPlanningExecutionRecord
} from "./stock-planning-execution.types.js";
import type { StockPlanningAuditContext } from "./stock-planning.types.js";

describe("StockPlanningExecutionService", () => {
  it("uses the initial daily 02:00 America/La_Paz business schedule", () => {
    const configuration = makeConfiguration();

    expect(businessDate(new Date("2026-07-23T03:30:00.000Z"))).toEqual(new Date("2026-07-22T00:00:00.000Z"));
    expect(nextScheduledAt(configuration, new Date("2026-07-23T05:59:00.000Z"))).toEqual(
      new Date("2026-07-23T06:00:00.000Z")
    );
    expect(latestScheduledAt(configuration, new Date("2026-07-23T06:01:00.000Z"))).toEqual(
      new Date("2026-07-23T06:00:00.000Z")
    );
  });

  it("creates a new configuration version with business values and audit context", async () => {
    const repository = new FakeExecutionRepository();
    const service = new StockPlanningExecutionService(repository.port);
    const input = UpdateStockPlanningGlobalConfigurationSchema.parse(
      makeConfigurationInput({ frequency: "weekly", weekday: 2 })
    );

    const result = await service.updateConfiguration(input, { actorUserId: "superadmin-1" });

    expect(result.version).toBe(2);
    expect(result.frequency).toBe("weekly");
    expect(repository.configurationUpdates).toEqual([
      expect.objectContaining({
        data: expect.objectContaining({ frequency: "weekly", weekday: 2, timezone: "America/La_Paz" }),
        context: { actorUserId: "superadmin-1" }
      })
    ]);
  });

  it("freezes configuration and cuts when a manual execution starts and audits the request", async () => {
    const repository = new FakeExecutionRepository();
    const now = new Date("2026-07-23T15:45:10.000Z");
    const service = new StockPlanningExecutionService(repository.port, () => now);

    const execution = await service.runManual(
      { actorUserId: "superadmin-1", ipAddress: "127.0.0.1" },
      "manual-request-1"
    );

    expect(execution.configurationVersion).toBe(1);
    expect(execution.configuration.coverageDays).toBe(30);
    expect(execution.demandCutoffDate).toBe("2026-07-22");
    expect(execution.stockCapturedAt).toBe(now.toISOString());
    expect(execution.status).toBe("succeeded");
    expect(repository.createdExecutions[0]).toEqual(expect.objectContaining({
      configurationSnapshot: expect.objectContaining({ version: 1, coverageDays: 30 }),
      trigger: "manual",
      demandCutoffDate: new Date("2026-07-22T00:00:00.000Z")
    }));
    expect(repository.manualAuditContexts).toEqual([{ actorUserId: "superadmin-1", ipAddress: "127.0.0.1" }]);
  });

  it("returns conflict when the PostgreSQL execution lock is held", async () => {
    const repository = new FakeExecutionRepository();
    repository.lockAcquired = false;
    const service = new StockPlanningExecutionService(repository.port);

    const error = await captureHttpError(() =>
      service.runManual({ actorUserId: "superadmin-1" }, "manual-request-2")
    );

    expectHttpError(error, { statusCode: 409, code: "STOCK_PLANNING_EXECUTION_CONFLICT" });
    expect(repository.createdExecutions).toEqual([]);
  });

  it("returns the original manual execution when the request key is retried", async () => {
    const repository = new FakeExecutionRepository();
    const service = new StockPlanningExecutionService(repository.port);
    const context = { actorUserId: "superadmin-1" };

    const first = await service.runManual(context, "manual-retry-1");
    const retried = await service.runManual(context, "manual-retry-1");

    expect(retried.id).toBe(first.id);
    expect(repository.createdExecutions).toHaveLength(1);
    expect(repository.manualAuditContexts).toHaveLength(1);
  });

  it("captures a daily snapshot even when the predictive engine is disabled", async () => {
    const repository = new FakeExecutionRepository();
    repository.configuration = makeConfiguration({ engineEnabled: false });
    const service = new StockPlanningExecutionService(
      repository.port,
      () => new Date("2026-07-23T12:00:00.000Z")
    );

    await service.captureDailySnapshot();
    await service.recoverOneMissedExecution();

    expect(repository.snapshots).toEqual([
      expect.objectContaining({ localDate: new Date("2026-07-23T00:00:00.000Z"), source: "captured" })
    ]);
    expect(repository.createdExecutions).toEqual([]);
  });

  it("reconstructs a missing prior snapshot and marks its source", async () => {
    const repository = new FakeExecutionRepository();
    repository.reconstructionBatches = [{
      id: "batch-1",
      productId: "product-1",
      batchNumber: "LOT-1",
      expirationDate: new Date("2027-01-01T00:00:00.000Z"),
      status: "active",
      availableQuantity: new Prisma.Decimal(7),
      createdAt: new Date("2026-07-01T00:00:00.000Z"),
      movements: [{ quantityBase: new Prisma.Decimal(-3) }]
    }];
    const service = new StockPlanningExecutionService(
      repository.port,
      () => new Date("2026-07-23T12:00:00.000Z")
    );

    await service.reconstructPreviousSnapshotIfMissing();

    expect(repository.snapshots[0]).toEqual(expect.objectContaining({
      localDate: new Date("2026-07-22T00:00:00.000Z"),
      source: "reconstructed"
    }));
    expect(repository.snapshots[0].batches[0].availableQuantity.toNumber()).toBe(10);
  });

  it("recovers at most the latest omitted scheduled execution on startup", async () => {
    const repository = new FakeExecutionRepository();
    const service = new StockPlanningExecutionService(
      repository.port,
      () => new Date("2026-07-23T07:00:00.000Z")
    );

    await service.recoverOneMissedExecution();
    await service.recoverOneMissedExecution();

    expect(repository.createdExecutions).toHaveLength(1);
    expect(repository.createdExecutions[0]).toEqual(expect.objectContaining({
      trigger: "recovery",
      scheduledFor: new Date("2026-07-23T06:00:00.000Z")
    }));
  });

  it("marks the latest result stale after a relevant configuration change", async () => {
    const repository = new FakeExecutionRepository();
    repository.configuration = makeConfiguration({ version: 2 });
    repository.latestExecution = makeExecution(makeConfiguration({ version: 1 }));
    const service = new StockPlanningExecutionService(repository.port);

    const state = await service.getEngineState();

    expect(state.stale).toBe(true);
    expect(state.staleReasons).toContain("configuration_changed");
  });

  it("keeps vigency based on the latest successful result after a later failure", async () => {
    const repository = new FakeExecutionRepository();
    repository.configuration = makeConfiguration({ version: 2 });
    repository.latestSuccessfulExecution = makeExecution(makeConfiguration({ version: 1 }));
    repository.latestExecution = makeExecution(makeConfiguration({ version: 2 }), {
      id: "execution-failed",
      status: "failed",
      completedAt: new Date("2026-07-23T07:01:00.000Z"),
      globalError: "Product calculation failed."
    });
    const service = new StockPlanningExecutionService(repository.port);

    const state = await service.getEngineState();

    expect(state.latestExecution?.status).toBe("failed");
    expect(state.staleReasons).toContain("configuration_changed");
  });

  it("detects a running execution independently from history ordering", async () => {
    const repository = new FakeExecutionRepository();
    repository.latestExecution = makeExecution(repository.configuration);
    repository.executionInProgress = true;
    const service = new StockPlanningExecutionService(repository.port);

    expect((await service.getEngineState()).executionInProgress).toBe(true);
  });
});

describe("Stock planning execution contracts and permissions", () => {
  it("validates weekly day, ordered service levels and maturity thresholds", () => {
    expect(UpdateStockPlanningGlobalConfigurationSchema.parse(makeConfigurationInput({
      frequency: "weekly",
      weekday: 1
    })).weekday).toBe(1);
    expect(() => UpdateStockPlanningGlobalConfigurationSchema.parse(makeConfigurationInput({
      frequency: "daily",
      weekday: 1
    }))).toThrow();
    expect(() => UpdateStockPlanningGlobalConfigurationSchema.parse(makeConfigurationInput({
      serviceLevels: { normal: 0.95, high: 0.9, critical: 0.99 }
    }))).toThrow();
  });

  it.each([
    ["superadmin", true],
    ["admin", false],
    ["seller", false]
  ])("governance permission for %s is %s", (role, allowed) => {
    const calls: unknown[] = [];
    canGovernStockPlanning({
      authenticatedUser: { role: { name: role } }
    } as never, {} as never, (error?: unknown) => calls.push(error));
    expect(calls).toHaveLength(1);
    expect(calls[0] === undefined).toBe(allowed);
  });
});

class FakeExecutionRepository {
  configuration = makeConfiguration();
  latestExecution: StockPlanningExecutionRecord | null = null;
  latestSuccessfulExecution: StockPlanningExecutionRecord | null = null;
  executionInProgress = false;
  lockAcquired = true;
  snapshots: SnapshotCreateInput[] = [];
  createdExecutions: Array<
    Parameters<StockPlanningExecutionRepositoryPort["createRunningExecution"]>[0]
  > = [];
  manualAuditContexts: StockPlanningAuditContext[] = [];
  configurationUpdates: Array<{
    data: Parameters<StockPlanningExecutionRepositoryPort["createConfigurationVersion"]>[0];
    context: StockPlanningAuditContext;
  }> = [];
  reconstructionBatches: Awaited<
    ReturnType<StockPlanningExecutionRepositoryPort["listBatchesForReconstruction"]>
  > = [];
  executionsByKey = new Map<string, StockPlanningExecutionRecord>();
  port = {
    getCurrentConfiguration: async () => this.configuration,
    createConfigurationVersion: async (
      data: Parameters<StockPlanningExecutionRepositoryPort["createConfigurationVersion"]>[0],
      context: StockPlanningAuditContext
    ) => {
      this.configurationUpdates.push({ data, context });
      this.configuration = { ...this.configuration, ...data, id: "configuration-2", version: 2, createdAt: new Date() };
      return this.configuration;
    },
    listExecutions: async () => this.latestExecution ? [this.latestExecution] : [],
    getLatestExecution: async () => this.latestExecution,
    getLatestSuccessfulExecution: async () =>
      this.latestSuccessfulExecution ??
      (this.latestExecution?.status === "succeeded" ||
      this.latestExecution?.status === "succeeded_with_warnings"
        ? this.latestExecution
        : null),
    hasRunningExecution: async () =>
      this.executionInProgress || this.latestExecution?.status === "running",
    findExecutionByIdempotencyKey: async (key: string) => this.executionsByKey.get(key) ?? null,
    runWithExecutionLock: async (
      work: Parameters<StockPlanningExecutionRepositoryPort["runWithExecutionLock"]>[0]
    ) =>
      this.lockAcquired
        ? { acquired: true as const, value: await work({} as Prisma.TransactionClient) }
        : { acquired: false as const },
    findSnapshot: async (date: Date) =>
      this.snapshots.find((snapshot) => snapshot.localDate.getTime() === date.getTime()) ?? null,
    listCurrentBatches: async () => [],
    createSnapshot: async (input: SnapshotCreateInput) => {
      this.snapshots.push(input);
      return input;
    },
    listBatchesForReconstruction: async () => this.reconstructionBatches,
    createRunningExecution: async (
      input: Parameters<StockPlanningExecutionRepositoryPort["createRunningExecution"]>[0]
    ) => {
      this.createdExecutions.push(input);
      return makeExecution(input.configuration, {
        id: `execution-${this.createdExecutions.length}`,
        trigger: input.trigger,
        status: "running",
        scheduledFor: input.scheduledFor,
        demandCutoffDate: input.demandCutoffDate,
        stockCapturedAt: input.stockCapturedAt,
        engineVersion: input.engineVersion,
        fingerprint: input.fingerprint,
        startedAt: input.startedAt
      });
    },
    completeExecution: async (_id: string, completedAt: Date, startedAt: Date) => {
      const input = this.createdExecutions.at(-1);
      if (!input) {
        throw new Error("Expected a running execution before completion.");
      }
      const execution = makeExecution(input.configuration, {
        id: `execution-${this.createdExecutions.length}`,
        trigger: input.trigger,
        scheduledFor: input.scheduledFor,
        demandCutoffDate: input.demandCutoffDate,
        stockCapturedAt: input.stockCapturedAt,
        engineVersion: input.engineVersion,
        fingerprint: input.fingerprint,
        startedAt,
        completedAt
      });
      this.executionsByKey.set(input.idempotencyKey, execution);
      this.latestExecution = execution;
      return execution;
    },
    createManualRecalculationAudit: async (_id: string, context: StockPlanningAuditContext) => {
      this.manualAuditContexts.push(context);
      return {};
    }
  } as StockPlanningExecutionRepositoryPort;
}

function makeConfiguration(overrides: Partial<StockPlanningConfigurationRecord> = {}): StockPlanningConfigurationRecord {
  return {
    id: "configuration-1",
    version: 1,
    engineEnabled: true,
    frequency: "daily",
    weekday: null,
    localTime: "02:00",
    timezone: "America/La_Paz",
    coverageDays: 30,
    normalServiceLevel: new Prisma.Decimal("0.90"),
    highServiceLevel: new Prisma.Decimal("0.95"),
    criticalServiceLevel: new Prisma.Decimal("0.99"),
    minimumHistoryWeeks: 12,
    minimumDemandDays: 4,
    operationalDemandDays: 12,
    createdByUserId: null,
    createdAt: new Date("2026-07-23T00:00:00.000Z"),
    ...overrides
  };
}

function makeExecution(
  configuration: StockPlanningConfigurationRecord,
  overrides: Partial<StockPlanningExecutionRecord> = {}
): StockPlanningExecutionRecord {
  return {
    id: "execution-1",
    configuration,
    trigger: "scheduled",
    status: "succeeded",
    scheduledFor: new Date("2026-07-23T06:00:00.000Z"),
    demandCutoffDate: new Date("2026-07-22T00:00:00.000Z"),
    stockCapturedAt: new Date("2026-07-23T06:00:00.000Z"),
    engineVersion: "0.1.0",
    fingerprint: "fingerprint",
    startedAt: new Date("2026-07-23T06:00:00.000Z"),
    completedAt: new Date("2026-07-23T06:01:00.000Z"),
    durationMs: 60_000,
    globalError: null,
    warnings: [],
    ...overrides
  };
}

function makeConfigurationInput(overrides: Record<string, unknown> = {}) {
  return {
    engineEnabled: true,
    frequency: "daily",
    weekday: null,
    localTime: "02:00",
    coverageDays: 30,
    serviceLevels: { normal: 0.9, high: 0.95, critical: 0.99 },
    maturityThresholds: {
      minimumHistoryWeeks: 12,
      minimumDemandDays: 4,
      operationalDemandDays: 12
    },
    ...overrides
  };
}
