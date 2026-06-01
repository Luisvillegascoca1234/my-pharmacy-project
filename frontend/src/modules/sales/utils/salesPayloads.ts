import { CancelSaleSchema, SalesQuerySchema } from "@pharmacy-pos/shared";
import type { CancelSale, SalesQuery } from "../types/salesTypes";

export function buildSalesQuery(query: SalesQuery): SalesQuery {
  return SalesQuerySchema.parse({
    cashSessionId: query.cashSessionId || undefined,
    fromDate: query.fromDate || undefined,
    page: query.page,
    pageSize: query.pageSize,
    search: query.search || undefined,
    sellerUserId: query.sellerUserId || undefined,
    status: query.status,
    toDate: query.toDate || undefined
  });
}

export function buildCancelSalePayload(cancelReason: string): CancelSale {
  return CancelSaleSchema.parse({
    cancelReason: cancelReason.trim()
  });
}
