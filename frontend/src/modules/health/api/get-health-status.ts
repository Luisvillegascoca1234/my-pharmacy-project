import type { HealthStatus } from "@pharmacy-pos/shared";
import { axiosApi } from "@/api";

export const healthApi = {
  async getHealthStatus(signal?: AbortSignal): Promise<HealthStatus> {
    const response = await axiosApi.get<HealthStatus>("/health", {
      signal
    });

    return response.data;
  }
};
