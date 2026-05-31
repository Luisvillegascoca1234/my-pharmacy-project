ALTER TYPE "InventoryMovementType" ADD VALUE 'inventory_adjustment';

CREATE TABLE "InventoryAdjustment" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "previousQuantity" DECIMAL(12,4) NOT NULL,
    "countedQuantity" DECIMAL(12,4) NOT NULL,
    "differenceQuantity" DECIMAL(12,4) NOT NULL,
    "reason" TEXT NOT NULL,
    "actorUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryAdjustment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "InventoryAdjustment_batchId_idx" ON "InventoryAdjustment"("batchId");
CREATE INDEX "InventoryAdjustment_productId_idx" ON "InventoryAdjustment"("productId");
CREATE INDEX "InventoryAdjustment_actorUserId_idx" ON "InventoryAdjustment"("actorUserId");
CREATE INDEX "InventoryAdjustment_createdAt_idx" ON "InventoryAdjustment"("createdAt");

ALTER TABLE "InventoryAdjustment" ADD CONSTRAINT "InventoryAdjustment_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "InventoryBatch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InventoryAdjustment" ADD CONSTRAINT "InventoryAdjustment_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "InventoryAdjustment" ADD CONSTRAINT "InventoryAdjustment_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
