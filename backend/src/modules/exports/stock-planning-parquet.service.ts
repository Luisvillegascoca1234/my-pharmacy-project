import { Prisma } from "@prisma/client";
import type {
  StockPlanningParquetExportQuery,
  StockPlanningPredictionParquetExportQuery
} from "@pharmacy-pos/shared";
import { HttpError } from "../../common/http/http-error.js";
import type { ExportAuditContext } from "./exports.types.js";
import { writeZstdParquet } from "./parquet-writer.js";
import { StockPlanningParquetRepository } from "./stock-planning-parquet.repository.js";
import {
  STOCK_PLANNING_PARQUET_MAX_ROWS,
  STOCK_PLANNING_PARQUET_SCHEMA_VERSION,
  type StockPlanningParquetAuditInput,
  type StockPlanningParquetConfigurationRecord,
  type StockPlanningParquetProductRecord,
  type StockPlanningParquetResult,
  type StockPlanningPredictionExecutionRecord,
  type StockPlanningPredictionForecastRecord,
  type StockPlanningSeriesDemandRecord,
  type StockPlanningSeriesSnapshotRecord
} from "./stock-planning-parquet.types.js";

const PARQUET_CONTENT_TYPE = "application/vnd.apache.parquet" as const;
const DECIMAL_PRECISION = 18;
const QUANTITY_SCALE = 4;
const METRIC_SCALE = 6;

export type StockPlanningParquetRepositoryPort = {
  countProducts(filters: StockPlanningParquetExportQuery): Promise<number>;
  listProducts(filters: StockPlanningParquetExportQuery): Promise<StockPlanningParquetProductRecord[]>;
  findCurrentConfiguration(): Promise<StockPlanningParquetConfigurationRecord>;
  findLatestSuccessfulExecutionId(): Promise<string | null>;
  listSeriesDemand(
    executionId: string,
    productIds: string[],
    from: Date,
    through: Date
  ): Promise<StockPlanningSeriesDemandRecord[]>;
  listSeriesSnapshots(
    productIds: string[],
    from: Date,
    through: Date
  ): Promise<StockPlanningSeriesSnapshotRecord[]>;
  findPredictionExecution(executionId: string): Promise<StockPlanningPredictionExecutionRecord | null>;
  listPredictionForecasts(
    executionId: string,
    productIds: string[],
    from: Date,
    through: Date
  ): Promise<StockPlanningPredictionForecastRecord[]>;
  createGeneratedFileAuditLog(input: StockPlanningParquetAuditInput): Promise<unknown>;
};

export class StockPlanningParquetService {
  constructor(
    private readonly repository: StockPlanningParquetRepositoryPort =
      new StockPlanningParquetRepository(),
    private readonly now: () => Date = () => new Date()
  ) {}

  async exportTimeSeries(
    query: StockPlanningParquetExportQuery,
    context: ExportAuditContext
  ): Promise<StockPlanningParquetResult> {
    const range = parseRange(query);
    const productCount = await this.repository.countProducts(query);
    assertEstimatedRowLimit(productCount, range.dayCount);

    const [products, configuration, latestExecutionId] = await Promise.all([
      this.repository.listProducts(query),
      this.repository.findCurrentConfiguration(),
      this.repository.findLatestSuccessfulExecutionId()
    ]);
    assertEstimatedRowLimit(products.length, range.dayCount);
    const productIds = products.map((product) => product.id);
    const [demand, snapshots] = productIds.length === 0
      ? [[], []] as [StockPlanningSeriesDemandRecord[], StockPlanningSeriesSnapshotRecord[]]
      : await Promise.all([
          latestExecutionId
            ? this.repository.listSeriesDemand(latestExecutionId, productIds, range.from, range.through)
            : Promise.resolve([]),
          this.repository.listSeriesSnapshots(productIds, range.from, range.through)
        ]);
    const rows = buildSeriesRows(products, configuration.coverageDays, range.dates, demand, snapshots);
    assertActualRowLimit(rows.length);
    const generatedAt = this.now();
    const fileName = `stock-planning-time-series_${query.fromDate}_${query.toDate}.parquet`;
    const buffer = writeZstdParquet({
      columns: buildSeriesColumns(rows, generatedAt),
      metadata: buildMetadata("time_series", generatedAt)
    });

    await this.repository.createGeneratedFileAuditLog({
      dataset: "time_series",
      fileName,
      filters: query,
      rowCount: rows.length,
      schemaVersion: STOCK_PLANNING_PARQUET_SCHEMA_VERSION,
      compression: "ZSTD",
      context
    });

    return { fileName, contentType: PARQUET_CONTENT_TYPE, rowCount: rows.length, buffer };
  }

