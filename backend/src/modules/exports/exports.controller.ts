import type { NextFunction, Request, Response } from "express";
import {
  InventoryMovementsCsvExportQuerySchema,
  SalesCsvExportQuerySchema
} from "@pharmacy-pos/shared";
import { ExportsService } from "./exports.service.js";

const exportsService = new ExportsService();

export async function downloadSalesCsv(request: Request, response: Response, next: NextFunction) {
  try {
    const query = SalesCsvExportQuerySchema.parse(request.query);
    const result = await exportsService.exportSalesCsv(query, buildAuditContext(request));

    sendCsv(response, result.fileName, result.contentType, result.csv);
  } catch (error) {
    next(error);
  }
}

export async function downloadInventoryMovementsCsv(request: Request, response: Response, next: NextFunction) {
  try {
    const query = InventoryMovementsCsvExportQuerySchema.parse(request.query);
    const result = await exportsService.exportInventoryMovementsCsv(query, buildAuditContext(request));

    sendCsv(response, result.fileName, result.contentType, result.csv);
  } catch (error) {
    next(error);
  }
}

function buildAuditContext(request: Request) {
  return {
    actorUserId: request.authenticatedUser?.id,
    ipAddress: request.ip,
    userAgent: request.get("user-agent")
  };
}

function sendCsv(response: Response, fileName: string, contentType: string, csv: string) {
  response.setHeader("Content-Type", contentType);
  response.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
  response.status(200).send(csv);
}
