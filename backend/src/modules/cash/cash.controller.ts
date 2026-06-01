import type { NextFunction, Request, Response } from "express";
import {
  CashSessionsListResponseSchema,
  CashSessionsQuerySchema,
  CashSessionSchema,
  CloseCashSessionSchema,
  CurrentCashSessionSchema,
  OpenCashSessionSchema
} from "@pharmacy-pos/shared";
import { CashSessionsService } from "./cash.service.js";

const cashSessionsService = new CashSessionsService();

export async function listCashSessions(request: Request, response: Response, next: NextFunction) {
  try {
    const query = CashSessionsQuerySchema.parse(request.query);
    const result = await cashSessionsService.listCashSessions(query, getCashSessionContext(request));

    response.json(CashSessionsListResponseSchema.parse(result));
  } catch (error) {
    next(error);
  }
}

export async function openCashSession(request: Request, response: Response, next: NextFunction) {
  try {
    const input = OpenCashSessionSchema.parse(request.body);
    const cashSession = await cashSessionsService.openCashSession(input, getAuditContext(request));

    response.status(201).json(CashSessionSchema.parse(cashSession));
  } catch (error) {
    next(error);
  }
}

export async function getCurrentCashSession(request: Request, response: Response, next: NextFunction) {
  try {
    const currentCashSession = await cashSessionsService.getCurrentCashSession(getAuditContext(request));

    response.json(CurrentCashSessionSchema.parse(currentCashSession));
  } catch (error) {
    next(error);
  }
}

export async function closeCashSession(request: Request, response: Response, next: NextFunction) {
  try {
    const input = CloseCashSessionSchema.parse(request.body);
    const cashSession = await cashSessionsService.closeCashSession(request.params.id, input, getAuditContext(request));

    response.json(CashSessionSchema.parse(cashSession));
  } catch (error) {
    next(error);
  }
}

function getAuditContext(request: Request) {
  return {
    actorUserId: request.authenticatedUser?.id,
    ipAddress: request.ip,
    userAgent: request.get("user-agent")
  };
}

function getCashSessionContext(request: Request) {
  return {
    ...getAuditContext(request),
    actorRoleName: request.authenticatedUser?.role.name
  };
}
