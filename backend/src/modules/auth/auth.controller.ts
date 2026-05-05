import type { NextFunction, Request, Response } from "express";
import { LoginRequestSchema } from "@pharmacy-pos/shared";
import { AuthService } from "./auth.service.js";

const authService = new AuthService();

export async function login(request: Request, response: Response, next: NextFunction) {
  try {
    const credentials = LoginRequestSchema.parse(request.body);
    const session = await authService.login(credentials, getAuditContext(request));

    response.json(session);
  } catch (error) {
    next(error);
  }
}

export async function logout(request: Request, response: Response, next: NextFunction) {
  try {
    await authService.logout(request.authenticatedUser?.id, getAuditContext(request));

    response.status(204).send();
  } catch (error) {
    next(error);
  }
}

export function me(request: Request, response: Response) {
  response.json(request.authenticatedUser);
}

function getAuditContext(request: Request) {
  return {
    ipAddress: request.ip,
    userAgent: request.get("user-agent")
  };
}
