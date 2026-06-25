import type { CancelPreparedInvoice, PrepareInvoiceFromSale, PreparedInvoice, PreparedInvoiceStatusFilter } from "../types/billingTypes";

export type BillingActions = {
  cancelSelectedPreparedInvoice: (input?: CancelPreparedInvoice) => Promise<PreparedInvoice | null>;
  clearCancellation: () => void;
  clearPreparation: () => void;
  loadInvoiceableSales: (signal?: AbortSignal) => Promise<void>;
  loadPreparedInvoice: (preparedInvoiceId: string, signal?: AbortSignal) => Promise<PreparedInvoice | null>;
  loadPreparedInvoices: (signal?: AbortSignal) => Promise<void>;
  prepareInvoice: (input: PrepareInvoiceFromSale) => Promise<PreparedInvoice | null>;
  reset: () => void;
  selectPreparedInvoice: (preparedInvoiceId: string | null) => void;
  setCancelReason: (cancelReason: string) => void;
  setInvoiceableFromDate: (fromDate: string) => void;
  setInvoiceablePage: (page: number) => void;
  setInvoiceablePageSize: (pageSize: number) => void;
  setInvoiceableSearch: (search: string) => void;
  setInvoiceableSellerUserId: (sellerUserId: string) => void;
  setInvoiceableToDate: (toDate: string) => void;
  setPreparedInvoiceFromDate: (fromDate: string) => void;
  setPreparedInvoicePage: (page: number) => void;
  setPreparedInvoicePageSize: (pageSize: number) => void;
  setPreparedInvoiceSaleId: (saleId: string) => void;
  setPreparedInvoiceSearch: (search: string) => void;
  setPreparedInvoiceStatus: (status: PreparedInvoiceStatusFilter) => void;
  setPreparedInvoiceToDate: (toDate: string) => void;
};
