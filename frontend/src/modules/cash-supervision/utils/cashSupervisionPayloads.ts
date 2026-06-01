import { CashSessionsQuerySchema, CloseCashSessionSchema } from "@pharmacy-pos/shared";
import type { CashSupervisionQuery, CloseSupervisedCashSession } from "../types/cashSupervisionTypes";

export function buildCashSupervisionQuery(query: CashSupervisionQuery): CashSupervisionQuery {
  return CashSessionsQuerySchema.parse({
    fromDate: query.fromDate || undefined,
    openedByUserId: query.openedByUserId || undefined,
    page: query.page,
    pageSize: query.pageSize,
    status: query.status,
    toDate: query.toDate || undefined
  });
}

export function buildCloseSupervisedCashSessionPayload(input: CloseSupervisedCashSession): CloseSupervisedCashSession {
  return CloseCashSessionSchema.parse({
    closingNote: input.closingNote?.trim() || undefined,
    countedAmount: input.countedAmount
  });
}
