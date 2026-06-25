import type { NextFunction, Request, Response } from "express";
import {
  CancelPreparedInvoiceSchema,
  InvoiceableSalesListResponseSchema,
  InvoiceableSalesQuerySchema,
  PrepareInvoiceFromSaleSchema,
  PreparedInvoiceSchema,
  PreparedInvoicesListResponseSchema,
  PreparedInvoicesQuerySchema
} from "@pharmacy-pos/shared";
import { BillingService } from "./billing.service.js";

const billingService = new BillingService();

export async function listInvoiceableSales(request: Request, response: Response, next: NextFunction) {
  try {
    const query = InvoiceableSalesQuerySchema.parse(request.query);
    const result = await billingService.listInvoiceableSales(query, getAuditContext(request));

    response.json(InvoiceableSalesListResponseSchema.parse(result));
  } catch (error) {
    next(error);
  }
}

export async function listPreparedInvoices(request: Request, response: Response, next: NextFunction) {
  try {
    const query = PreparedInvoicesQuerySchema.parse(request.query);
    const result = await billingService.listPreparedInvoices(query, getAuditContext(request));

    response.json(PreparedInvoicesListResponseSchema.parse(result));
  } catch (error) {
    next(error);
  }
}

export async function prepareInvoiceFromSale(request: Request, response: Response, next: NextFunction) {
  try {
    const input = PrepareInvoiceFromSaleSchema.parse(request.body);
    const preparedInvoice = await billingService.prepareInvoiceFromSale(input, getAuditContext(request));

    response.status(201).json(PreparedInvoiceSchema.parse(preparedInvoice));
  } catch (error) {
    next(error);
  }
}

export async function getPreparedInvoiceById(request: Request, response: Response, next: NextFunction) {
  try {
    const preparedInvoice = await billingService.getPreparedInvoiceById(request.params.id, getAuditContext(request));

    response.json(PreparedInvoiceSchema.parse(preparedInvoice));
  } catch (error) {
    next(error);
  }
}

export async function cancelPreparedInvoice(request: Request, response: Response, next: NextFunction) {
  try {
    const input = CancelPreparedInvoiceSchema.parse(request.body);
    const preparedInvoice = await billingService.cancelPreparedInvoice(request.params.id, input, getAuditContext(request));

    response.json(PreparedInvoiceSchema.parse(preparedInvoice));
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
