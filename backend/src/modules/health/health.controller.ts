import type { NextFunction, Request, Response } from "express";
import { HealthService } from "./health.service.js";

const healthService = new HealthService();

export async function getHealth(_request: Request, response: Response, next: NextFunction) {
  try {
    response.json(await healthService.getStatus());
  } catch (error) {
    next(error);
  }
}
