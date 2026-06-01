import type { NextFunction, Request, Response } from "express";
import { PosProductSearchQuerySchema } from "@pharmacy-pos/shared";
import { PosProductsService } from "./pos.service.js";

const posProductsService = new PosProductsService();

export async function searchPosProducts(request: Request, response: Response, next: NextFunction) {
  try {
    const query = PosProductSearchQuerySchema.parse(request.query);

    response.json(await posProductsService.searchProducts(query));
  } catch (error) {
    next(error);
  }
}
