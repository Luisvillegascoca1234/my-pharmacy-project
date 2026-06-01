import type { CashSupervisionListResponse, CashSupervisionQuery, CloseSupervisedCashSession, SupervisableCashSession } from "../types/cashSupervisionTypes";
import { axiosApi } from "@/api";

export const cashSupervisionApi = {
  async list(query: CashSupervisionQuery, signal?: AbortSignal): Promise<CashSupervisionListResponse> {
    const response = await axiosApi.get<CashSupervisionListResponse>("/cash-sessions", {
      params: query,
      signal
    });

    return response.data;
  },

  async close(cashSessionId: string, input: CloseSupervisedCashSession): Promise<SupervisableCashSession> {
    const response = await axiosApi.post<SupervisableCashSession>(`/cash-sessions/${cashSessionId}/close`, input);

    return response.data;
  }
};
