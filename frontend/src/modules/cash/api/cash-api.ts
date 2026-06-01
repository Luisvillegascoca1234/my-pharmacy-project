import type { CashSession, CloseCashSession, CurrentCashSession, OpenCashSession } from "@pharmacy-pos/shared";
import { axiosApi } from "@/api";

export const cashApi = {
  async getCurrentCashSession(signal?: AbortSignal): Promise<CurrentCashSession> {
    const response = await axiosApi.get<CurrentCashSession>("/cash-sessions/current", { signal });

    return response.data;
  },

  async openCashSession(input: OpenCashSession): Promise<CashSession> {
    const response = await axiosApi.post<CashSession>("/cash-sessions/open", input);

    return response.data;
  },

  async closeCashSession(cashSessionId: string, input: CloseCashSession): Promise<CashSession> {
    const response = await axiosApi.post<CashSession>(`/cash-sessions/${cashSessionId}/close`, input);

    return response.data;
  }
};
