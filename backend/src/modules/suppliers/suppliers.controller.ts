import type { NextFunction, Request, Response } from "express";
import { CreateSupplierSchema, SuppliersQuerySchema, UpdateSupplierSchema } from "@pharmacy-pos/shared";
import { SuppliersService } from "./suppliers.service.js";

const suppliersService = new SuppliersService();

export async function listSuppliers(request: Request, response: Response, next: NextFunction) {
  try {
    const query = SuppliersQuerySchema.parse(request.query);

    response.json(await suppliersService.listSuppliers(query));
  } catch (error) {
    next(error);
  }
}

export async function getSupplier(request: Request, response: Response, next: NextFunction) {
  try {
    response.json(await suppliersService.getSupplier(request.params.id));
  } catch (error) {
    next(error);
  }
}

export async function createSupplier(request: Request, response: Response, next: NextFunction) {
  try {
    const input = CreateSupplierSchema.parse(request.body);
    const supplier = await suppliersService.createSupplier(input, getAuditContext(request));

    response.status(201).json(supplier);
  } catch (error) {
    next(error);
  }
}

export async function updateSupplier(request: Request, response: Response, next: NextFunction) {
  try {
    const input = UpdateSupplierSchema.parse(request.body);

    response.json(await suppliersService.updateSupplier(request.params.id, input, getAuditContext(request)));
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
