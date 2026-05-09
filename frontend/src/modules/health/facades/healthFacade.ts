import type { HealthStatus } from "@pharmacy-pos/shared";
import { healthApi } from "../api/get-health-status";

export const healthFacade = {
  getHealthStatus(signal?: AbortSignal): Promise<HealthStatus> {
    return healthApi.getHealthStatus(signal);
  }
};
