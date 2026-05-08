import type { Product, ProductCategory, ProductUnit, Unit } from "@prisma/client";

export type ProductWithRelations = Product & {
  category: ProductCategory;
  baseUnit: Unit;
  units: Array<ProductUnit & { unit: Unit }>;
};

export type AuditContext = {
  actorUserId?: string;
  ipAddress?: string;
  userAgent?: string;
};
