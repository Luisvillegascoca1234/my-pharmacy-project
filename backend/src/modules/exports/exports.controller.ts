import type { NextFunction, Request, Response } from "express";
import {
  InventoryMovementsCsvExportQuerySchema,
  SalesCsvExportQuerySchema,
  StockPlanningParquetExportQuerySchema,
  StockPlanningPredictionParquetExportQuerySchema
} from "@pharmacy-pos/shared";
import { ExportsService } from "./exports.service.js";
import { StockPlanningParquetService } from "./stock-planning-parquet.service.js";

const exportsService = new ExportsService();
const stockPlanningParquetService = new StockPlanningParquetService();

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

export async function downloadStockPlanningTimeSeriesParquet(
  request: Request,
  response: Response,
  next: NextFunction
) {
  try {
    const query = StockPlanningParquetExportQuerySchema.parse(request.query);
    const result = await stockPlanningParquetService.exportTimeSeries(query, buildAuditContext(request));
    sendParquet(response, result.fileName, result.contentType, result.buffer);
  } catch (error) {
    next(error);
  }
}

export async function downloadStockPlanningPredictionsParquet(
  request: Request,
  response: Response,
  next: NextFunction
) {
  try {
    const query = StockPlanningPredictionParquetExportQuerySchema.parse(request.query);
    const result = await stockPlanningParquetService.exportPredictionResults(
      query,
      buildAuditContext(request)
    );
    sendParquet(response, result.fileName, result.contentType, result.buffer);
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

function sendParquet(response: Response, fileName: string, contentType: string, buffer: Buffer) {
  response.setHeader("Content-Type", contentType);
  response.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
  response.setHeader("Content-Length", buffer.byteLength);
  response.status(200).send(buffer);
}