  async exportPredictionResults(
    query: StockPlanningPredictionParquetExportQuery,
    context: ExportAuditContext
  ): Promise<StockPlanningParquetResult> {
    const range = parseRange(query);
    const productCount = await this.repository.countProducts(query);
    assertEstimatedRowLimit(productCount, range.dayCount);

    const execution = await this.repository.findPredictionExecution(query.executionId);
    if (!execution) {
      throw new HttpError(
        404,
        "The selected successful stock planning execution was not found.",
        "STOCK_PLANNING_EXPORT_EXECUTION_NOT_FOUND"
      );
    }

    const products = await this.repository.listProducts(query);
    assertEstimatedRowLimit(products.length, range.dayCount);
    const productIds = products.map((product) => product.id);
    const forecasts = productIds.length === 0
      ? []
      : await this.repository.listPredictionForecasts(
          execution.id,
          productIds,
          range.from,
          range.through
        );
    const rows = buildPredictionRows(products, execution, range.dates, forecasts);
    assertActualRowLimit(rows.length);
    const generatedAt = this.now();
    const fileName =
      `stock-planning-predictions_${execution.id}_${query.fromDate}_${query.toDate}.parquet`;
    const buffer = writeZstdParquet({
      columns: buildPredictionColumns(rows, generatedAt),
      metadata: buildMetadata("prediction_results", generatedAt, execution)
    });

    await this.repository.createGeneratedFileAuditLog({
      dataset: "prediction_results",
      fileName,
      filters: query,
      rowCount: rows.length,
      schemaVersion: STOCK_PLANNING_PARQUET_SCHEMA_VERSION,
      compression: "ZSTD",
      context
    });

    return { fileName, contentType: PARQUET_CONTENT_TYPE, rowCount: rows.length, buffer };
  }
}

type ParsedRange = {
  from: Date;
  through: Date;
  dates: Date[];
  dayCount: number;
};

function parseRange(query: StockPlanningParquetExportQuery): ParsedRange {
  const from = dateOnly(query.fromDate);
  const through = dateOnly(query.toDate);
  if (from > through) {
    throw new HttpError(
      400,
      "fromDate must be less than or equal to toDate.",
      "INVALID_STOCK_PLANNING_EXPORT_DATE_RANGE"
    );
  }
  const maximumThrough = new Date(from);
  maximumThrough.setUTCFullYear(maximumThrough.getUTCFullYear() + 5);
  if (through > maximumThrough) {
    throw new HttpError(
      400,
      "The stock planning export range cannot exceed five years.",
      "STOCK_PLANNING_EXPORT_RANGE_TOO_LARGE"
    );
  }

  const dates: Date[] = [];
  for (let date = from; date <= through; date = addUtcDays(date, 1)) {
    dates.push(date);
  }
  return { from, through, dates, dayCount: dates.length };
}

function assertEstimatedRowLimit(productCount: number, dayCount: number) {
  const estimatedRows = productCount * dayCount;
  if (estimatedRows > STOCK_PLANNING_PARQUET_MAX_ROWS) {
    throw new HttpError(
      413,
      `The estimated export contains ${estimatedRows} rows; the maximum is ${STOCK_PLANNING_PARQUET_MAX_ROWS}.`,
      "STOCK_PLANNING_EXPORT_ROW_LIMIT_EXCEEDED"
    );
  }
}

function assertActualRowLimit(rowCount: number) {
  if (rowCount > STOCK_PLANNING_PARQUET_MAX_ROWS) {
    throw new HttpError(
      413,
      `The export contains ${rowCount} rows; the maximum is ${STOCK_PLANNING_PARQUET_MAX_ROWS}.`,
      "STOCK_PLANNING_EXPORT_ROW_LIMIT_EXCEEDED"
    );
  }
}

type SeriesRow = {
  product: StockPlanningParquetProductRecord;
  localDate: Date;
  coverageDays: number;
  demand: StockPlanningSeriesDemandRecord | null;
  stockQuantity: Prisma.Decimal | null;
  snapshotCapturedAt: Date | null;
  snapshotReconstructed: boolean | null;
};

