import { z } from "zod";

const pureDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const AlertTypeSchema = z.enum(["low_stock", "out_of_stock", "near_expiration", "expired"]);
export type AlertType = z.infer<typeof AlertTypeSchema>;

export const AlertSeveritySchema = z.enum(["info", "warning", "critical"]);
export type AlertSeverity = z.infer<typeof AlertSeveritySchema>;

export const AlertSchema = z.object({
  id: z.string(),
  type: AlertTypeSchema,
  severity: AlertSeveritySchema,
  productId: z.string(),
  productName: z.string(),
  internalCode: z.string(),
  batchNumber: z.string().optional(),
  expirationDate: pureDate.optional(),
  availableQuantity: z.number().min(0),
  minimumStock: z.number().min(0),
  baseUnitAbbreviation: z.string(),
  message: z.string()
});

export type Alert = z.infer<typeof AlertSchema>;

export const AlertsListResponseSchema = z.object({
  data: z.array(AlertSchema),
  generatedAt: z.string()
});

export type AlertsListResponse = z.infer<typeof AlertsListResponseSchema>;
