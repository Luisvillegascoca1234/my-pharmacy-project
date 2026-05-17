import { z } from "zod";
import { SupplierSummarySchema } from "./supplier.schema.js";

export const ProductStatusSchema = z.enum(["active", "inactive"]);
export type ProductStatus = z.infer<typeof ProductStatusSchema>;

export const ProductTypeSchema = z.enum(["medicine", "otc", "medical_supply", "hygiene_disinfection", "related_misc"]);
export type ProductType = z.infer<typeof ProductTypeSchema>;

const optionalText = z.string().trim().optional().nullable().transform((value) => value || undefined);
const optionalInternalCode = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().trim().min(2).max(40).optional()
);
const money = z.coerce.number().min(0);
const quantity = z.coerce.number().min(0);

export const ProductCategorySchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  status: ProductStatusSchema,
  createdAt: z.string(),
  updatedAt: z.string()
});

export type ProductCategory = z.infer<typeof ProductCategorySchema>;

export const CreateProductCategorySchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: optionalText
});

export type CreateProductCategory = z.infer<typeof CreateProductCategorySchema>;

export const UnitSchema = z.object({
  id: z.string(),
  name: z.string(),
  abbreviation: z.string(),
  description: z.string().optional(),
  status: ProductStatusSchema,
  createdAt: z.string(),
  updatedAt: z.string()
});

export type Unit = z.infer<typeof UnitSchema>;

export const CreateUnitSchema = z.object({
  name: z.string().trim().min(2).max(80),
  abbreviation: z.string().trim().min(1).max(16),
  description: optionalText
});

export type CreateUnit = z.infer<typeof CreateUnitSchema>;

export const ProductUnitSchema = z.object({
  id: z.string(),
  productId: z.string(),
  unitId: z.string(),
  unit: UnitSchema,
  conversionFactor: z.number().positive(),
  createdAt: z.string(),
  updatedAt: z.string()
});

export type ProductUnit = z.infer<typeof ProductUnitSchema>;

export const ProductSchema = z.object({
  id: z.string(),
  internalCode: z.string(),
  barcode: z.string().optional(),
  commercialName: z.string(),
  genericName: z.string().optional(),
  description: z.string().optional(),
  type: ProductTypeSchema,
  categoryId: z.string(),
  category: ProductCategorySchema,
  baseUnitId: z.string(),
  baseUnit: UnitSchema,
  supplierId: z.string(),
  supplier: SupplierSummarySchema,
  laboratoryName: z.string().optional(),
  sanitaryRegistration: z.string().optional(),
  isMedicine: z.boolean(),
  isOverTheCounter: z.boolean(),
  requiresPrescription: z.boolean(),
  isInventoryTracked: z.boolean(),
  requiresBatch: z.boolean(),
  requiresExpiration: z.boolean(),
  minimumStock: z.number().min(0),
  salePrice: z.number().min(0),
  status: ProductStatusSchema,
  units: z.array(ProductUnitSchema),
  createdAt: z.string(),
  updatedAt: z.string()
});

export type Product = z.infer<typeof ProductSchema>;

export const CreateProductSchema = z.object({
  internalCode: optionalInternalCode,
  barcode: optionalText,
  commercialName: z.string().trim().min(2).max(160),
  genericName: optionalText,
  description: optionalText,
  type: ProductTypeSchema,
  categoryId: z.string().min(1),
  baseUnitId: z.string().min(1),
  supplierId: z.string().min(1),
  laboratoryName: optionalText,
  sanitaryRegistration: optionalText,
  isMedicine: z.boolean().default(false),
  isOverTheCounter: z.boolean().default(false),
  requiresPrescription: z.boolean().default(false),
  isInventoryTracked: z.boolean().default(true),
  requiresBatch: z.boolean().default(true),
  requiresExpiration: z.boolean().default(true),
  minimumStock: quantity.default(0),
  salePrice: money
});

export type CreateProduct = z.infer<typeof CreateProductSchema>;

export const UpdateProductSchema = CreateProductSchema.partial().extend({
  status: ProductStatusSchema.optional()
});

export type UpdateProduct = z.infer<typeof UpdateProductSchema>;

export const UpsertProductUnitSchema = z.object({
  unitId: z.string().min(1),
  conversionFactor: z.coerce.number().positive()
});

export type UpsertProductUnit = z.infer<typeof UpsertProductUnitSchema>;

export const UpdateProductUnitsSchema = z.object({
  units: z.array(UpsertProductUnitSchema).min(1)
});

export type UpdateProductUnits = z.infer<typeof UpdateProductUnitsSchema>;
