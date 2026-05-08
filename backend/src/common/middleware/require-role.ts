import type { NextFunction, Request, Response } from "express";
import type { BaseRole } from "@pharmacy-pos/shared";
import { HttpError } from "../http/http-error.js";

export function requireRole(allowedRoles: BaseRole[]) {
  return (request: Request, _response: Response, next: NextFunction) => {
    const roleName = request.authenticatedUser?.role.name;

    if (!roleName || !allowedRoles.includes(roleName as BaseRole)) {
      next(new HttpError(403, "You do not have permission to perform this action.", "FORBIDDEN"));
      return;
    }

    next();
  };
}
