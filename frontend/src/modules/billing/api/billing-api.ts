import { axiosApi } from "@/api";
import type {
  CancelPreparedInvoice,
  InvoiceableSalesListResponse,
  InvoiceableSalesQuery,
  PrepareInvoiceFromSale,
  PreparedInvoice,
  PreparedInvoicesListResponse,
  PreparedInvoicesQuery
} from "../types/billingTypes";

export const billingApi = {
  async listInvoiceableSales(query: InvoiceableSalesQuery, signal?: AbortSignal): Promise<InvoiceableSalesListResponse> {
    const response = await axiosApi.get<InvoiceableSalesListResponse>("/billing/invoiceable-sales", {
      params: query,
      signal
    });

    return response.data;
  },

  async listPreparedInvoices(query: PreparedInvoicesQuery, signal?: AbortSignal): Promise<PreparedInvoicesListResponse> {
    const response = await axiosApi.get<PreparedInvoicesListResponse>("/billing/prepared-invoices", {
      params: query,
      signal
    });

    return response.data;
  },

  async prepareInvoice(input: PrepareInvoiceFromSale): Promise<PreparedInvoice> {
    const response = await axiosApi.post<PreparedInvoice>("/billing/prepared-invoices", input);

    return response.data;
  },

  async getPreparedInvoiceById(preparedInvoiceId: string, signal?: AbortSignal): Promise<PreparedInvoice> {
    const response = await axiosApi.get<PreparedInvoice>(`/billing/prepared-invoices/${preparedInvoiceId}`, { signal });

    return response.data;
  },

  async cancelPreparedInvoice(preparedInvoiceId: string, input: CancelPreparedInvoice): Promise<PreparedInvoice> {
    const response = await axiosApi.post<PreparedInvoice>(`/billing/prepared-invoices/${preparedInvoiceId}/cancel`, input);

    return response.data;
  }
};
