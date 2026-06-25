import {
  CancelPreparedInvoiceSchema,
  InvoiceableSalesQuerySchema,
  PrepareInvoiceFromSaleSchema,
  PreparedInvoicesQuerySchema
} from "@pharmacy-pos/shared";
import type {
  CancelPreparedInvoice,
  InvoiceableSalesQuery,
  PrepareInvoiceFromSale,
  PreparedInvoicesQuery
} from "../types/billingTypes";

export function buildPreparedInvoicesQuery(query: PreparedInvoicesQuery): PreparedInvoicesQuery {
  return PreparedInvoicesQuerySchema.parse(query);
}

export function buildInvoiceableSalesQuery(query: InvoiceableSalesQuery): InvoiceableSalesQuery {
  return InvoiceableSalesQuerySchema.parse(query);
}

export function buildPrepareInvoicePayload(input: PrepareInvoiceFromSale): PrepareInvoiceFromSale {
  return PrepareInvoiceFromSaleSchema.parse(input);
}

export function buildCancelPreparedInvoicePayload(input: CancelPreparedInvoice): CancelPreparedInvoice {
  return CancelPreparedInvoiceSchema.parse(input);
}
