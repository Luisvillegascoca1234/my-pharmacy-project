ALTER TABLE "PurchaseItem"
ALTER COLUMN "baseUnitCost" TYPE DECIMAL(12, 2)
USING ROUND("baseUnitCost", 2);

ALTER TABLE "InventoryBatch"
ALTER COLUMN "baseUnitCost" TYPE DECIMAL(12, 2)
USING ROUND("baseUnitCost", 2);

ALTER TABLE "InventoryMovement"
ALTER COLUMN "unitCostBase" TYPE DECIMAL(12, 2)
USING ROUND("unitCostBase", 2);

ALTER TABLE "SaleItemBatch"
ALTER COLUMN "unitCostBase" TYPE DECIMAL(12, 2)
USING ROUND("unitCostBase", 2);

ALTER TABLE "SaleReturnItem"
ALTER COLUMN "unitCostBase" TYPE DECIMAL(12, 2)
USING ROUND("unitCostBase", 2);
