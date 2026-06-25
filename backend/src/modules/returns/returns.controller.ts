import type { NextFunction, Request, Response } from "express";
import {
  CreateTotalSaleReturnSchema,
  ReturnableSalesListResponseSchema,
  ReturnableSalesQuerySchema,
  SaleReturnSchema,
  SaleReturnsListResponseSchema,
  SaleReturnsQuerySchema
} from "@pharmacy-pos/shared";
import { ReturnsService } from "./returns.service.js";

const returnsService = new ReturnsService();

export async function listReturnableSales(request: Request, response: Response, next: NextFunction) {
  try {
    const query = ReturnableSalesQuerySchema.parse(request.query);
    const result = await returnsService.listReturnableSales(query, getAuditContext(request));

    response.json(ReturnableSalesListResponseSchema.parse(result));
  } catch (error) {
    next(error);
  }
}

export async function listSaleReturns(request: Request, response: Response, next: NextFunction) {
  try {
    const query = SaleReturnsQuerySchema.parse(request.query);
    const result = await returnsService.listSaleReturns(query, getAuditContext(request));

    response.json(SaleReturnsListResponseSchema.parse(result));
  } catch (error) {
    next(error);
  }
}

export async function createTotalSaleReturn(request: Request, response: Response, next: NextFunction) {
  try {
    const input = CreateTotalSaleReturnSchema.parse(request.body);
    const saleReturn = await returnsService.createTotalSaleReturn(input, getAuditContext(request));

    response.status(201).json(SaleReturnSchema.parse(saleReturn));
  } catch (error) {
    next(error);
  }
}

export async function getSaleReturnById(request: Request, response: Response, next: NextFunction) {
  try {
    const saleReturn = await returnsService.getSaleReturnById(request.params.id, getAuditContext(request));

    response.json(SaleReturnSchema.parse(saleReturn));
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
