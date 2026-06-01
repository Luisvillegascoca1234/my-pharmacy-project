import { z } from "zod";
import { PageQuerySchema, createPaginatedResponseSchema } from "./pagination.schema.js";
import {
  nonNegativeMoneyInputSchema,
  nonNegativeMoneySchema,
  optionalTextSchema,
  signedMoneySchema
} from "./shared-schema.helpers.js";

const noteOptionalText = optionalTextSchema.pipe(z.string().max(240).optional());
const pureDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const CashSessionStatusSchema = z.enum(["open", "closed"]);
export type CashSessionStatus = z.infer<typeof CashSessionStatusSchema>;

export const CashSessionUserSummarySchema = z.object({
  id: z.string(),
  fullName: z.string(),
  email: z.string().email()
});

export type CashSessionUserSummary = z.infer<typeof CashSessionUserSummarySchema>;

export const CashSessionSchema = z.object({
  id: z.string(),
  correlativeCode: z.string(),
  openedByUserId: z.string(),
  openedByUser: CashSessionUserSummarySchema,
  closedByUserId: z.string().optional(),
  closedByUser: CashSessionUserSummarySchema.optional(),
  initialAmount: nonNegativeMoneySchema,
  countedAmount: nonNegativeMoneySchema.optional(),
  expectedAmount: nonNegativeMoneySchema,
  differenceAmount: signedMoneySchema.optional(),
  status: CashSessionStatusSchema,
  openingNote: z.string().optional(),
  closingNote: z.string().optional(),
  openedAt: z.string(),
  closedAt: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string()
});

export type CashSession = z.infer<typeof CashSessionSchema>;

export const OpenCashSessionSchema = z.object({
  initialAmount: nonNegativeMoneyInputSchema,
  openingNote: noteOptionalText
});

export type OpenCashSession = z.infer<typeof OpenCashSessionSchema>;

export const CloseCashSessionSchema = z.object({
  countedAmount: nonNegativeMoneyInputSchema,
  closingNote: noteOptionalText
});

export type CloseCashSession = z.infer<typeof CloseCashSessionSchema>;

export const CurrentCashSessionSchema = z.object({
  isOpen: z.boolean(),
  cashSession: CashSessionSchema.nullable()
});

export type CurrentCashSession = z.infer<typeof CurrentCashSessionSchema>;

export const SupervisableCashSessionSchema = CashSessionSchema.extend({
  canClose: z.boolean().optional()
});

export type SupervisableCashSession = z.infer<typeof SupervisableCashSessionSchema>;

export const CashSessionsQuerySchema = PageQuerySchema.extend({
  fromDate: pureDate.optional(),
  openedByUserId: optionalTextSchema,
  status: CashSessionStatusSchema.optional(),
  toDate: pureDate.optional()
});

export type CashSessionsQuery = z.infer<typeof CashSessionsQuerySchema>;

export const CashSessionsListResponseSchema = createPaginatedResponseSchema(SupervisableCashSessionSchema);
export type CashSessionsListResponse = z.infer<typeof CashSessionsListResponseSchema>;
