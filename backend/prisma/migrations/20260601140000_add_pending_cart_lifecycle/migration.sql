CREATE TYPE "PendingCartStatus" AS ENUM ('active', 'converted', 'discarded', 'expired');

CREATE TABLE "PendingCart" (
    "id" TEXT NOT NULL,
    "ownerUserId" TEXT NOT NULL,
    "status" "PendingCartStatus" NOT NULL DEFAULT 'active',
    "name" TEXT,
    "note" TEXT,
    "referenceTotalAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "expiredAt" TIMESTAMP(3),
    "discardedAt" TIMESTAMP(3),
    "discardReason" TEXT,
    "convertedAt" TIMESTAMP(3),
    "convertedSaleId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PendingCart_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PendingCartItem" (
    "id" TEXT NOT NULL,
    "pendingCartId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "internalCode" TEXT NOT NULL,
    "barcode" TEXT,
    "commercialName" TEXT NOT NULL,
    "genericName" TEXT,
    "baseUnitId" TEXT NOT NULL,
    "baseUnitName" TEXT NOT NULL,
    "baseUnitAbbreviation" TEXT NOT NULL,
    "referenceUnitPrice" DECIMAL(12,2) NOT NULL,
    "quantity" INTEGER NOT NULL,
    "referenceSubtotal" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PendingCartItem_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PendingCart_convertedSaleId_key" ON "PendingCart"("convertedSaleId");
CREATE INDEX "PendingCart_ownerUserId_idx" ON "PendingCart"("ownerUserId");
CREATE INDEX "PendingCart_status_idx" ON "PendingCart"("status");
CREATE INDEX "PendingCart_expiresAt_idx" ON "PendingCart"("expiresAt");
CREATE INDEX "PendingCart_ownerUserId_status_idx" ON "PendingCart"("ownerUserId", "status");
CREATE INDEX "PendingCart_ownerUserId_expiresAt_idx" ON "PendingCart"("ownerUserId", "expiresAt");
CREATE INDEX "PendingCartItem_pendingCartId_idx" ON "PendingCartItem"("pendingCartId");
CREATE INDEX "PendingCartItem_productId_idx" ON "PendingCartItem"("productId");
CREATE UNIQUE INDEX "PendingCartItem_pendingCartId_productId_key" ON "PendingCartItem"("pendingCartId", "productId");

ALTER TABLE "PendingCart" ADD CONSTRAINT "PendingCart_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PendingCart" ADD CONSTRAINT "PendingCart_convertedSaleId_fkey" FOREIGN KEY ("convertedSaleId") REFERENCES "Sale"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PendingCartItem" ADD CONSTRAINT "PendingCartItem_pendingCartId_fkey" FOREIGN KEY ("pendingCartId") REFERENCES "PendingCart"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PendingCartItem" ADD CONSTRAINT "PendingCartItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
