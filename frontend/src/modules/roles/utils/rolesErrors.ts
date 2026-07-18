import { ApiError } from "@/api";
import type { RolesDataError } from "../types/rolesTypes";

const ROLE_CATALOG_CONFIGURATION_INCONSISTENT = "ROLE_CATALOG_CONFIGURATION_INCONSISTENT";

export class InvalidRolesConfigurationError extends Error {
  readonly details: unknown;

  constructor(details: unknown) {
    super("The roles catalog does not match the fixed institutional configuration.");
    this.name = "InvalidRolesConfigurationError";
    this.details = details;
  }
}

export function createRolesDataError(error: unknown): RolesDataError {
  if (error instanceof InvalidRolesConfigurationError) {
    return { cause: error.details, code: "invalid-configuration" };
  }

  if (ApiError.isApiError(error) && error.code === ROLE_CATALOG_CONFIGURATION_INCONSISTENT) {
    return { cause: error.details, code: "invalid-configuration" };
  }

  return { cause: error, code: "request-failed" };
}