function buildSeriesRows(
  products: StockPlanningParquetProductRecord[],
  globalCoverageDays: number,
  dates: Date[],
  demand: StockPlanningSeriesDemandRecord[],
  snapshots: StockPlanningSeriesSnapshotRecord[]
): SeriesRow[] {
  const demandByProductDate = new Map(
    demand.map((point) => [key(point.forecast.productId, point.localDate), point])
  );
  const stockByProductDate = new Map<string, {
    quantity: Prisma.Decimal;
    capturedAt: Date;
    reconstructed: boolean;
  }>();
  for (const snapshot of snapshots) {
    const quantities = new Map<string, Prisma.Decimal>();
    for (const line of snapshot.lines) {
      quantities.set(
        line.productId,
        (quantities.get(line.productId) ?? new Prisma.Decimal(0)).add(line.availableQuantity)
      );
    }
    for (const [productId, quantity] of quantities) {
      stockByProductDate.set(key(productId, snapshot.localDate), {
        quantity,
        capturedAt: snapshot.capturedAt,
        reconstructed: snapshot.source === "reconstructed"
      });
    }
  }

  return products.flatMap((product) => dates.map((localDate) => {
    const stock = stockByProductDate.get(key(product.id, localDate));
    return {
      product,
      localDate,
      coverageDays: product.stockCoverageDays ?? globalCoverageDays,
      demand: demandByProductDate.get(key(product.id, localDate)) ?? null,
      stockQuantity: stock?.quantity ?? null,
      snapshotCapturedAt: stock?.capturedAt ?? null,
      snapshotReconstructed: stock?.reconstructed ?? null
    };
  }));
}

type PredictionRow = {
  product: StockPlanningParquetProductRecord;
  execution: StockPlanningPredictionExecutionRecord;
  localDate: Date;
  forecast: StockPlanningPredictionForecastRecord | null;
  point: StockPlanningPredictionForecastRecord["forecastPoints"][number] | null;
};

function buildPredictionRows(
  products: StockPlanningParquetProductRecord[],
  execution: StockPlanningPredictionExecutionRecord,
  dates: Date[],
  forecasts: StockPlanningPredictionForecastRecord[]
): PredictionRow[] {
  const forecastByProduct = new Map(forecasts.map((forecast) => [forecast.productId, forecast]));
  return products.flatMap((product) => {
    const forecast = forecastByProduct.get(product.id) ?? null;
    const pointsByDate = new Map(
      forecast?.forecastPoints.map((point) => [key(product.id, point.localDate), point]) ?? []
    );

    return dates.map((localDate) => ({
      product,
      execution,
      localDate,
      forecast,
      point: pointsByDate.get(key(product.id, localDate)) ?? null
    }));
  });
}

function buildSeriesColumns(rows: SeriesRow[], generatedAt: Date) {
  return [
    strings("product_id", rows.map((row) => row.product.id)),
    strings("internal_code", rows.map((row) => row.product.internalCode)),
    strings("commercial_name", rows.map((row) => row.product.commercialName)),
    strings("product_status", rows.map((row) => row.product.status)),
    strings("category_id", rows.map((row) => row.product.category.id)),
    strings("category_name", rows.map((row) => row.product.category.name)),
    strings("supplier_id", rows.map((row) => row.product.supplier.id)),
    strings("supplier_name", rows.map((row) => row.product.supplier.businessName)),
    dates("local_date", rows.map((row) => row.localDate)),
    decimals("gross_demand", rows.map((row) => row.demand?.grossDemand ?? null), QUANTITY_SCALE),
    decimals("returned_quantity", rows.map((row) => row.demand?.returnedQuantity ?? null), QUANTITY_SCALE),
    decimals("net_demand", rows.map((row) => row.demand?.netDemand ?? null), QUANTITY_SCALE),
    booleans("censored", rows.map((row) => row.demand?.censored ?? null)),
    decimals("stock_quantity", rows.map((row) => row.stockQuantity), QUANTITY_SCALE),
    strings("criticality", rows.map((row) => row.product.stockCriticality)),
    int32s("coverage_days", rows.map((row) => row.coverageDays)),
    strings("source_execution_id", rows.map((row) => row.demand?.forecast.executionId ?? null)),
    timestamps("source_execution_started_at", rows.map((row) => row.demand?.forecast.execution.startedAt ?? null)),
    timestamps("snapshot_captured_at", rows.map((row) => row.snapshotCapturedAt)),
    booleans("snapshot_reconstructed", rows.map((row) => row.snapshotReconstructed)),
    timestamps("generated_at", rows.map(() => generatedAt))
  ];
}

