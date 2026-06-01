import { z } from "zod";

export const hasMaxDecimalPlaces = (places: number) => (value: number) => {
  const [, decimals = ""] = value.toString().split(".");
  return decimals.length <= places;
};

export const nonNegativeMoneySchema = z.number().finite().min(0).refine(hasMaxDecimalPlaces(2), {
  message: "Must have at most 2 decimal places."
});

export const nonNegativeMoneyInputSchema = z.coerce.number().finite().min(0).refine(hasMaxDecimalPlaces(2), {
  message: "Must have at most 2 decimal places."
});

export const signedMoneySchema = z.number().finite().refine(hasMaxDecimalPlaces(2), {
  message: "Must have at most 2 decimal places."
});

export const optionalTextSchema = z
  .string()
  .trim()
  .optional()
  .nullable()
  .transform((value) => value || undefined);
