import { z } from "zod";

export const optionalTextSchema = z
  .string()
  .trim()
  .optional()
  .nullable()
  .transform((value) => value || undefined);
