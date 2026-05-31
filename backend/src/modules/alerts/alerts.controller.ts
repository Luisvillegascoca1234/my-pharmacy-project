import type { NextFunction, Request, Response } from "express";
import { AlertsService } from "./alerts.service.js";

const alertsService = new AlertsService();

export async function listAlerts(_request: Request, response: Response, next: NextFunction) {
  try {
    response.json(await alertsService.listAlerts());
  } catch (error) {
    next(error);
  }
}
