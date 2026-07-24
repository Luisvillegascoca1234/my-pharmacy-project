import type {
  InventoryBatchStatus,
  InventorySnapshotSource,
  Prisma,
  StockPlanningExecutionStatus,
  StockPlanningExecutionTrigger,
  StockPlanningFrequency
} from "@prisma/client";

export type StockPlanningConfigurationRecord = {
  id: string;
  version: number;
  engineEnabled: boolean;
  frequency: StockPlanningFrequency;
  weekday: number | null;
  localTime: string;
  timezone: string;
  coverageDays: number;
  normalServiceLevel: Prisma.Decimal;
  highServiceLevel: Prisma.Decimal;
  criticalServiceLevel: Prisma.Decimal;
  minimumHistoryWeeks: number;
  minimumDemandDays: number;
  operationalDemandDays: number;
  createdByUserId: string | null;
  createdAt: Date;
};

export type StockPlanningExecutionRecord = {
  id: string;
  configuration: StockPlanningConfigurationRecord;
  trigger: StockPlanningExecutionTrigger;
  status: StockPlanningExecutionStatus;
  scheduledFor: Date | null;
  demandCutoffDate: Date;
  stockCapturedAt: Date;
  engineVersion: string;
  fingerprint: string;
  startedAt: Date;
  completedAt: Date | null;
  durationMs: number | null;
  globalError: string | null;
  warnings: Prisma.JsonValue | null;
};

export type SnapshotBatchRecord = {
  id: string;
  productId: string;
  batchNumber: string | null;
  expirationDate: Date | null;
  status: InventoryBatchStatus;
  availableQuantity: Prisma.Decimal;
};

export type SnapshotCreateInput = {
  localDate: Date;
  source: InventorySnapshotSource;
  capturedAt: Date;
  batches: SnapshotBatchRecord[];
};

