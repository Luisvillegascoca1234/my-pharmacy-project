import type { CreateTotalSaleReturn, SaleReturn } from "../types/returnsTypes";

export type ReturnsActions = {
  clearCreation: () => void;
  createTotalSaleReturn: (input: CreateTotalSaleReturn) => Promise<SaleReturn | null>;
  loadReturnableSales: (signal?: AbortSignal) => Promise<void>;
  loadSaleReturn: (saleReturnId: string, signal?: AbortSignal) => Promise<SaleReturn | null>;
  loadSaleReturns: (signal?: AbortSignal) => Promise<void>;
  reset: () => void;
  selectSaleReturn: (saleReturnId: string | null) => void;
  setCreateReason: (reason: string) => void;
  setReturnableFromDate: (fromDate: string) => void;
  setReturnablePage: (page: number) => void;
  setReturnablePageSize: (pageSize: number) => void;
  setReturnableSearch: (search: string) => void;
  setReturnableSellerUserId: (sellerUserId: string) => void;
  setReturnableToDate: (toDate: string) => void;
  setSaleReturnActorUserId: (actorUserId: string) => void;
  setSaleReturnFromDate: (fromDate: string) => void;
  setSaleReturnPage: (page: number) => void;
  setSaleReturnPageSize: (pageSize: number) => void;
  setSaleReturnSaleId: (saleId: string) => void;
  setSaleReturnSearch: (search: string) => void;
  setSaleReturnToDate: (toDate: string) => void;
};
