CREATE TYPE "ForecastMaturity" AS ENUM ('no_history', 'low_confidence', 'operational', 'no_observed_demand');
CREATE TYPE "ForecastConfidence" AS ENUM ('none', 'low', 'medium', 'high');
CREATE TYPE "ForecastModel" AS ENUM ('recent_naive', 'seasonal_naive_weekly', 'moving_average', 'simple_exponential_smoothing', 'holt', 'croston_sba', 'tsb');

CREATE TABLE "StockPlanningForecast" (
    "id" TEXT NOT NULL,
    "executionId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "maturity" "ForecastMaturity" NOT NULL,
    "confidence" "ForecastConfidence" NOT NULL,
    "model" "ForecastModel",
    "historyStartDate" DATE NOT NULL,
    "historyEndDate" DATE NOT NULL,
    "historyDays" INTEGER NOT NULL,
    "demandDays" INTEGER NOT NULL,
    "censoredDays" INTEGER NOT NULL,
    "forecastDays" INTEGER NOT NULL,
    "parameters" JSONB NOT NULL,
    "metrics" JSONB NOT NULL,
    "bias" DECIMAL(18,6) NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "engineVersion" TEXT NOT NULL,
    "rulesVersion" TEXT NOT NULL,
    "warnings" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StockPlanningForecast_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StockPlanningDemandPoint" (
    "id" TEXT NOT NULL,
    "forecastId" TEXT NOT NULL,
    "localDate" DATE NOT NULL,
    "grossDemand" DECIMAL(18,4) NOT NULL,
    "returnedQuantity" DECIMAL(18,4) NOT NULL,
    "netDemand" DECIMAL(18,4) NOT NULL,
    "censored" BOOLEAN NOT NULL,
    CONSTRAINT "StockPlanningDemandPoint_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "StockPlanningForecastPoint" (
    "id" TEXT NOT NULL,
    "forecastId" TEXT NOT NULL,
    "localDate" DATE NOT NULL,
    "central" DECIMAL(18,4) NOT NULL,
    "lower80" DECIMAL(18,4) NOT NULL,
    "upper80" DECIMAL(18,4) NOT NULL,
    CONSTRAINT "StockPlanningForecastPoint_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "StockPlanningForecast_executionId_productId_key" ON "StockPlanningForecast"("executionId", "productId");
CREATE INDEX "StockPlanningForecast_productId_createdAt_idx" ON "StockPlanningForecast"("productId", "createdAt");
CREATE INDEX "StockPlanningForecast_executionId_maturity_idx" ON "StockPlanningForecast"("executionId", "maturity");
CREATE UNIQUE INDEX "StockPlanningDemandPoint_forecastId_localDate_key" ON "StockPlanningDemandPoint"("forecastId", "localDate");
CREATE INDEX "StockPlanningDemandPoint_localDate_idx" ON "StockPlanningDemandPoint"("localDate");
CREATE UNIQUE INDEX "StockPlanningForecastPoint_forecastId_localDate_key" ON "StockPlanningForecastPoint"("forecastId", "localDate");
CREATE INDEX "StockPlanningForecastPoint_localDate_idx" ON "StockPlanningForecastPoint"("localDate");

ALTER TABLE "StockPlanningForecast" ADD CONSTRAINT "StockPlanningForecast_executionId_fkey" FOREIGN KEY ("executionId") REFERENCES "StockPlanningExecution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StockPlanningForecast" ADD CONSTRAINT "StockPlanningForecast_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StockPlanningDemandPoint" ADD CONSTRAINT "StockPlanningDemandPoint_forecastId_fkey" FOREIGN KEY ("forecastId") REFERENCES "StockPlanningForecast"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StockPlanningForecastPoint" ADD CONSTRAINT "StockPlanningForecastPoint_forecastId_fkey" FOREIGN KEY ("forecastId") REFERENCES "StockPlanningForecast"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "StockPlanningForecast" ADD CONSTRAINT "StockPlanningForecast_history_check"
  CHECK ("historyDays" > 0 AND "demandDays" >= 0 AND "censoredDays" >= 0 AND "forecastDays" > 0);
ALTER TABLE "StockPlanningDemandPoint" ADD CONSTRAINT "StockPlanningDemandPoint_nonnegative_check"
  CHECK ("grossDemand" >= 0 AND "returnedQuantity" >= 0 AND "netDemand" >= 0);
ALTER TABLE "StockPlanningForecastPoint" ADD CONSTRAINT "StockPlanningForecastPoint_interval_check"
  CHECK ("central" >= 0 AND "lower80" >= 0 AND "upper80" >= "lower80");

CREATE TRIGGER "StockPlanningForecast_immutable"
  BEFORE UPDATE OR DELETE ON "StockPlanningForecast"
  FOR EACH ROW EXECUTE FUNCTION prevent_stock_planning_immutable_change();
CREATE TRIGGER "StockPlanningDemandPoint_immutable"
  BEFORE UPDATE OR DELETE ON "StockPlanningDemandPoint"
  FOR EACH ROW EXECUTE FUNCTION prevent_stock_planning_immutable_change();
CREATE TRIGGER "StockPlanningForecastPoint_immutable"
  BEFORE UPDATE OR DELETE ON "StockPlanningForecastPoint"
  FOR EACH ROW EXECUTE FUNCTION prevent_stock_planning_immutable_change();
