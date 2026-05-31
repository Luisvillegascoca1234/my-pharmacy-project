import type { AlertsListResponse } from "@pharmacy-pos/shared";
import { alertsApi } from "../api/alerts-api";

export const alertsFacade = {
  listAlerts(signal?: AbortSignal): Promise<AlertsListResponse> {
    return alertsApi.listAlerts(signal);
  }
};
