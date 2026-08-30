import { Prisma } from "@prisma/client";
import { tableFromIPC } from "apache-arrow";
import { Compression, ParquetFile, readParquet } from "parquet-wasm";
import { describe, expect, it } from "vitest";
import { expectHttpError } from "../../tests/utils/http-error.js";
import {
  StockPlanningParquetService,
  type StockPlanningParquetRepositoryPort
} from "./stock-planning-parquet.service.js";
import type {
  StockPlanningParquetAuditInput,
  StockPlanningParquetProductRecord,
  StockPlanningPredictionExecutionRecord,
  StockPlanningPredictionForecastRecord,
  StockPlanningSeriesDemandRecord,
  StockPlanningSeriesSnapshotRecord
} from "./stock-planning-parquet.types.js";

const context = {
  actorUserId: "admin-1",
  ipAddress: "127.0.0.1",
  userAgent: "vitest"
};

describe("StockPlanningParquetService", () => {
  it("writes and reads a typed ZSTD time-series file with filters, nulls and audit", async () => {
    const repository = new FakeStockPlanningParquetRepository();
    repository.products = [product()];
    repository.latestExecutionId = "execution-1";
    repository.demand = [{
      localDate: new Date("2026-07-01T00:00:00.000Z"),
      grossDemand: decimal("3.5000"),
      returnedQuantity: decimal("0.5000"),
      netDemand: decimal("3.0000"),
      censored: false,
      forecast: {
        productId: "product-1",
        executionId: "execution-1",
        execution: { startedAt: new Date("2026-07-02T06:00:00.000Z") }
      }
    }];
    repository.snapshots = [{
      localDate: new Date("2026-07-01T00:00:00.000Z"),
      capturedAt: new Date("2026-07-01T04:00:00.000Z"),
      source: "reconstructed",
      lines: [
        { productId: "product-1", availableQuantity: decimal("10.2500") },
        { productId: "product-1", availableQuantity: decimal("2.0000") }
      ]
    }];
    const service = new StockPlanningParquetService(
      repository,
      () => new Date("2026-07-23T20:00:00.000Z")
    );
    const filters = {
      fromDate: "2026-07-01",
      toDate: "2026-07-02",
      categoryId: "category-1",
      supplierId: "supplier-1"
    };

    const result = await service.exportTimeSeries(filters, context);

    expect(repository.lastCountFilters).toEqual(filters);
    expect(repository.lastProductFilters).toEqual(filters);
    expect(result.rowCount).toBe(2);
    expect(result.contentType).toBe("application/vnd.apache.parquet");
    expect(result.buffer.subarray(0, 4).toString()).toBe("PAR1");

    const inspection = await inspect(result.buffer);
    expect(inspection.metadata.get("pharmacy_pos.schema_version")).toBe("1.0.0");
    expect(inspection.metadata.get("pharmacy_pos.compression")).toBe("ZSTD");
    expect(inspection.compressions).toEqual(new Set([Compression.ZSTD]));
    expect(inspection.table.schema.fields.find((field) => field.name === "local_date")?.type.toString())
      .toBe("Date32<DAY>");
    expect(inspection.table.schema.fields.find((field) => field.name === "gross_demand")?.type.toString())
      .toBe("Decimal[18e+4]");
    expect(inspection.table.schema.fields.find((field) => field.name === "snapshot_captured_at")?.type.toString())
      .toBe("Timestamp<MILLISECOND, UTC>");
    expect(inspection.table.schema.fields.find((field) => field.name === "censored")?.type.toString())
      .toBe("Bool");
    expect(inspection.table.getChild("local_date")?.get(0)).toBe(
      new Date("2026-07-01T00:00:00.000Z").getTime()
    );
    expect(inspection.table.getChild("source_execution_started_at")?.get(0)).toBe(
      new Date("2026-07-02T06:00:00.000Z").getTime()
    );
    expect(String(inspection.table.getChild("gross_demand")?.get(0))).toBe("35000");
    expect(inspection.table.getChild("gross_demand")?.nullCount).toBe(1);
    expect(inspection.table.getChild("snapshot_captured_at")?.nullCount).toBe(1);
    expect(repository.auditLogs).toEqual([
      expect.objectContaining({
        dataset: "time_series",
        filters,
        rowCount: 2,
        schemaVersion: "1.0.0",
        compression: "ZSTD",
        context
      })
    ]);
  });

  it("exports one row per product, execution and date while keeping missing predictions typed as null", async () => {
    const repository = new FakeStockPlanningParquetRepository();
    repository.products = [product(), product({
      id: "product-2",
      internalCode: "MED-002",
      commercialName: "Ibuprofeno 400 mg",
      status: "inactive"
    })];
    repository.execution = execution();
    repository.forecasts = [{
      productId: "product-1",
      maturity: "operational",
      confidence: "high",
      model: "holt",
      bias: decimal("-0.125000"),
      metrics: {
        scaledError: 0.75,
        meanAbsoluteError: 1.25,
        bias: -0.125,
        evaluatedPoints: 14
      },
      recommendation: { targetStock: 25.5, suggestedQuantity: 10 },
      engineVersion: "forecast-engine-v1",
      rulesVersion: "forecast-rules-v1",
      forecastPoints: [{
        localDate: new Date("2026-07-10T00:00:00.000Z"),
        central: decimal("4.0000"),
        lower80: decimal("2.0000"),
        upper80: decimal("7.0000")
      }]
    }];
    const service = new StockPlanningParquetService(repository);

    const result = await service.exportPredictionResults({
      fromDate: "2026-07-10",
      toDate: "2026-07-12",
      executionId: "execution-7",
      productId: "product-filter"
    }, context);

    expect(repository.lastExecutionId).toBe("execution-7");
    expect(repository.lastPredictionExecutionId).toBe("execution-7");
    expect(result.rowCount).toBe(6);
    const inspection = await inspect(result.buffer);
    expect(inspection.metadata.get("pharmacy_pos.execution_id")).toBe("execution-7");
    expect(inspection.table.getChild("local_date")?.nullCount).toBe(0);
    expect(inspection.table.getChild("central_estimate")?.nullCount).toBe(5);
    expect(inspection.table.getChild("model")?.nullCount).toBe(3);
    expect(Array.from(inspection.table.getChild("prediction_available") ?? []))
      .toEqual([true, false, false, false, false, false]);
    expect(Array.from(inspection.table.getChild("local_date") ?? [])).toEqual([
      new Date("2026-07-10T00:00:00.000Z").getTime(),
      new Date("2026-07-11T00:00:00.000Z").getTime(),
      new Date("2026-07-12T00:00:00.000Z").getTime(),
      new Date("2026-07-10T00:00:00.000Z").getTime(),
      new Date("2026-07-11T00:00:00.000Z").getTime(),
      new Date("2026-07-12T00:00:00.000Z").getTime()
    ]);
    expect(repository.auditLogs).toHaveLength(1);
  });

  it("rejects a range over five years before generating or auditing", async () => {
    const repository = new FakeStockPlanningParquetRepository();
    const service = new StockPlanningParquetService(repository);

    const error = await service.exportTimeSeries({
      fromDate: "2021-01-01",
      toDate: "2026-01-02"
    }, context).catch((caught) => caught);

    expectHttpError(error, {
      statusCode: 400,
      code: "STOCK_PLANNING_EXPORT_RANGE_TOO_LARGE"
    });
    expect(repository.countCalls).toBe(0);
    expect(repository.auditLogs).toHaveLength(0);
  });

  it("rejects an estimated result over one million rows before querying data or auditing", async () => {
    const repository = new FakeStockPlanningParquetRepository();
    repository.productCount = 1_000_001;
    const service = new StockPlanningParquetService(repository);

    const error = await service.exportTimeSeries({
      fromDate: "2026-07-01",
      toDate: "2026-07-01"
    }, context).catch((caught) => caught);

    expectHttpError(error, {
      statusCode: 413,
      code: "STOCK_PLANNING_EXPORT_ROW_LIMIT_EXCEEDED"
    });
    expect(repository.listProductCalls).toBe(0);
    expect(repository.auditLogs).toHaveLength(0);
  });

  it("rejects a missing predictive execution without generating or auditing", async () => {
    const repository = new FakeStockPlanningParquetRepository();
    repository.products = [product()];
    const service = new StockPlanningParquetService(repository);

    const error = await service.exportPredictionResults({
      fromDate: "2026-07-01",
      toDate: "2026-07-31",
      executionId: "missing"
    }, context).catch((caught) => caught);

    expectHttpError(error, {
      statusCode: 404,
      code: "STOCK_PLANNING_EXPORT_EXECUTION_NOT_FOUND"
    });
    expect(repository.auditLogs).toHaveLength(0);
  });
});

