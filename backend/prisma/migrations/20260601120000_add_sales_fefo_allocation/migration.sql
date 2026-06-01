ALTER TYPE "InventoryMovementType" ADD VALUE 'sale_completed';

ALTER TABLE "InventoryMovement" DROP CONSTRAINT IF EXISTS "InventoryMovement_referenceItemId_fkey";

CREATE TYPE "SaleStatus" AS ENUM ('confirmed');
CREATE TYPE "PaymentMethod" AS ENUM ('cash');
CREATE TYPE "PaymentStatus" AS ENUM ('paid');

CREATE TABLE "Sale" (
    "id" TEXT NOT NULL,
    "correlativeNumber" INTEGER NOT NULL,
    "correlativeCode" TEXT NOT NULL,
    "sellerUserId" TEXT NOT NULL,
    "cashSessionId" TEXT NOT NULL,
    "status" "SaleStatus" NOT NULL DEFAULT 'confirmed',
    "totalAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "totalCost" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "totalMargin" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "confirmedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sale_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SaleItem" (
    "id" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "internalCode" TEXT NOT NULL,
    "barcode" TEXT,
    "commercialName" TEXT NOT NULL,
    "genericName" TEXT,
    "baseUnitId" TEXT NOT NULL,
    "baseUnitName" TEXT NOT NULL,
    "baseUnitAbbreviation" TEXT NOT NULL,
    "unitPrice" DECIMAL(12,2) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "subtotal" DECIMAL(12,2) NOT NULL,
    "totalCost" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "margin" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SaleItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SaleItemBatch" (
    "id" TEXT NOT NULL,
    "saleItemId" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "quantity" DECIMAL(12,4) NOT NULL,
    "unitCostBase" DECIMAL(12,4) NOT NULL,
    "totalCost" DECIMAL(12,2) NOT NULL,
    "inventoryMovementId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SaleItemBatch_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "cashSessionId" TEXT NOT NULL,
    "method" "PaymentMethod" NOT NULL DEFAULT 'cash',
    "saleTotal" DECIMAL(12,2) NOT NULL,
    "receivedAmount" DECIMAL(12,2) NOT NULL,
    "changeAmount" DECIMAL(12,2) NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'paid',
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Sale_correlativeNumber_key" ON "Sale"("correlativeNumber");
CREATE UNIQUE INDEX "Sale_correlativeCode_key" ON "Sale"("correlativeCode");
CREATE INDEX "Sale_sellerUserId_idx" ON "Sale"("sellerUserId");
CREATE INDEX "Sale_cashSessionId_idx" ON "Sale"("cashSessionId");
CREATE INDEX "Sale_status_idx" ON "Sale"("status");
CREATE INDEX "Sale_confirmedAt_idx" ON "Sale"("confirmedAt");
CREATE INDEX "Sale_sellerUserId_confirmedAt_idx" ON "Sale"("sellerUserId", "confirmedAt");
CREATE INDEX "Sale_cashSessionId_confirmedAt_idx" ON "Sale"("cashSessionId", "confirmedAt");

CREATE INDEX "SaleItem_saleId_idx" ON "SaleItem"("saleId");
CREATE INDEX "SaleItem_productId_idx" ON "SaleItem"("productId");
CREATE INDEX "SaleItem_saleId_productId_idx" ON "SaleItem"("saleId", "productId");

CREATE UNIQUE INDEX "SaleItemBatch_inventoryMovementId_key" ON "SaleItemBatch"("inventoryMovementId");
CREATE INDEX "SaleItemBatch_saleItemId_idx" ON "SaleItemBatch"("saleItemId");
CREATE INDEX "SaleItemBatch_batchId_idx" ON "SaleItemBatch"("batchId");
CREATE INDEX "SaleItemBatch_saleItemId_batchId_idx" ON "SaleItemBatch"("saleItemId", "batchId");

CREATE UNIQUE INDEX "Payment_saleId_key" ON "Payment"("saleId");
CREATE INDEX "Payment_cashSessionId_idx" ON "Payment"("cashSessionId");
CREATE INDEX "Payment_status_idx" ON "Payment"("status");
CREATE INDEX "Payment_paidAt_idx" ON "Payment"("paidAt");
CREATE INDEX "Payment_cashSessionId_paidAt_idx" ON "Payment"("cashSessionId", "paidAt");

ALTER TABLE "Sale" ADD CONSTRAINT "Sale_sellerUserId_fkey" FOREIGN KEY ("sellerUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_cashSessionId_fkey" FOREIGN KEY ("cashSessionId") REFERENCES "CashSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SaleItem" ADD CONSTRAINT "SaleItem_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SaleItem" ADD CONSTRAINT "SaleItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SaleItemBatch" ADD CONSTRAINT "SaleItemBatch_saleItemId_fkey" FOREIGN KEY ("saleItemId") REFERENCES "SaleItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SaleItemBatch" ADD CONSTRAINT "SaleItemBatch_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "InventoryBatch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SaleItemBatch" ADD CONSTRAINT "SaleItemBatch_inventoryMovementId_fkey" FOREIGN KEY ("inventoryMovementId") REFERENCES "InventoryMovement"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_cashSessionId_fkey" FOREIGN KEY ("cashSessionId") REFERENCES "CashSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
