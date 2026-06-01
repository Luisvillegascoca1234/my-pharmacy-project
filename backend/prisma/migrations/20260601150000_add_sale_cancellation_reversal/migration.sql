ALTER TYPE "InventoryMovementType" ADD VALUE 'sale_cancelled';
ALTER TYPE "SaleStatus" ADD VALUE 'cancelled';
ALTER TYPE "PaymentStatus" ADD VALUE 'reverted';
ALTER TYPE "PaymentStatus" ADD VALUE 'cancelled';

ALTER TABLE "Sale" ADD COLUMN "cancelledByUserId" TEXT;
ALTER TABLE "Sale" ADD COLUMN "cancelledAt" TIMESTAMP(3);
ALTER TABLE "Sale" ADD COLUMN "cancelReason" TEXT;

ALTER TABLE "Payment" ADD COLUMN "reversedAt" TIMESTAMP(3);

CREATE INDEX "Sale_cancelledByUserId_idx" ON "Sale"("cancelledByUserId");

ALTER TABLE "Sale" ADD CONSTRAINT "Sale_cancelledByUserId_fkey" FOREIGN KEY ("cancelledByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
