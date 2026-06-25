import { billingApi } from "../api/billing-api";
import type {
  CancelPreparedInvoice,
  InvoiceableSalesListResponse,
  InvoiceableSalesQuery,
  PrepareInvoiceFromSale,
  PreparedInvoice,
  PreparedInvoicesListResponse,
  PreparedInvoicesQuery
} from "../types/billingTypes";
import {
  buildCancelPreparedInvoicePayload,
  buildInvoiceableSalesQuery,
  buildPreparedInvoicesQuery,
  buildPrepareInvoicePayload
} from "../utils/billingPayloads";

export const billingFacade = {
  listInvoiceableSales(query: InvoiceableSalesQuery, signal?: AbortSignal): Promise<InvoiceableSalesListResponse> {
    return billingApi.listInvoiceableSales(buildInvoiceableSalesQuery(query), signal);
  },

  listPreparedInvoices(query: PreparedInvoicesQuery, signal?: AbortSignal): Promise<PreparedInvoicesListResponse> {
    return billingApi.listPreparedInvoices(buildPreparedInvoicesQuery(query), signal);
  },

  prepareInvoice(input: PrepareInvoiceFromSale): Promise<PreparedInvoice> {
    return billingApi.prepareInvoice(buildPrepareInvoicePayload(input));
  },

  getPreparedInvoiceById(preparedInvoiceId: string, signal?: AbortSignal): Promise<PreparedInvoice> {
    return billingApi.getPreparedInvoiceById(preparedInvoiceId, signal);
  },

  cancelPreparedInvoice(preparedInvoiceId: string, input: CancelPreparedInvoice): Promise<PreparedInvoice> {
    return billingApi.cancelPreparedInvoice(preparedInvoiceId, buildCancelPreparedInvoicePayload(input));
  }
};
