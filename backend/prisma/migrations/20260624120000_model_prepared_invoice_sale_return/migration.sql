ALTER TYPE "InventoryMovementType" ADD VALUE 'sale_returned';
ALTER TYPE "SaleStatus" ADD VALUE 'returned';
ALTER TYPE "PaymentStatus" ADD VALUE 'refunded';

CREATE TYPE "PreparedInvoiceStatus" AS ENUM ('prepared', 'cancelled');

CREATE TABLE "PreparedInvoice" (
    "id" TEXT NOT NULL,
    "correlativeNumber" INTEGER NOT NULL,
    "correlativeCode" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "sellerUserId" TEXT NOT NULL,
    "status" "PreparedInvoiceStatus" NOT NULL DEFAULT 'prepared',
    "saleCorrelativeCode" TEXT NOT NULL,
    "cashSessionId" TEXT NOT NULL,
    "cashSessionCode" TEXT NOT NULL,
    "sellerName" TEXT NOT NULL,
    "sellerEmail" TEXT NOT NULL,
    "customerNit" TEXT NOT NULL DEFAULT '0',
    "customerBusinessName" TEXT NOT NULL DEFAULT 'Consumidor final',
    "fiscalNotes" TEXT,
    "totalAmount" DECIMAL(12,2) NOT NULL,
    "preparedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cancelledAt" TIMESTAMP(3),
    "cancelledByUserId" TEXT,
    "cancelReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PreparedInvoice_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PreparedInvoiceItem" (
    "id" TEXT NOT NULL,
    "preparedInvoiceId" TEXT NOT NULL,
    "saleItemId" TEXT NOT NULL,
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PreparedInvoiceItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SaleReturn" (
    "id" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "refundAmount" DECIMAL(12,2) NOT NULL,
    "returnedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SaleReturn_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SaleReturnItem" (
    "id" TEXT NOT NULL,
    "saleReturnId" TEXT NOT NULL,
    "saleItemId" TEXT NOT NULL,
    "saleItemBatchId" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "inventoryMovementId" TEXT,
    "quantity" DECIMAL(12,4) NOT NULL,
    "unitCostBase" DECIMAL(12,4) NOT NULL,
    "refundUnitPrice" DECIMAL(12,2) NOT NULL,
    "refundSubtotal" DECIMAL(12,2) NOT NULL,
    "batchNumber" TEXT,
    "expirationDate" DATE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SaleReturnItem_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PreparedInvoice_correlativeNumber_key" ON "PreparedInvoice"("correlativeNumber");
CREATE UNIQUE INDEX "PreparedInvoice_correlativeCode_key" ON "PreparedInvoice"("correlativeCode");
CREATE UNIQUE INDEX "PreparedInvoice_saleId_prepared_key" ON "PreparedInvoice"("saleId") WHERE "status" = 'prepared';
CREATE INDEX "PreparedInvoice_saleId_idx" ON "PreparedInvoice"("saleId");
CREATE INDEX "PreparedInvoice_sellerUserId_idx" ON "PreparedInvoice"("sellerUserId");
CREATE INDEX "PreparedInvoice_status_idx" ON "PreparedInvoice"("status");
CREATE INDEX "PreparedInvoice_preparedAt_idx" ON "PreparedInvoice"("preparedAt");
CREATE INDEX "PreparedInvoice_cancelledByUserId_idx" ON "PreparedInvoice"("cancelledByUserId");
CREATE INDEX "PreparedInvoice_saleId_status_idx" ON "PreparedInvoice"("saleId", "status");
CREATE INDEX "PreparedInvoice_status_preparedAt_idx" ON "PreparedInvoice"("status", "preparedAt");

CREATE INDEX "PreparedInvoiceItem_preparedInvoiceId_idx" ON "PreparedInvoiceItem"("preparedInvoiceId");
CREATE INDEX "PreparedInvoiceItem_saleItemId_idx" ON "PreparedInvoiceItem"("saleItemId");
CREATE INDEX "PreparedInvoiceItem_productId_idx" ON "PreparedInvoiceItem"("productId");

CREATE UNIQUE INDEX "SaleReturn_saleId_key" ON "SaleReturn"("saleId");
CREATE UNIQUE INDEX "SaleReturn_paymentId_key" ON "SaleReturn"("paymentId");
CREATE INDEX "SaleReturn_actorUserId_idx" ON "SaleReturn"("actorUserId");
CREATE INDEX "SaleReturn_returnedAt_idx" ON "SaleReturn"("returnedAt");
CREATE INDEX "SaleReturn_saleId_returnedAt_idx" ON "SaleReturn"("saleId", "returnedAt");
CREATE INDEX "SaleReturn_actorUserId_returnedAt_idx" ON "SaleReturn"("actorUserId", "returnedAt");

CREATE UNIQUE INDEX "SaleReturnItem_inventoryMovementId_key" ON "SaleReturnItem"("inventoryMovementId");
CREATE UNIQUE INDEX "SaleReturnItem_saleReturnId_saleItemBatchId_key" ON "SaleReturnItem"("saleReturnId", "saleItemBatchId");
CREATE INDEX "SaleReturnItem_saleReturnId_idx" ON "SaleReturnItem"("saleReturnId");
CREATE INDEX "SaleReturnItem_saleItemId_idx" ON "SaleReturnItem"("saleItemId");
CREATE INDEX "SaleReturnItem_saleItemBatchId_idx" ON "SaleReturnItem"("saleItemBatchId");
CREATE INDEX "SaleReturnItem_batchId_idx" ON "SaleReturnItem"("batchId");
CREATE INDEX "SaleReturnItem_productId_idx" ON "SaleReturnItem"("productId");

ALTER TABLE "PreparedInvoice" ADD CONSTRAINT "PreparedInvoice_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PreparedInvoice" ADD CONSTRAINT "PreparedInvoice_sellerUserId_fkey" FOREIGN KEY ("sellerUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PreparedInvoice" ADD CONSTRAINT "PreparedInvoice_cancelledByUserId_fkey" FOREIGN KEY ("cancelledByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "PreparedInvoiceItem" ADD CONSTRAINT "PreparedInvoiceItem_preparedInvoiceId_fkey" FOREIGN KEY ("preparedInvoiceId") REFERENCES "PreparedInvoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PreparedInvoiceItem" ADD CONSTRAINT "PreparedInvoiceItem_saleItemId_fkey" FOREIGN KEY ("saleItemId") REFERENCES "SaleItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PreparedInvoiceItem" ADD CONSTRAINT "PreparedInvoiceItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "SaleReturn" ADD CONSTRAINT "SaleReturn_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SaleReturn" ADD CONSTRAINT "SaleReturn_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SaleReturn" ADD CONSTRAINT "SaleReturn_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "SaleReturnItem" ADD CONSTRAINT "SaleReturnItem_saleReturnId_fkey" FOREIGN KEY ("saleReturnId") REFERENCES "SaleReturn"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SaleReturnItem" ADD CONSTRAINT "SaleReturnItem_saleItemId_fkey" FOREIGN KEY ("saleItemId") REFERENCES "SaleItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SaleReturnItem" ADD CONSTRAINT "SaleReturnItem_saleItemBatchId_fkey" FOREIGN KEY ("saleItemBatchId") REFERENCES "SaleItemBatch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SaleReturnItem" ADD CONSTRAINT "SaleReturnItem_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "InventoryBatch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SaleReturnItem" ADD CONSTRAINT "SaleReturnItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SaleReturnItem" ADD CONSTRAINT "SaleReturnItem_inventoryMovementId_fkey" FOREIGN KEY ("inventoryMovementId") REFERENCES "InventoryMovement"("id") ON DELETE SET NULL ON UPDATE CASCADE;
