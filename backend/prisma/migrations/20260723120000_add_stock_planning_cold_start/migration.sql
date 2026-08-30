CREATE TYPE "StockCriticality" AS ENUM ('normal', 'high', 'critical');

ALTER TYPE "InventoryBatchStatus" ADD VALUE 'blocked';

ALTER TABLE "Product"
ADD COLUMN "stockCriticality" "StockCriticality" NOT NULL DEFAULT 'normal',
ADD COLUMN "stockCoverageDays" INTEGER,
ADD COLUMN "preferredRestockUnitId" TEXT;

ALTER TABLE "Product"
ADD CONSTRAINT "Product_preferredRestockUnitId_fkey"
FOREIGN KEY ("preferredRestockUnitId") REFERENCES "ProductUnit"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "Product_stockCriticality_idx" ON "Product"("stockCriticality");
CREATE INDEX "Product_preferredRestockUnitId_idx" ON "Product"("preferredRestockUnitId");

ALTER TABLE "Product"
ADD CONSTRAINT "Product_stockCoverageDays_check"
CHECK ("stockCoverageDays" IS NULL OR ("stockCoverageDays" >= 1 AND "stockCoverageDays" <= 365));