class FakeStockPlanningParquetRepository implements StockPlanningParquetRepositoryPort {
  products: StockPlanningParquetProductRecord[] = [];
  productCount?: number;
  latestExecutionId: string | null = null;
  demand: StockPlanningSeriesDemandRecord[] = [];
  snapshots: StockPlanningSeriesSnapshotRecord[] = [];
  execution: StockPlanningPredictionExecutionRecord | null = null;
  forecasts: StockPlanningPredictionForecastRecord[] = [];
  auditLogs: StockPlanningParquetAuditInput[] = [];
  countCalls = 0;
  listProductCalls = 0;
  lastCountFilters?: unknown;
  lastProductFilters?: unknown;
  lastExecutionId?: string;
  lastPredictionExecutionId?: string;

  countProducts(filters: unknown) {
    this.countCalls += 1;
    this.lastCountFilters = filters;
    return Promise.resolve(this.productCount ?? this.products.length);
  }

  listProducts(filters: unknown) {
    this.listProductCalls += 1;
    this.lastProductFilters = filters;
    return Promise.resolve(this.products);
  }

  findCurrentConfiguration() {
    return Promise.resolve({ coverageDays: 30 });
  }

  findLatestSuccessfulExecutionId() {
    return Promise.resolve(this.latestExecutionId);
  }

