import type { NextFunction, Request, Response } from "express";
import {
  CancelPurchaseSchema,
  CreatePurchaseSchema,
  PurchasesQuerySchema,
  ReceivePurchaseSchema,
  UpdatePurchaseSchema
} from "@pharmacy-pos/shared";
import { PurchasesService } from "./purchases.service.js";

const purchasesService = new PurchasesService();

export async function listPurchases(request: Request, response: Response, next: NextFunction) {
  try {
    const query = PurchasesQuerySchema.parse(request.query);

    response.json(await purchasesService.listPurchases(query));
  } catch (error) {
    next(error);
  }
}

export async function getPurchase(request: Request, response: Response, next: NextFunction) {
  try {
    response.json(await purchasesService.getPurchase(request.params.id));
  } catch (error) {
    next(error);
  }
}

export async function createPurchase(request: Request, response: Response, next: NextFunction) {
  try {
    const input = CreatePurchaseSchema.parse(request.body);
    const purchase = await purchasesService.createPurchase(input, getAuditContext(request));

    response.status(201).json(purchase);
  } catch (error) {
    next(error);
  }
}

export async function updatePurchase(request: Request, response: Response, next: NextFunction) {
  try {
    const input = UpdatePurchaseSchema.parse(request.body);

    response.json(await purchasesService.updatePurchase(request.params.id, input, getAuditContext(request)));
  } catch (error) {
    next(error);
  }
}

export async function receivePurchase(request: Request, response: Response, next: NextFunction) {
  try {
    const input = ReceivePurchaseSchema.parse(request.body);

    response.json(await purchasesService.receivePurchase(request.params.id, input, getAuditContext(request)));
  } catch (error) {
    next(error);
  }
}

export async function cancelPurchase(request: Request, response: Response, next: NextFunction) {
  try {
    const input = CancelPurchaseSchema.parse(request.body);

    response.json(await purchasesService.cancelPurchase(request.params.id, input, getAuditContext(request)));
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
