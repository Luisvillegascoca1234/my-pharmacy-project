import type { ErrorRequestHandler } from "express";
import { ApiErrorSchema } from "@pharmacy-pos/shared";
import { HttpError } from "../http/http-error.js";

export const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  const statusCode = error instanceof HttpError ? error.statusCode : 500;

  const payload = ApiErrorSchema.parse({
    message: error instanceof Error ? error.message : "Unexpected server error",
    code: error instanceof HttpError ? error.code : "INTERNAL_SERVER_ERROR",
    details: error instanceof HttpError ? error.details : undefined
  });

  response.status(statusCode).json(payload);
};
