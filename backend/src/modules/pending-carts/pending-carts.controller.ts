import type { NextFunction, Request, Response } from "express";
import {
  ConvertPendingCartSchema,
  DiscardPendingCartSchema,
  EditPendingCartSchema,
  PendingCartSchema,
  PendingCartsListResponseSchema,
  PendingCartsQuerySchema,
  SavePendingCartSchema
} from "@pharmacy-pos/shared";
import { PendingCartsService } from "./pending-carts.service.js";

const pendingCartsService = new PendingCartsService();

export async function listPendingCarts(request: Request, response: Response, next: NextFunction) {
  try {
    const query = PendingCartsQuerySchema.parse(request.query);
    const result = await pendingCartsService.listPendingCarts(query, getPendingCartContext(request));

    response.json(PendingCartsListResponseSchema.parse(result));
  } catch (error) {
    next(error);
  }
}

export async function createPendingCart(request: Request, response: Response, next: NextFunction) {
  try {
    const input = SavePendingCartSchema.parse(request.body);
    const cart = await pendingCartsService.createPendingCart(input, getPendingCartContext(request));

    response.status(201).json(PendingCartSchema.parse(cart));
  } catch (error) {
    next(error);
  }
}

export async function updatePendingCart(request: Request, response: Response, next: NextFunction) {
  try {
    const input = EditPendingCartSchema.parse(request.body);
    const cart = await pendingCartsService.updatePendingCart(request.params.id, input, getPendingCartContext(request));

    response.json(PendingCartSchema.parse(cart));
  } catch (error) {
    next(error);
  }
}

export async function discardPendingCart(request: Request, response: Response, next: NextFunction) {
  try {
    const input = DiscardPendingCartSchema.parse(request.body);
    const cart = await pendingCartsService.discardPendingCart(request.params.id, input, getPendingCartContext(request));

    response.json(PendingCartSchema.parse(cart));
  } catch (error) {
    next(error);
  }
}

export async function convertPendingCart(request: Request, response: Response, next: NextFunction) {
  try {
    const input = ConvertPendingCartSchema.parse(request.body);
    const cart = await pendingCartsService.convertPendingCart(request.params.id, input, getPendingCartContext(request));

    response.json(PendingCartSchema.parse(cart));
  } catch (error) {
    next(error);
  }
}

function getPendingCartContext(request: Request) {
  return {
    actorRoleName: request.authenticatedUser?.role.name,
    actorUserId: request.authenticatedUser?.id,
    ipAddress: request.ip,
    userAgent: request.get("user-agent")
  };
}
