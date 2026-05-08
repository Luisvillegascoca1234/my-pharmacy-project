import type { NextFunction, Request, Response } from "express";
import { CreateUnitSchema } from "@pharmacy-pos/shared";
import { UnitsService } from "./units.service.js";

const unitsService = new UnitsService();

export async function listUnits(_request: Request, response: Response, next: NextFunction) {
  try {
    response.json(await unitsService.listUnits());
  } catch (error) {
    next(error);
  }
}

export async function createUnit(request: Request, response: Response, next: NextFunction) {
  try {
    const input = CreateUnitSchema.parse(request.body);
    const unit = await unitsService.createUnit(input);

    response.status(201).json(unit);
  } catch (error) {
    next(error);
  }
}
