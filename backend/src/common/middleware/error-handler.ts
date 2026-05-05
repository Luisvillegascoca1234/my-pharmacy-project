import type { ErrorRequestHandler } from "express";
import { ApiErrorSchema } from "@pharmacy-pos/shared";
import { ZodError } from "zod";
import { HttpError } from "../http/http-error.js";

export const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  const statusCode = error instanceof HttpError ? error.statusCode : error instanceof ZodError ? 400 : 500;

  const payload = ApiErrorSchema.parse({
    message: error instanceof ZodError ? "Invalid request payload." : error instanceof Error ? error.message : "Unexpected server error",
    code: error instanceof HttpError ? error.code : error instanceof ZodError ? "VALIDATION_ERROR" : "INTERNAL_SERVER_ERROR",
    details: error instanceof HttpError ? error.details : error instanceof ZodError ? error.flatten() : undefined
  });

  response.status(statusCode).json(payload);
};
