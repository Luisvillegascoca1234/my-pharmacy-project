import type { NextFunction, Request, Response } from "express";
import {
  CreateInventoryAdjustmentSchema,
  FefoPreviewQuerySchema,
  InventoryMovementsQuerySchema,
  InventoryStockQuerySchema,
  isFeatureAllowed
} from "@pharmacy-pos/shared";
import { InventoryService } from "./inventory.service.js";

const inventoryService = new InventoryService();

export async function listStock(request: Request, response: Response, next: NextFunction) {
  try {
    const query = InventoryStockQuerySchema.parse(request.query);

    response.json(await inventoryService.listStock(query, canReadInventoryCosts(request)));
  } catch (error) {
    next(error);
  }
}

export async function listProductBatches(request: Request, response: Response, next: NextFunction) {
  try {
    response.json(await inventoryService.listProductBatches(request.params.productId, canReadInventoryCosts(request)));
  } catch (error) {
    next(error);
  }
}

export async function listMovements(request: Request, response: Response, next: NextFunction) {
  try {
    const query = InventoryMovementsQuerySchema.parse(request.query);

    response.json(await inventoryService.listMovements(query));
  } catch (error) {
    next(error);
  }
}

export async function createAdjustment(request: Request, response: Response, next: NextFunction) {
  try {
    const input = CreateInventoryAdjustmentSchema.parse(request.body);

    response.status(201).json(await inventoryService.createAdjustment(input, getAuditContext(request)));
  } catch (error) {
    next(error);
  }
}

export async function getFefoPreview(request: Request, response: Response, next: NextFunction) {
  try {
    const query = FefoPreviewQuerySchema.parse(request.query);

    response.json(await inventoryService.getFefoPreview(request.params.productId, query.quantity, canReadInventoryCosts(request)));
  } catch (error) {
    next(error);
  }
}

function canReadInventoryCosts(request: Request) {
  return isFeatureAllowed(request.authenticatedUser?.role.name, "inventoryCosts");
}

function getAuditContext(request: Request) {
  return {
    actorUserId: request.authenticatedUser?.id,
    ipAddress: request.ip,
    userAgent: request.get("user-agent")
  };
}
