import type { NextFunction, Request, Response } from "express";
import { isFeatureAllowed } from "@pharmacy-pos/shared";
import { HttpError } from "../http/http-error.js";

export function requireRole(feature: string) {
  return (request: Request, _response: Response, next: NextFunction) => {
    const roleName = request.authenticatedUser?.role.name;

    if (!isFeatureAllowed(roleName, feature)) {
      next(new HttpError(403, "No tienes autorización para realizar esta acción.", "FORBIDDEN"));
      return;
    }

    next();
  };
}
