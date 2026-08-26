import { HealthStatusSchema, type HealthStatus } from "@pharmacy-pos/shared";
import { HttpError } from "../../common/http/http-error.js";
import { env } from "../../config/env.js";
import { HealthRepository } from "./health.repository.js";

export class HealthService {
  constructor(private readonly repository = new HealthRepository()) {}

  async getStatus(): Promise<HealthStatus> {
    try {
      await this.repository.checkDatabaseConnection();
    } catch {
      throw new HttpError(503, "Database is unavailable.", "DATABASE_UNAVAILABLE");
    }

    return HealthStatusSchema.parse({
      status: "ok",
      version: env.APP_VERSION,
      timestamp: new Date().toISOString()
    });
  }
}
