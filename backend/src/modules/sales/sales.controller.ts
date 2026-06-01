import type { NextFunction, Request, Response } from "express";
import {
  CancelableSaleSchema,
  CancelSaleSchema,
  CreateSaleSchema,
  SaleSchema,
  SalesListResponseSchema,
  SalesQuerySchema
} from "@pharmacy-pos/shared";
import { SalesService } from "./sales.service.js";

const salesService = new SalesService();

export async function listSales(request: Request, response: Response, next: NextFunction) {
  try {
    const query = SalesQuerySchema.parse(request.query);
    const result = await salesService.listSales(query, getSaleAccessContext(request));

    response.json(SalesListResponseSchema.parse(result));
  } catch (error) {
    next(error);
  }
}

export async function createSale(request: Request, response: Response, next: NextFunction) {
  try {
    const input = CreateSaleSchema.parse(request.body);
    const sale = await salesService.createSale(input, getAuditContext(request));

    response.status(201).json(SaleSchema.parse(sale));
  } catch (error) {
    next(error);
  }
}

export async function getSale(request: Request, response: Response, next: NextFunction) {
  try {
    const sale = await salesService.getSale(request.params.id, getSaleAccessContext(request));

    response.json(CancelableSaleSchema.parse(sale));
  } catch (error) {
    next(error);
  }
}

export async function cancelSale(request: Request, response: Response, next: NextFunction) {
  try {
    const input = CancelSaleSchema.parse(request.body);
    const sale = await salesService.cancelSale(request.params.id, input, getSaleAccessContext(request));

    response.json(CancelableSaleSchema.parse(sale));
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

function getSaleAccessContext(request: Request) {
  return {
    ...getAuditContext(request),
    actorRoleName: request.authenticatedUser?.role.name
  };
}
