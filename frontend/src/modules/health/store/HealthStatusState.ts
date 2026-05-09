import type { HealthStatus } from "@pharmacy-pos/shared";

export type HealthStatusValue = "error" | "loading" | "success";

export type HealthStatusState = {
  data: HealthStatus | null;
  error: string | null;
  status: HealthStatusValue;
};

export const initialHealthStatusState: HealthStatusState = {
  data: null,
  error: null,
  status: "loading"
};
