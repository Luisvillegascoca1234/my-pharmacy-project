import type { NextFunction, Request, Response } from "express";
import {
  DailySalesReportQuerySchema,
  DailySalesReportResponseSchema,
  ExpiringProductsReportQuerySchema,
  ExpiringProductsReportResponseSchema,
  InventoryValuationReportQuerySchema,
  InventoryValuationReportResponseSchema
} from "@pharmacy-pos/shared";
import { ReportsService } from "./reports.service.js";

const reportsService = new ReportsService();

export async function getDailySalesReport(request: Request, response: Response, next: NextFunction) {
  try {
    const query = DailySalesReportQuerySchema.parse(request.query);
    const result = await reportsService.getDailySalesReport(query);

    response.json(DailySalesReportResponseSchema.parse(result));
  } catch (error) {
    next(error);
  }
}

export async function getInventoryValuationReport(request: Request, response: Response, next: NextFunction) {
  try {
    const query = InventoryValuationReportQuerySchema.parse(request.query);
    const result = await reportsService.getInventoryValuationReport(query);

    response.json(InventoryValuationReportResponseSchema.parse(result));
  } catch (error) {
    next(error);
  }
}

export async function getExpiringProductsReport(request: Request, response: Response, next: NextFunction) {
  try {
    const query = ExpiringProductsReportQuerySchema.parse(request.query);
    const result = await reportsService.getExpiringProductsReport(query);

    response.json(ExpiringProductsReportResponseSchema.parse(result));
  } catch (error) {
    next(error);
  }
}
