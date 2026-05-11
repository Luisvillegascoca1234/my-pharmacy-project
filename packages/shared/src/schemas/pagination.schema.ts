import { z } from "zod";

export const PageQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20)
});

export type PageQuery = z.infer<typeof PageQuerySchema>;

export const PaginationMetaSchema = z.object({
  page: z.number().int().min(1),
  pageSize: z.number().int().min(1).max(100),
  total: z.number().int().min(0),
  totalPages: z.number().int().min(0)
});

export type PaginationMeta = z.infer<typeof PaginationMetaSchema>;

export const createPaginatedResponseSchema = <ItemSchema extends z.ZodTypeAny>(itemSchema: ItemSchema) =>
  z.object({
    data: z.array(itemSchema),
    pagination: PaginationMetaSchema
  });

export type PaginatedResponse<Item> = {
  data: Item[];
  pagination: PaginationMeta;
};
