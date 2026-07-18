import { describe, expect, it } from "vitest";
import { AuthenticatedUserSchema } from "@pharmacy-pos/shared";
import { toAuthenticatedUser } from "./auth.repository.js";

describe("authenticated identity contract", () => {
  it("maps an authenticated user using only the fixed role", () => {
    const user = toAuthenticatedUser({
      id: "user-1",
      email: "seller@example.com",
      fullName: "Seller One",
      status: "active",
      role: {
        id: "role-seller",
        name: "seller",
        displayName: "Vendedor"
      }
    });

    expect(AuthenticatedUserSchema.parse(user)).toEqual(user);
    expect(user).not.toHaveProperty("permissions");
    expect(user.role.name).toBe("seller");
  });
});
