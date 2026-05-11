import type { NextFunction, Request, Response } from "express";
import { CreateUserSchema, ResetUserPasswordSchema, UpdateUserSchema, UpdateUserStatusSchema, UsersQuerySchema } from "@pharmacy-pos/shared";
import { UsersService } from "./users.service.js";

const usersService = new UsersService();

export async function getCurrentUser(request: Request, response: Response, next: NextFunction) {
  try {
    response.json(await usersService.getCurrentUser(request.authenticatedUser?.id ?? ""));
  } catch (error) {
    next(error);
  }
}

export async function listUsers(request: Request, response: Response, next: NextFunction) {
  try {
    const query = UsersQuerySchema.parse(request.query);

    response.json(await usersService.listUsers(query));
  } catch (error) {
    next(error);
  }
}

export async function getUser(request: Request, response: Response, next: NextFunction) {
  try {
    response.json(await usersService.getUser(request.params.id));
  } catch (error) {
    next(error);
  }
}

export async function createUser(request: Request, response: Response, next: NextFunction) {
  try {
    const input = CreateUserSchema.parse(request.body);
    const user = await usersService.createUser(input, getAuditContext(request));

    response.status(201).json(user);
  } catch (error) {
    next(error);
  }
}

export async function updateUser(request: Request, response: Response, next: NextFunction) {
  try {
    const input = UpdateUserSchema.parse(request.body);

    response.json(await usersService.updateUser(request.params.id, input, getAuditContext(request)));
  } catch (error) {
    next(error);
  }
}

export async function updateUserStatus(request: Request, response: Response, next: NextFunction) {
  try {
    const input = UpdateUserStatusSchema.parse(request.body);

    response.json(await usersService.updateUserStatus(request.params.id, input, getAuditContext(request)));
  } catch (error) {
    next(error);
  }
}

export async function resetUserPassword(request: Request, response: Response, next: NextFunction) {
  try {
    const input = ResetUserPasswordSchema.parse(request.body);
    await usersService.resetPassword(request.params.id, input, getAuditContext(request));

    response.status(204).send();
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
