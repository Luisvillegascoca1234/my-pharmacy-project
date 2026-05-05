import { HealthStatusSchema, type HealthStatus } from "@pharmacy-pos/shared";
import { apiGet } from "../../../api/client";

export async function getHealthStatus(signal?: AbortSignal): Promise<HealthStatus> {
  const payload = await apiGet<HealthStatus>("/health", signal);

  return HealthStatusSchema.parse(payload);
}
