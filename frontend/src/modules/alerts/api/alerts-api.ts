import type { AlertsListResponse } from "@pharmacy-pos/shared";
import { axiosApi } from "@/api";

export const alertsApi = {
  async listAlerts(signal?: AbortSignal): Promise<AlertsListResponse> {
    const response = await axiosApi.get<AlertsListResponse>("/alerts", { signal });

    return response.data;
  }
};
