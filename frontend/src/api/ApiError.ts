export type ApiErrorInit = {
  code?: string;
  details?: unknown;
  message: string;
  statusCode: number;
};

export class ApiError extends Error {
  readonly code?: string;
  readonly details?: unknown;
  readonly statusCode: number;

  constructor(error: ApiErrorInit) {
    super(error.message);
    this.name = "ApiError";
    this.code = error.code;
    this.details = error.details;
    this.statusCode = error.statusCode;
  }

  static isApiError(error: unknown): error is ApiError {
    return error instanceof ApiError;
  }
}
