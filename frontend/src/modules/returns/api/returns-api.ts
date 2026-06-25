import { axiosApi } from "@/api";
import type {
  CreateTotalSaleReturn,
  ReturnableSalesListResponse,
  ReturnableSalesQuery,
  SaleReturn,
  SaleReturnsListResponse,
  SaleReturnsQuery
} from "../types/returnsTypes";

export const returnsApi = {
  async listReturnableSales(query: ReturnableSalesQuery, signal?: AbortSignal): Promise<ReturnableSalesListResponse> {
    const response = await axiosApi.get<ReturnableSalesListResponse>("/returns/returnable-sales", {
      params: query,
      signal
    });

    return response.data;
  },

  async listSaleReturns(query: SaleReturnsQuery, signal?: AbortSignal): Promise<SaleReturnsListResponse> {
    const response = await axiosApi.get<SaleReturnsListResponse>("/returns/sale-returns", {
      params: query,
      signal
    });

    return response.data;
  },

  async createTotalSaleReturn(input: CreateTotalSaleReturn): Promise<SaleReturn> {
    const response = await axiosApi.post<SaleReturn>("/returns/sale-returns", input);

    return response.data;
  },

  async getSaleReturnById(saleReturnId: string, signal?: AbortSignal): Promise<SaleReturn> {
    const response = await axiosApi.get<SaleReturn>(`/returns/sale-returns/${saleReturnId}`, { signal });

    return response.data;
  }
};
