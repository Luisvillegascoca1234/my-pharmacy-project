ALTER TABLE "Sale"
ADD COLUMN "idempotencyKey" VARCHAR(128);

CREATE UNIQUE INDEX "Sale_sellerUserId_idempotencyKey_key"
ON "Sale"("sellerUserId", "idempotencyKey");
