import type {
  ForecastConfidence,
  ForecastMaturity,
  ForecastModel,
  Prisma,
  StockCriticality
} from "@prisma/client";
import type {
  StockPlanningParquetExportQuery,
  StockPlanningPredictionParquetExportQuery
} from "@pharmacy-pos/shared";
import type { ExportAuditContext } from "./exports.types.js";

export const STOCK_PLANNING_PARQUET_SCHEMA_VERSION = "1.0.0";
export const STOCK_PLANNING_PARQUET_MAX_ROWS = 1_000_000;

export type StockPlanningParquetFilters = StockPlanningParquetExportQuery;
export type StockPlanningPredictionParquetFilters = StockPlanningPredictionParquetExportQuery;

export type StockPlanningParquetProductRecord = {
  id: string;
  internalCode: string;
  commercialName: string;
  status: "active" | "inactive";
  stockCriticality: StockCriticality;
  stockCoverageDays: number | null;
  category: { id: string; name: string };
  supplier: { id: string; businessName: string };
};

export type StockPlanningSeriesDemandRecord = {
  localDate: Date;
  grossDemand: Prisma.Decimal;
  returnedQuantity: Prisma.Decimal;
  netDemand: Prisma.Decimal;
  censored: boolean;
  forecast: {
    productId: string;
    executionId: string;
    execution: { startedAt: Date };
  };
};

export type StockPlanningParquetConfigurationRecord = {
  coverageDays: number;
};

export type StockPlanningSeriesSnapshotRecord = {
  localDate: Date;
  capturedAt: Date;
  source: "captured" | "reconstructed";
  lines: Array<{
    productId: string;
    availableQuantity: Prisma.Decimal;
  }>;
};

export type StockPlanningPredictionExecutionRecord = {
  id: string;
  startedAt: Date;
  engineVersion: string;
  configuration: { version: number; coverageDays: number };
};

export type StockPlanningPredictionForecastRecord = {
  productId: string;
  maturity: ForecastMaturity;
  confidence: ForecastConfidence;
  model: ForecastModel | null;
  bias: Prisma.Decimal;
  metrics: Prisma.JsonValue;
  recommendation: Prisma.JsonValue | null;
  engineVersion: string;
  rulesVersion: string;
  forecastPoints: Array<{
    localDate: Date;
    central: Prisma.Decimal;
    lower80: Prisma.Decimal;
    upper80: Prisma.Decimal;
  }>;
};

export type StockPlanningParquetResult = {
  fileName: string;
  contentType: "application/vnd.apache.parquet";
  rowCount: number;
  buffer: Buffer;
};

export type StockPlanningParquetAuditInput = {
  dataset: "time_series" | "prediction_results";
  fileName: string;
  filters: StockPlanningParquetFilters | StockPlanningPredictionParquetFilters;
  rowCount: number;
  schemaVersion: string;
  compression: "ZSTD";
  context: ExportAuditContext;
};