  listSeriesDemand() {
    return Promise.resolve(this.demand);
  }

  listSeriesSnapshots() {
    return Promise.resolve(this.snapshots);
  }

  findPredictionExecution(executionId: string) {
    this.lastExecutionId = executionId;
    return Promise.resolve(this.execution);
  }

  listPredictionForecasts(executionId: string) {
    this.lastPredictionExecutionId = executionId;
    return Promise.resolve(this.forecasts);
  }

  createGeneratedFileAuditLog(input: StockPlanningParquetAuditInput) {
    this.auditLogs.push(input);
    return Promise.resolve({ id: `audit-${this.auditLogs.length}` });
  }
}

function product(
  overrides: Partial<StockPlanningParquetProductRecord> = {}
): StockPlanningParquetProductRecord {
  return {
    id: overrides.id ?? "product-1",
    internalCode: overrides.internalCode ?? "MED-001",
    commercialName: overrides.commercialName ?? "Paracetamol 500 mg",
    status: overrides.status ?? "active",
    stockCriticality: overrides.stockCriticality ?? "high",
    stockCoverageDays: overrides.stockCoverageDays ?? null,
    category: overrides.category ?? { id: "category-1", name: "Analgésicos" },
    supplier: overrides.supplier ?? { id: "supplier-1", businessName: "Distribuidora Uno" }
  };
}

function execution(): StockPlanningPredictionExecutionRecord {
  return {
    id: "execution-7",
    startedAt: new Date("2026-07-09T06:00:00.000Z"),
    engineVersion: "forecast-engine-v1",
    configuration: { version: 7, coverageDays: 30 }
  };
}

function decimal(value: Prisma.Decimal.Value) {
  return new Prisma.Decimal(value);
}

async function inspect(buffer: Buffer) {
  const parquetFile = await ParquetFile.fromFile(new Blob([new Uint8Array(buffer)]));
  const parquetMetadata = parquetFile.metadata();
  const metadata = parquetMetadata.fileMetadata().keyValueMetadata() as Map<string, string>;
  const compressions = new Set(
    parquetMetadata.rowGroups().flatMap((group) =>
      group.columns().map((column) => column.compression())
    )
  );
  const table = tableFromIPC(readParquet(new Uint8Array(buffer)).intoIPCStream());
  parquetFile.free();
  return { metadata, compressions, table };
}
