import type { CancelableSale, SalesStatusFilter } from "../types/salesTypes";

export type SalesActions = {
  cancelSelectedSale: (cancelReason?: string) => Promise<CancelableSale | null>;
  clearCancellation: () => void;
  loadSale: (saleId: string, signal?: AbortSignal) => Promise<CancelableSale | null>;
  loadSales: (signal?: AbortSignal) => Promise<void>;
  reset: () => void;
  selectSale: (saleId: string | null) => void;
  setCancelReason: (cancelReason: string) => void;
  setCashSessionId: (cashSessionId: string) => void;
  setFromDate: (fromDate: string) => void;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  setSearch: (search: string) => void;
  setSellerUserId: (sellerUserId: string) => void;
  setStatus: (status: SalesStatusFilter) => void;
  setToDate: (toDate: string) => void;
};
