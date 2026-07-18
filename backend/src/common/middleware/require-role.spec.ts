import type { NextFunction, Request, Response } from "express";
import { describe, expect, it, vi } from "vitest";
import { requireRole } from "./require-role.js";

describe("requireRole", () => {
  it("allows a role declared by the shared feature policy", () => {
    const next = vi.fn() as unknown as NextFunction;

    requireRole("reports")(makeRequest("admin"), {} as Response, next);

    expect(next).toHaveBeenCalledWith();
  });

  it("returns the current forbidden error contract for a denied role", () => {
    const next = vi.fn() as unknown as NextFunction;

    requireRole("reports")(makeRequest("seller"), {} as Response, next);

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        code: "FORBIDDEN",
        message: "No tienes autorización para realizar esta acción.",
        statusCode: 403
      })
    );
  });

  it("denies missing identities at the authorization boundary", () => {
    const next = vi.fn() as unknown as NextFunction;

    requireRole("reports")({} as Request, {} as Response, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ code: "FORBIDDEN", statusCode: 403 }));
  });

  it.each(["superadmin", "admin", "seller"])("denies undeclared features to %s", (roleName) => {
    const next = vi.fn() as unknown as NextFunction;

    requireRole("futureFeature")(makeRequest(roleName), {} as Response, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ code: "FORBIDDEN", statusCode: 403 }));
  });
});

function makeRequest(roleName: string) {
  return {
    authenticatedUser: {
      role: { name: roleName }
    }
  } as Request;
}
