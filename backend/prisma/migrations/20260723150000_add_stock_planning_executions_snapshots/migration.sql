CREATE TYPE "StockPlanningFrequency" AS ENUM ('daily', 'weekly');
CREATE TYPE "StockPlanningExecutionTrigger" AS ENUM ('scheduled', 'manual', 'recovery');
CREATE TYPE "StockPlanningExecutionStatus" AS ENUM ('running', 'succeeded', 'succeeded_with_warnings', 'failed');
CREATE TYPE "InventorySnapshotSource" AS ENUM ('captured', 'reconstructed');

CREATE TABLE "StockPlanningConfiguration" (
  "id" TEXT NOT NULL, "version" INTEGER NOT NULL, "engineEnabled" BOOLEAN NOT NULL DEFAULT true,
  "frequency" "StockPlanningFrequency" NOT NULL DEFAULT 'daily', "weekday" INTEGER,
  "localTime" TEXT NOT NULL DEFAULT '02:00', "timezone" TEXT NOT NULL DEFAULT 'America/La_Paz',
  "coverageDays" INTEGER NOT NULL DEFAULT 30,
  "normalServiceLevel" DECIMAL(5,4) NOT NULL DEFAULT 0.90,
  "highServiceLevel" DECIMAL(5,4) NOT NULL DEFAULT 0.95,
  "criticalServiceLevel" DECIMAL(5,4) NOT NULL DEFAULT 0.99,
  "minimumHistoryWeeks" INTEGER NOT NULL DEFAULT 12, "minimumDemandDays" INTEGER NOT NULL DEFAULT 4,
  "operationalDemandDays" INTEGER NOT NULL DEFAULT 12, "createdByUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StockPlanningConfiguration_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "StockPlanningConfiguration_schedule_check" CHECK (("frequency" = 'daily' AND "weekday" IS NULL) OR ("frequency" = 'weekly' AND "weekday" BETWEEN 0 AND 6)),
  CONSTRAINT "StockPlanningConfiguration_time_check" CHECK ("localTime" ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  CONSTRAINT "StockPlanningConfiguration_timezone_check" CHECK ("timezone" = 'America/La_Paz'),
  CONSTRAINT "StockPlanningConfiguration_coverage_check" CHECK ("coverageDays" BETWEEN 1 AND 365),
  CONSTRAINT "StockPlanningConfiguration_service_levels_check" CHECK ("normalServiceLevel" > 0 AND "normalServiceLevel" < 1 AND "highServiceLevel" > "normalServiceLevel" AND "criticalServiceLevel" > "highServiceLevel" AND "criticalServiceLevel" < 1),
  CONSTRAINT "StockPlanningConfiguration_maturity_check" CHECK ("minimumHistoryWeeks" > 0 AND "minimumDemandDays" > 0 AND "operationalDemandDays" > "minimumDemandDays")
);
CREATE UNIQUE INDEX "StockPlanningConfiguration_version_key" ON "StockPlanningConfiguration"("version");
CREATE INDEX "StockPlanningConfiguration_createdAt_idx" ON "StockPlanningConfiguration"("createdAt");
INSERT INTO "StockPlanningConfiguration" ("id", "version", "engineEnabled", "frequency", "weekday", "localTime", "timezone", "coverageDays", "normalServiceLevel", "highServiceLevel", "criticalServiceLevel", "minimumHistoryWeeks", "minimumDemandDays", "operationalDemandDays")
VALUES ('stock-planning-configuration-v1', 1, true, 'daily', NULL, '02:00', 'America/La_Paz', 30, 0.90, 0.95, 0.99, 12, 4, 12);

CREATE TABLE "StockPlanningExecution" (
  "id" TEXT NOT NULL, "idempotencyKey" TEXT NOT NULL, "configurationId" TEXT NOT NULL,
  "configurationSnapshot" JSONB NOT NULL, "trigger" "StockPlanningExecutionTrigger" NOT NULL,
  "status" "StockPlanningExecutionStatus" NOT NULL, "scheduledFor" TIMESTAMP(3),
  "demandCutoffDate" DATE NOT NULL, "stockCapturedAt" TIMESTAMP(3) NOT NULL,
  "engineVersion" TEXT NOT NULL, "fingerprint" TEXT NOT NULL, "requestedByUserId" TEXT,
  "startedAt" TIMESTAMP(3) NOT NULL, "completedAt" TIMESTAMP(3), "durationMs" INTEGER,
  "globalError" TEXT, "warnings" JSONB, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "StockPlanningExecution_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "StockPlanningExecution_lifecycle_check" CHECK (
    ("status" = 'running' AND "completedAt" IS NULL AND "durationMs" IS NULL)
    OR
    ("status" <> 'running' AND "completedAt" IS NOT NULL AND "durationMs" >= 0)
  ),
  CONSTRAINT "StockPlanningExecution_error_check" CHECK (
    ("status" = 'failed' AND NULLIF(BTRIM("globalError"), '') IS NOT NULL)
    OR
    ("status" <> 'failed' AND "globalError" IS NULL)
  ),
  CONSTRAINT "StockPlanningExecution_warnings_check" CHECK (
    "warnings" IS NULL OR jsonb_typeof("warnings") = 'array'
  )
);
CREATE UNIQUE INDEX "StockPlanningExecution_idempotencyKey_key" ON "StockPlanningExecution"("idempotencyKey");
CREATE INDEX "StockPlanningExecution_status_startedAt_idx" ON "StockPlanningExecution"("status", "startedAt");
CREATE INDEX "StockPlanningExecution_scheduledFor_idx" ON "StockPlanningExecution"("scheduledFor");
CREATE INDEX "StockPlanningExecution_configurationId_idx" ON "StockPlanningExecution"("configurationId");

