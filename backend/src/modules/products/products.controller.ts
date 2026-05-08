import type { NextFunction, Request, Response } from "express";
import { CreateProductCategorySchema, CreateProductSchema, UpdateProductSchema, UpdateProductUnitsSchema } from "@pharmacy-pos/shared";
import { ProductsService } from "./products.service.js";

const productsService = new ProductsService();

export async function listCategories(_request: Request, response: Response, next: NextFunction) {
  try {
    response.json(await productsService.listCategories());
  } catch (error) {
    next(error);
  }
}

export async function createCategory(request: Request, response: Response, next: NextFunction) {
  try {
    const input = CreateProductCategorySchema.parse(request.body);
    const category = await productsService.createCategory(input);

    response.status(201).json(category);
  } catch (error) {
    next(error);
  }
}

export async function listProducts(request: Request, response: Response, next: NextFunction) {
  try {
    const search = typeof request.query.search === "string" ? request.query.search : undefined;

    response.json(await productsService.listProducts(search));
  } catch (error) {
    next(error);
  }
}

export async function getProduct(request: Request, response: Response, next: NextFunction) {
  try {
    response.json(await productsService.getProduct(request.params.id));
  } catch (error) {
    next(error);
  }
}

export async function createProduct(request: Request, response: Response, next: NextFunction) {
  try {
    const input = CreateProductSchema.parse(request.body);
    const product = await productsService.createProduct(input, getAuditContext(request));

    response.status(201).json(product);
  } catch (error) {
    next(error);
  }
}

export async function updateProduct(request: Request, response: Response, next: NextFunction) {
  try {
    const input = UpdateProductSchema.parse(request.body);
    const product = await productsService.updateProduct(request.params.id, input, getAuditContext(request));

    response.json(product);
  } catch (error) {
    next(error);
  }
}

export async function updateProductUnits(request: Request, response: Response, next: NextFunction) {
  try {
    const input = UpdateProductUnitsSchema.parse(request.body);
    const product = await productsService.updateProductUnits(request.params.id, input, getAuditContext(request));

    response.json(product);
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
