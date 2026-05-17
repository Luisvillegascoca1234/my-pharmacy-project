import type { Product, ProductCategory, ProductUnit, Supplier, Unit } from "@prisma/client";

export type ProductWithRelations = Product & {
  category: ProductCategory;
  baseUnit: Unit;
  supplier: Supplier;
  units: Array<ProductUnit & { unit: Unit }>;
};

export type AuditContext = {
  actorUserId?: string;
  ipAddress?: string;
  userAgent?: string;
};
