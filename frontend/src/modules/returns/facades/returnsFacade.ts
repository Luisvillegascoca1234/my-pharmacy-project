import { returnsApi } from "../api/returns-api";
import type {
  CreateTotalSaleReturn,
  ReturnableSalesListResponse,
  ReturnableSalesQuery,
  SaleReturn,
  SaleReturnsListResponse,
  SaleReturnsQuery
} from "../types/returnsTypes";
import {
  buildCreateTotalSaleReturnPayload,
  buildReturnableSalesQuery,
  buildSaleReturnsQuery
} from "../utils/returnsPayloads";

export const returnsFacade = {
  listReturnableSales(query: ReturnableSalesQuery, signal?: AbortSignal): Promise<ReturnableSalesListResponse> {
    return returnsApi.listReturnableSales(buildReturnableSalesQuery(query), signal);
  },

  listSaleReturns(query: SaleReturnsQuery, signal?: AbortSignal): Promise<SaleReturnsListResponse> {
    return returnsApi.listSaleReturns(buildSaleReturnsQuery(query), signal);
  },

  createTotalSaleReturn(input: CreateTotalSaleReturn): Promise<SaleReturn> {
    return returnsApi.createTotalSaleReturn(buildCreateTotalSaleReturnPayload(input));
  },

  getSaleReturnById(saleReturnId: string, signal?: AbortSignal): Promise<SaleReturn> {
    return returnsApi.getSaleReturnById(saleReturnId, signal);
  }
};
