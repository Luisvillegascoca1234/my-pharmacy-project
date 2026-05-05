import { HealthStatusSchema, type HealthStatus } from "@pharmacy-pos/shared";
import { env } from "../../config/env.js";

export class HealthService {
  getStatus(): HealthStatus {
    return HealthStatusSchema.parse({
      status: "ok",
      version: env.APP_VERSION,
      timestamp: new Date().toISOString()
    });
  }
}
