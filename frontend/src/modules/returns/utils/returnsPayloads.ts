import {
  CreateTotalSaleReturnSchema,
  ReturnableSalesQuerySchema,
  SaleReturnsQuerySchema
} from "@pharmacy-pos/shared";
import type { CreateTotalSaleReturn, ReturnableSalesQuery, SaleReturnsQuery } from "../types/returnsTypes";

export function buildReturnableSalesQuery(query: ReturnableSalesQuery): ReturnableSalesQuery {
  return ReturnableSalesQuerySchema.parse(query);
}

export function buildSaleReturnsQuery(query: SaleReturnsQuery): SaleReturnsQuery {
  return SaleReturnsQuerySchema.parse(query);
}

export function buildCreateTotalSaleReturnPayload(input: CreateTotalSaleReturn): CreateTotalSaleReturn {
  return CreateTotalSaleReturnSchema.parse(input);
}
