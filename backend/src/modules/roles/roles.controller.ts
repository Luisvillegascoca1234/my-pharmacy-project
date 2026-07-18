import type { NextFunction, Request, Response } from "express";
import { RolesService } from "./roles.service.js";

const rolesService = new RolesService();

export async function listRoles(_request: Request, response: Response, next: NextFunction) {
  try {
    response.json(await rolesService.listRoles());
  } catch (error) {
    next(error);
  }
}
