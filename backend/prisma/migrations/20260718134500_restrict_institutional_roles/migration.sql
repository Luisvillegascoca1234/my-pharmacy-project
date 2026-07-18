-- The migration is intentionally additive: previous migration history remains unchanged.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "Role"
    WHERE "name" NOT IN ('superadmin', 'admin', 'seller')
  ) THEN
    RAISE EXCEPTION 'Role contains names outside the institutional role policy';
  END IF;
END $$;

DROP TABLE "RolePermission";
DROP TABLE "Permission";

CREATE TYPE "RoleName" AS ENUM ('superadmin', 'admin', 'seller');

ALTER TABLE "Role"
ALTER COLUMN "name" TYPE "RoleName"
USING ("name"::"RoleName");
