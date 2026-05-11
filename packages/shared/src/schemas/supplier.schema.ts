import { z } from "zod";
import { createPaginatedResponseSchema, PageQuerySchema } from "./pagination.schema.js";
import { optionalTextSchema } from "./shared-schema.helpers.js";

export const SupplierStatusSchema = z.enum(["active", "inactive"]);
export type SupplierStatus = z.infer<typeof SupplierStatusSchema>;

export const SupplierSchema = z.object({
  id: z.string(),
  businessName: z.string(),
  nit: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  contactName: z.string().optional(),
  status: SupplierStatusSchema,
  createdAt: z.string(),
  updatedAt: z.string()
});

export type Supplier = z.infer<typeof SupplierSchema>;

export const SupplierSummarySchema = SupplierSchema.pick({
  id: true,
  businessName: true,
  nit: true,
  status: true
});

export type SupplierSummary = z.infer<typeof SupplierSummarySchema>;

export const CreateSupplierSchema = z.object({
  businessName: z.string().trim().min(2).max(160),
  nit: optionalTextSchema.pipe(z.string().max(40).optional()),
  phone: optionalTextSchema.pipe(z.string().max(40).optional()),
  address: optionalTextSchema.pipe(z.string().max(240).optional()),
  contactName: optionalTextSchema.pipe(z.string().max(120).optional()),
  status: SupplierStatusSchema.default("active")
});

export type CreateSupplier = z.infer<typeof CreateSupplierSchema>;

export const UpdateSupplierSchema = CreateSupplierSchema.partial();
export type UpdateSupplier = z.infer<typeof UpdateSupplierSchema>;

export const UpdateSupplierStatusSchema = z.object({
  status: SupplierStatusSchema
});

export type UpdateSupplierStatus = z.infer<typeof UpdateSupplierStatusSchema>;

export const SuppliersQuerySchema = PageQuerySchema.extend({
  search: optionalTextSchema,
  status: SupplierStatusSchema.optional()
});

export type SuppliersQuery = z.infer<typeof SuppliersQuerySchema>;

export const SuppliersListResponseSchema = createPaginatedResponseSchema(SupplierSchema);
export type SuppliersListResponse = z.infer<typeof SuppliersListResponseSchema>;