CREATE TABLE "InventorySnapshot" (
  "id" TEXT NOT NULL, "localDate" DATE NOT NULL, "source" "InventorySnapshotSource" NOT NULL,
  "capturedAt" TIMESTAMP(3) NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "InventorySnapshot_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "InventorySnapshot_localDate_key" ON "InventorySnapshot"("localDate");
CREATE INDEX "InventorySnapshot_source_localDate_idx" ON "InventorySnapshot"("source", "localDate");

CREATE TABLE "InventorySnapshotLine" (
  "id" TEXT NOT NULL, "snapshotId" TEXT NOT NULL, "productId" TEXT NOT NULL, "batchId" TEXT NOT NULL,
  "batchNumber" TEXT, "expirationDate" DATE, "batchStatus" "InventoryBatchStatus" NOT NULL,
  "availableQuantity" DECIMAL(12,4) NOT NULL,
  CONSTRAINT "InventorySnapshotLine_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "InventorySnapshotLine_quantity_check" CHECK ("availableQuantity" >= 0)
);
CREATE UNIQUE INDEX "InventorySnapshotLine_snapshotId_batchId_key" ON "InventorySnapshotLine"("snapshotId", "batchId");
CREATE INDEX "InventorySnapshotLine_productId_snapshotId_idx" ON "InventorySnapshotLine"("productId", "snapshotId");
CREATE INDEX "InventorySnapshotLine_batchId_idx" ON "InventorySnapshotLine"("batchId");

ALTER TABLE "StockPlanningConfiguration" ADD CONSTRAINT "StockPlanningConfiguration_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "StockPlanningExecution" ADD CONSTRAINT "StockPlanningExecution_configurationId_fkey" FOREIGN KEY ("configurationId") REFERENCES "StockPlanningConfiguration"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StockPlanningExecution" ADD CONSTRAINT "StockPlanningExecution_requestedByUserId_fkey" FOREIGN KEY ("requestedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "InventorySnapshotLine" ADD CONSTRAINT "InventorySnapshotLine_snapshotId_fkey" FOREIGN KEY ("snapshotId") REFERENCES "InventorySnapshot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InventorySnapshotLine" ADD CONSTRAINT "InventorySnapshotLine_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InventorySnapshotLine" ADD CONSTRAINT "InventorySnapshotLine_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "InventoryBatch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE FUNCTION prevent_stock_planning_immutable_change() RETURNS trigger AS $$
BEGIN RAISE EXCEPTION '% records are immutable', TG_TABLE_NAME; END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER "StockPlanningConfiguration_immutable" BEFORE UPDATE OR DELETE ON "StockPlanningConfiguration" FOR EACH ROW EXECUTE FUNCTION prevent_stock_planning_immutable_change();
CREATE TRIGGER "InventorySnapshot_immutable" BEFORE UPDATE OR DELETE ON "InventorySnapshot" FOR EACH ROW EXECUTE FUNCTION prevent_stock_planning_immutable_change();
CREATE TRIGGER "InventorySnapshotLine_immutable" BEFORE UPDATE OR DELETE ON "InventorySnapshotLine" FOR EACH ROW EXECUTE FUNCTION prevent_stock_planning_immutable_change();

CREATE FUNCTION protect_completed_stock_planning_execution() RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN RAISE EXCEPTION 'stock planning executions are immutable'; END IF;
  IF OLD."status" <> 'running' OR NEW."status" = 'running' THEN RAISE EXCEPTION 'completed stock planning executions are immutable'; END IF;
  IF NEW."id" IS DISTINCT FROM OLD."id"
    OR NEW."idempotencyKey" IS DISTINCT FROM OLD."idempotencyKey"
    OR NEW."configurationId" IS DISTINCT FROM OLD."configurationId"
    OR NEW."configurationSnapshot" IS DISTINCT FROM OLD."configurationSnapshot"
    OR NEW."trigger" IS DISTINCT FROM OLD."trigger"
    OR NEW."scheduledFor" IS DISTINCT FROM OLD."scheduledFor"
    OR NEW."demandCutoffDate" IS DISTINCT FROM OLD."demandCutoffDate"
    OR NEW."stockCapturedAt" IS DISTINCT FROM OLD."stockCapturedAt"
    OR NEW."engineVersion" IS DISTINCT FROM OLD."engineVersion"
    OR NEW."fingerprint" IS DISTINCT FROM OLD."fingerprint"
    OR NEW."requestedByUserId" IS DISTINCT FROM OLD."requestedByUserId"
    OR NEW."startedAt" IS DISTINCT FROM OLD."startedAt"
    OR NEW."createdAt" IS DISTINCT FROM OLD."createdAt"
  THEN RAISE EXCEPTION 'frozen execution fields cannot change'; END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER "StockPlanningExecution_immutable" BEFORE UPDATE OR DELETE ON "StockPlanningExecution" FOR EACH ROW EXECUTE FUNCTION protect_completed_stock_planning_execution();