function buildPredictionColumns(rows: PredictionRow[], generatedAt: Date) {
  return [
    strings("product_id", rows.map((row) => row.product.id)),
    strings("internal_code", rows.map((row) => row.product.internalCode)),
    strings("commercial_name", rows.map((row) => row.product.commercialName)),
    strings("product_status", rows.map((row) => row.product.status)),
    strings("category_id", rows.map((row) => row.product.category.id)),
    strings("supplier_id", rows.map((row) => row.product.supplier.id)),
    strings("execution_id", rows.map((row) => row.execution.id)),
    timestamps("execution_started_at", rows.map((row) => row.execution.startedAt)),
    int32s("configuration_version", rows.map((row) => row.execution.configuration.version)),
    strings("engine_version", rows.map((row) => row.forecast?.engineVersion ?? row.execution.engineVersion)),
    strings("rules_version", rows.map((row) => row.forecast?.rulesVersion ?? null)),
    dates("local_date", rows.map((row) => row.localDate)),
    booleans("prediction_available", rows.map((row) => row.point !== null)),
    decimals("central_estimate", rows.map((row) => row.point?.central ?? null), QUANTITY_SCALE),
    decimals("lower_80", rows.map((row) => row.point?.lower80 ?? null), QUANTITY_SCALE),
    decimals("upper_80", rows.map((row) => row.point?.upper80 ?? null), QUANTITY_SCALE),
    decimals("target_stock", rows.map((row) => recommendationDecimal(row.forecast, "targetStock")), QUANTITY_SCALE),
    decimals("suggested_quantity", rows.map((row) => recommendationDecimal(row.forecast, "suggestedQuantity")), QUANTITY_SCALE),
    strings("model", rows.map((row) => row.forecast?.model ?? null)),
    strings("maturity", rows.map((row) => row.forecast?.maturity ?? null)),
    strings("confidence", rows.map((row) => row.forecast?.confidence ?? null)),
    decimals("scaled_error", rows.map((row) => metricDecimal(row.forecast, "scaledError")), METRIC_SCALE),
    decimals("mean_absolute_error", rows.map((row) => metricDecimal(row.forecast, "meanAbsoluteError")), METRIC_SCALE),
    decimals("bias", rows.map((row) => row.forecast?.bias ?? null), METRIC_SCALE),
    int32s("evaluated_points", rows.map((row) => metricInteger(row.forecast, "evaluatedPoints"))),
    timestamps("generated_at", rows.map(() => generatedAt))
  ];
}

function buildMetadata(
  dataset: "time_series" | "prediction_results",
  generatedAt: Date,
  execution?: StockPlanningPredictionExecutionRecord
) {
  return {
    "pharmacy_pos.schema_name": `stock_planning.${dataset}`,
    "pharmacy_pos.schema_version": STOCK_PLANNING_PARQUET_SCHEMA_VERSION,
    "pharmacy_pos.compression": "ZSTD",
    "pharmacy_pos.generated_at_utc": generatedAt.toISOString(),
    ...(execution ? { "pharmacy_pos.execution_id": execution.id } : {})
  };
}

function recommendationDecimal(
  forecast: StockPlanningPredictionForecastRecord | null,
  field: string
): Prisma.Decimal.Value | null {
  return jsonNumber(forecast?.recommendation, field);
}

function metricDecimal(
  forecast: StockPlanningPredictionForecastRecord | null,
  field: string
): Prisma.Decimal.Value | null {
  return jsonNumber(forecast?.metrics, field);
}

function metricInteger(forecast: StockPlanningPredictionForecastRecord | null, field: string) {
  const value = jsonNumber(forecast?.metrics, field);
  return typeof value === "number" && Number.isInteger(value) ? value : null;
}

function jsonNumber(value: Prisma.JsonValue | null | undefined, field: string) {
  if (!value || Array.isArray(value) || typeof value !== "object") return null;
  const candidate = value[field];
  return typeof candidate === "number" && Number.isFinite(candidate) ? candidate : null;
}

function strings(name: string, values: Array<string | null>) {
  return { name, type: "string" as const, values };
}

function booleans(name: string, values: Array<boolean | null>) {
  return { name, type: "boolean" as const, values };
}

function dates(name: string, values: Array<Date | null>) {
  return { name, type: "date" as const, values };
}

function timestamps(name: string, values: Array<Date | null>) {
  return { name, type: "timestamp" as const, values };
}

function int32s(name: string, values: Array<number | null>) {
  return { name, type: "int32" as const, values };
}

function decimals(name: string, values: Array<Prisma.Decimal.Value | null>, scale: number) {
  return { name, type: "decimal" as const, precision: DECIMAL_PRECISION, scale, values };
}

function key(productId: string, date: Date) {
  return `${productId}:${date.toISOString().slice(0, 10)}`;
}

function dateOnly(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

function addUtcDays(value: Date, days: number) {
  const next = new Date(value);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}
