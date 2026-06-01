import type { CashSupervisionListResponse, CashSupervisionQuery, CloseSupervisedCashSession, SupervisableCashSession } from "../types/cashSupervisionTypes";
import { cashSupervisionApi } from "../api/cash-supervision-api";
import { buildCashSupervisionQuery, buildCloseSupervisedCashSessionPayload } from "../utils/cashSupervisionPayloads";

export const cashSupervisionFacade = {
  list(query: CashSupervisionQuery, signal?: AbortSignal): Promise<CashSupervisionListResponse> {
    return cashSupervisionApi.list(buildCashSupervisionQuery(query), signal);
  },

  close(cashSessionId: string, input: CloseSupervisedCashSession): Promise<SupervisableCashSession> {
    return cashSupervisionApi.close(cashSessionId, buildCloseSupervisedCashSessionPayload(input));
  }
};
