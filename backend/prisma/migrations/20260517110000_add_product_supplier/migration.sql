ALTER TABLE "Product" ADD COLUMN "supplierId" TEXT;

DO $$
DECLARE
  fallback_supplier_id TEXT;
  product_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO product_count FROM "Product";

  IF product_count > 0 THEN
    SELECT "id" INTO fallback_supplier_id FROM "Supplier" ORDER BY "createdAt" ASC LIMIT 1;

    IF fallback_supplier_id IS NULL THEN
      RAISE EXCEPTION 'Cannot add required Product.supplierId because products exist but no suppliers are registered.';
    END IF;

    UPDATE "Product" SET "supplierId" = fallback_supplier_id WHERE "supplierId" IS NULL;
  END IF;
END $$;

ALTER TABLE "Product" ALTER COLUMN "supplierId" SET NOT NULL;

CREATE INDEX "Product_supplierId_idx" ON "Product"("supplierId");

ALTER TABLE "Product" ADD CONSTRAINT "Product_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
