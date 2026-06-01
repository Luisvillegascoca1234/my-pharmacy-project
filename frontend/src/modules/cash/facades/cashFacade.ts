import type { CashSession, CloseCashSession, CurrentCashSession, OpenCashSession } from "@pharmacy-pos/shared";
import { cashApi } from "../api/cash-api";
import { buildCloseCashSessionPayload, buildOpenCashSessionPayload } from "../utils/cashPayloads";

export const cashFacade = {
  getCurrent(signal?: AbortSignal): Promise<CurrentCashSession> {
    return cashApi.getCurrentCashSession(signal);
  },

  open(input: OpenCashSession): Promise<CashSession> {
    return cashApi.openCashSession(buildOpenCashSessionPayload(input));
  },

  closeOwn(cashSessionId: string, input: CloseCashSession): Promise<CashSession> {
    return cashApi.closeCashSession(cashSessionId, buildCloseCashSessionPayload(input));
  }
};
