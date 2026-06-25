export type ReportsActions = {
  loadDailySalesReport: (signal?: AbortSignal) => Promise<void>;
  loadExpiringProductsReport: (signal?: AbortSignal) => Promise<void>;
  loadInventoryValuationReport: (signal?: AbortSignal) => Promise<void>;
  reset: () => void;
  setDailySalesFromDate: (fromDate: string) => void;
  setDailySalesToDate: (toDate: string) => void;
  setExpiringDays: (days: number) => void;
  setExpiringProductId: (productId: string) => void;
  setExpiringSearch: (search: string) => void;
  setInventoryValuationProductId: (productId: string) => void;
  setInventoryValuationSearch: (search: string) => void;
};
