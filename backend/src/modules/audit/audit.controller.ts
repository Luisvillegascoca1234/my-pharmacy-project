import type { NextFunction, Request, Response } from "express";
import { AuditLogsListResponseSchema, AuditLogsQuerySchema } from "@pharmacy-pos/shared";
import { AuditService } from "./audit.service.js";

const auditService = new AuditService();

export async function listAuditLogs(request: Request, response: Response, next: NextFunction) {
  try {
    const query = AuditLogsQuerySchema.parse(request.query);
    const result = await auditService.listAuditLogs(query);

    response.json(AuditLogsListResponseSchema.parse(result));
  } catch (error) {
    next(error);
  }
}
