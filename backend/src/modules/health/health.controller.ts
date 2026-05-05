import type { Request, Response } from "express";
import { HealthService } from "./health.service.js";

const healthService = new HealthService();

export function getHealth(_request: Request, response: Response) {
  response.json(healthService.getStatus());
}
