import type { NextFunction, Request, Response } from "express";
import { RolesRepository } from "./roles.repository.js";

const rolesRepository = new RolesRepository();

export async function listRoles(_request: Request, response: Response, next: NextFunction) {
  try {
    const roles = await rolesRepository.listRoles();

    response.json(
      roles.map((role) => ({
        id: role.id,
        name: role.name,
        displayName: role.displayName
      }))
    );
  } catch (error) {
    next(error);
  }
}
