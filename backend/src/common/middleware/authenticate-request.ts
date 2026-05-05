import type { NextFunction, Request, Response } from "express";
import { HttpError } from "../http/http-error.js";
import { AuthService } from "../../modules/auth/auth.service.js";

const authService = new AuthService();

export async function authenticateRequest(request: Request, _response: Response, next: NextFunction) {
  try {
    const token = getBearerToken(request);
    const payload = authService.verifyToken(token);

    request.authenticatedUser = await authService.getAuthenticatedUser(payload.sub);
    next();
  } catch (error) {
    next(error);
  }
}

function getBearerToken(request: Request) {
  const authorization = request.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    throw new HttpError(401, "Authentication is required.", "AUTHENTICATION_REQUIRED");
  }

  const token = authorization.slice("Bearer ".length).trim();

  if (!token) {
    throw new HttpError(401, "Authentication is required.", "AUTHENTICATION_REQUIRED");
  }

  return token;
}
