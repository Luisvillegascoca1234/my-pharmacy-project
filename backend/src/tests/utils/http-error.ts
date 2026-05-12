import { expect } from "vitest";
import { HttpError } from "../../common/http/http-error.js";

type ExpectedHttpError = {
  code?: string;
  message?: string;
  statusCode?: number;
};

export async function captureHttpError(action: () => Promise<unknown>) {
  try {
    await action();
  } catch (error) {
    if (error instanceof HttpError) {
      return error;
    }

    throw error;
  }

  throw new Error("Expected action to throw an HttpError.");
}

export function expectHttpError(error: unknown, expected: ExpectedHttpError) {
  expect(error).toBeInstanceOf(HttpError);

  const httpError = error as HttpError;
  expect(httpError.statusCode).toBe(expected.statusCode);

  if (expected.code !== undefined) {
    expect(httpError.code).toBe(expected.code);
  }

  if (expected.message !== undefined) {
    expect(httpError.message).toBe(expected.message);
  }
}
